var RBTree = require('bintrees').RBTree
var fnv = require('hash.fnv')
var monotonic = require('monotonic')

function Router (options) {
    this.routes = []
    options.version = monotonic.parse(options.version)
    this.distribute(options.delegates, 256, options.version)
    this.extract = options.extract
    this.incrementVersion = function (x) {
        return monotonic.increment(x)
    }
    this.connections = [ this.connectionTable(options.version) ]
}

Router.prototype.connectionTable = function (version) {
    return {
        version: version,
        connections: new RBTree(function (a, b) {
            a = this.extract(a)
            b = this.extract(b)
            return a < b ? -1 : a > b ? 1 : 0
        }.bind(this))
    }
}

Router.prototype.getDelegates = function (connection) {
    var key = this.extract(connection), delegates = []
    for (var i = 0, I = this.routes.length; i < I; i++) {
        delegates.push(this.routes[i].buckets[fnv(0, new Buffer(key), 0, Buffer.byteLength(key)) & 0xFF].url)
    }
    return delegates.filter(function (del, i, set) {
        return (set.indexOf(del) == i)
    })
}

Router.prototype.distribute = function (delegates, length, version) {
    var dist = Math.floor(length / delegates.length)
    var buckets = []

    delegates.forEach(function (del) {
        for (var i = 0; i < dist; i++) {
            length--
            buckets.push({
                url: del
            })
        }
    }, this)

    while (length-- > 0) {
        buckets.push({ url: delegates[delegates.length - 1] })
    }

    this.routes.unshift({
        buckets: buckets,
        delegates: delegates,
        version: version
    })
}

Router.prototype.addDelegate = function (delegate) {
    var delegates = this.routes[0].delegates.slice(),
    buckets = this.routes[0].buckets.slice(),
    redist = Array.apply(null, Array(delegates.length)).map(Number.prototype.valueOf, 0)
    delegates.push(delegate)

    var dist = Math.floor(buckets.length / delegates.length)
    dist = Math.floor(dist / (delegates.length - 1))

    for (var b = 0, I = buckets.length; b < I; b++) {
        if (redist[delegates.indexOf(buckets[b].url)] == dist) continue
        redist[delegates.indexOf(buckets[b].url)] += 1
        buckets[b].url = delegate
    }

    this.routes.unshift({
        buckets: buckets,
        delegates: delegates,
        version : this.incrementVersion(this.routes[0].version)
    })
}

Router.prototype.removeDelegate = function (delegate) {
    var delegates = this.routes[0].delegates.slice(),
    buckets = this.routes[0].buckets.slice(), indices = []
    delegates = delegates.splice(delegates.indexOf(delegate), 1)

    for (var b = 0, I = buckets.length; b < I; b++) {
        if (this.routes[0].buckets[b].url == delegate) {
            indices.push(b)
        }
    }

    var dist = Math.floor(indices.length, this.routes[0].delegates.length - 1)

    for (var b = 0, I = indices.length; b < I; b++) {
        for (var i=0; i<dist; i++) {
            buckets[indices[b]].url = delegates[i]
        }
    }

    this.routes.unshift({
        buckets: buckets,
        delegates: delegates,
        version: this.incrementVersion(this.routes[0].version)
    })
}

Router.prototype.addConnection = function (version, connection) {
    version = monotonic.parse(version)

    var i = 0, I
    for (var compare, I = this.connections.length; i < I; i++) {
        compare = monotonic.compare(version, this.connections[i].version)
        if (compare == 0) {
            break
        } else if (compare > 0) {
            this.connections.splice(i, 0, this.connectionTable(version))
            break
        }
    }
    if (i == I) {
        this.connections.push(this.connectionTable(version))
    }
    this.connections[i].connections.insert(connection)
}

Router.prototype.removeConnection = function (connection) {
   var i=0, indices = []
   for (var I = this.connections.length; i < I;) {
        var tree = this.connections[i].connections
        tree.remove(connection)
        if (tree.size == 0) {
            this.connections.splice(i, 1)
            I--
        } else { i++ }
    }
}

Router.prototype.getConnection = function (connection) {
    for (var conn, i = 0, I = this.connections.length; i < I; i++) {
        if (conn = this.connections[i].connections.find(connection)) {
            return conn
        }
    }
    return null
}

Router.prototype.evictable = function (delegate) {
    var routerVers = this.routes[0].version
    for (var i = 0, I = this.connections.length; i < I;) {
        var compare = monotonic.compare(routerVers, this.connections[i].version)
        if (compare <= 0) {
            i++
            continue
        }

        while (this.connections[i].connections.size > 0) {
            var min = this.connections[i].connections.min(),
                current = this.getDelegates(min)
            if (current == delegate) {
                this.connections[i].connections.remove(min)
                this.addConnection(monotonic.toString(routerVers), min)
            } else {
                return min
            }
        }
        this.connections.splice(i, 1)
        I--
    }
    return null
}

module.exports = Router
