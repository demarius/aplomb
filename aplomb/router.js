var RBTree = require('bintrees').RBTree
var hash = require('hash.murmur3.32')
var fnv = require('hash.fnv')

function Router (options) {
    this.routes = []
    this.distribute(options.delegates, 256, options.version || 0) // switch to
    //monotonic
    this.extract = options.extract
    this.incrementVersion = options.incrementVersion || function (x) {
        return  x + 1
    }
    this.connections = [{
        version: options.version || 0, //switch to monotonic
        connections: new RBTree(function (a, b) {
            a = this.extract(a)
            b = this.extract(b)
            return a < b ? -1 : a > b ? 1 : 0
        }.bind(this))
    }]
}

Router.prototype.match = function (obj) {
    var key = this.extract(obj)
    return this.routes[0].buckets[fnv(0, new Buffer(key), 0,
    Buffer.byteLength(key)) & 0xFF].url
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

Router.prototype.add = function (delegate) {
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

Router.prototype.remove = function (delegate) {
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
    //compare versions
    //if (version > this.connections[0].version)
    if (!this.connections[0].connections.insert(connection)) {
        //trouble
    }
}

Router.prototype.removeConnection = function (version, connection) {
    if (!this.connections[0].connections.remove(connection)) {
    }
}

Router.prototype.evict = function () {
}

Router.prototype.evictable = function (latest) {
}


exports.Router = Router
