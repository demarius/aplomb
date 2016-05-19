var RBTree = require('bintrees').RBTree
var fnv = require('hash.fnv')

function Aplomb (options) {
    //this.delegations = []
    this.sort = options.sort
    this.delegations = new RBTree(function (a, b) { return options.sort(a.key, b.key) })
    this.extract = options.extract
    this.incrementVersion = options.incrementVersion
    this.connections = new RBTree(function (a, b) { return options.sort(a.key, b.key) })
}

Aplomb.prototype.connectionTree = function (version) {
    return {
        key: version,
        connections: new RBTree(function (a, b) {
            a = this.extract(a)
            b = this.extract(b)
            return a < b ? -1 : a > b ? 1 : 0
        }.bind(this))
    }
}

Aplomb.prototype.getDelegates = function (connection) {
    var key = this.extract(connection), delegates = [], table = this.delegations.max().table
    this.delegations.each(function (table) {
        table = table.table
        delegates.push(table.buckets[fnv(0, new Buffer(key), 0, Buffer.byteLength(key)) & 0xFF].url)
    })
    return delegates.filter(function (del, i, set) {
        return (set.indexOf(del) == i)
    })
}

Aplomb.prototype.distribute = function (delegates, length) {
    var distribution = Math.floor(length / delegates.length)
    var buckets = []

    delegates.forEach(function (del) {
        for (var i = 0; i < distribution; i++) {
            length--
            buckets.push({
                url: del
            })
        }
    }, this)

    while (length-- > 0) {
        buckets.push({ url: delegates[delegates.length - 1] })
    }

    return { buckets: buckets, delegates: delegates }

}

Aplomb.prototype.addDelegate = function (delegate) {

    if (this.delegations.size) {
        var table, delegates, buckets, redist

        table = this.delegations.max().table
        buckets = table.buckets.slice()
        delegates = table.delegates.slice()

        if (delegates.length) {
            redist = Array.apply(null, Array(delegates.length)).map(Number.prototype.valueOf, 0)

            delegates.push(delegate)

            var dist = Math.floor(buckets.length / delegates.length)
            dist = Math.floor(dist / (delegates.length - 1))

            for (var b = 0, I = buckets.length; b < I; b++) {
                if (redist[delegates.indexOf(buckets[b].url)] == dist) continue
                redist[delegates.indexOf(buckets[b].url)] += 1
                buckets[b].url = delegate
            }

            return { buckets: buckets, delegates: delegates }
        }
    }

    return this.distribute([ delegate ], 256)

}

Aplomb.prototype.removeDelegate = function (delegate) {

    if (this.delegations.size) {
        var table = this.delegations.max().table,
            delegates = table.delegates.slice(),
            buckets = table.buckets.slice(), indices = []

        if (delegates.length > 1) {
            delegates = delegates.splice(delegates.indexOf(delegate), 1)

            for (var b = 0, I = buckets.length; b < I; b++) {
                if (table.buckets[b].url == delegate) {
                    indices.push(b)
                }
            }

            var distribution = Math.floor(indices.length, table.delegates.length - 1)

            for (var b = 0, I = indices.length; b < I; b++) {
                for (var i=0; i<distribution; i++) {
                    buckets[indices[b]].url = delegates[i]
                }
            }

            return { buckets: buckets, delegates: delegates }
        }

        //this.delegations.unshift({ buckets: buckets, delegates: delegates, version: this.incrementVersion(this.delegations[0].version) })
        //this.delegations.insert({ buckets: buckets, delegates: delegates, version: this.incrementVersion(table.version) })
    }

    return this.distribute([ null ], 256)
}

Aplomb.prototype.replaceDelegate = function (oldUrl, newUrl) {
    var table = this.delegations.max().table,
        delegates = table.delegates.slice(),
        buckets = table.buckets.slice()

    delegates = delegates.filter(function (del) {
        return (del !== oldUrl)
    })

    delegates.push(newUrl)

    for (var b = 0, I = buckets.length; b < I; b++) {
        if (table.buckets[b].url == oldUrl) {
            buckets[b].url = newUrl
        }
    }

    //this.delegations.unshift({ buckets: buckets, delegates: delegates, version: this.incrementVersion(this.delegations[0].version) })
    //this.delegations.insert({ buckets: buckets, delegates: delegates, version: this.incrementVersion(table.version) })
    return { buckets: buckets, delegates: delegates }
}

Aplomb.prototype.addConnection = function (key, connection) {
    var tree
    if (tree = this.connections.find(key)) {
        tree.connections.insert(connection)
    } else {
        tree = this.connectionTree(key)
        tree.connections.insert(connection)
        this.connections.insert(tree)
    }
}

Aplomb.prototype.removeConnection = function (connection) {
    /*
   var i = 0, indices = []
   for (var I = this.connections.length; i < I;) {
        var tree = this.connections[i].connections
        tree.remove(connection)
        if (tree.size == 0) {
            this.connections.splice(i, 1)
            I--
        } else { i++ }
    }
   */
    var tree, iterator = this.connections.iterator()

    while (tree = iterator.prev()) {
        tree.connections.remove(connection)
        if (tree.size == 0) {
            this.connections.remove(tree)
        }
    }
}

Aplomb.prototype.getConnection = function (connection) {
    /*
    for (var conn, i = 0, I = this.connections.length; i < I; i++) {
        if (conn = this.connections[i].connections.find(connection)) {
            return conn
        }
    }
    return null
    */
    var delegate, tree, iterator = this.connections.iterator()

    while (tree = iterator.prev()) {
        if (delegate = tree.connections.find(connection)) {
            return delegate
        }
    }

    return null
}

Aplomb.prototype.getTable = function (table) {
    var delegations

    if (delegations = this.delegations.find(table)) {
        return delegations
    }

    return null
}

Aplomb.prototype.addTable = function (table, key) {
    this.delegations.insert({
        table: table,
        key: key
    })
}

Aplomb.prototype.evictable = function (delegate) {
    var tree, current, min, tree, max, iterator, key = this.delegations.max().key,
        connections = this.connections.iterator()
    //for (var i = 0, I = this.connections.length; i < I;) {
    max = connections.prev()
    while (tree = connections.prev()) {


        while (tree.connections.size > 0) {
            min = tree.connections.min()
            current = this.getDelegates(min)

            if (current.indexOf(delegate)) {
                tree.connections.remove(min)
                this.addConnection(key, min)
            } else {
                return min
            }
        }

        this.connections.remove(tree)
    }

    return null
}

module.exports = Aplomb
