var RBTree = require('bintrees').RBTree
var fnv = require('hash.fnv')

function Aplomb (options) {
    this.compare = options.compare
    this.delegations = new RBTree(compare)
    this.extract = options.extract
    this.bucketCount = options.bucketCount
    this.connections = new RBTree(compare)

    function compare (a, b) { return options.compare(a.key, b.key) }
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

Aplomb.prototype.getIndex = function (connection) {
    var key = this.extract(connection),
        hash = fnv(0, new Buffer(key), 0, Buffer.byteLength(key))
    return hash % this.bucketCount
}

Aplomb.prototype._key = function (connection) {
}

Aplomb.prototype.getDelegates = function (connection) {
    var index = this.getIndex(connection),
        delegates = []

    this.delegations.reach(function (delegation) {
        if (delegation.delegates.length ! = 0) {
            delegates.push(delegates.bucket[index])
        }
    })

    return delegates.filter(function (del, i, set) {
        return (set.indexOf(del) == i)
    })
}

Aplomb.prototype.getDelegate = function (connection) {
    var delegation = this.delegations.max()
    if (delegation == null || delegation.delegates.length == 0) return null
    return delegation.buckets[this.getIndex(connection)]
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
        var delegation = this.delegations.max(),
            delegates = delegation.delegates

        if (delegates.length) {
            var buckets = delegation.buckets.slice(),
                redist = Array.apply(null, Array(delegates.length)).map(Number.prototype.valueOf, 0)

            delegates.push(delegate)

            var total = Math.floor(buckets.length / delegates.length)
            var each = Math.floor(total / (delegates.length - 1))

            for (var b = 0, I = buckets.length; b < I && total; b++) {
                if (redist[delegates.indexOf(buckets[b])] == each) continue
                redist[delegates.indexOf(buckets[b])] += 1
                buckets[b] = delegate
                total--
            }

            return { buckets: buckets, delegates: delegates }
        }
    }

    return {
        buckets: Array.apply(null, Array(this.bucketCount)).map(String.prototype.toString, delegate),
        delegates: [ delegate ]
    }

}

Aplomb.prototype.removeDelegate = function (delegate) {
    assert(this.delegations.size, 'No delegations found')

    var delegation = this.delegations.max()
    if (delegation.delegates.length > 1) {
        var delegates = delegation.delegates.slice(),
            buckets = delegation.buckets.slice(),
            index = delegates.indexOf(delegate)

        assert(~index, 'index not found')
        delegates.splice(index, 1)

        for (var i = 0, b = 0, I = buckets.length; b < I; b++) {
            if (buckets[b] == delegate) {
                buckets[b] = delegates[i++ % delegates.length]
            }
        }


        return { buckets: buckets, delegates: delegates }
    }

    return { buckets: null, delegates: [] }
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
    var tree, iterator = this.connections.iterator()

    while (tree = iterator.prev()) {
        tree.connections.remove(connection)
        if (tree.size == 0) {
            this.connections.remove(tree)
        }
    }
}

Aplomb.prototype.getConnection = function (connection) {
    var delegate, tree, iterator = this.connections.iterator()

    while (tree = iterator.prev()) {
        if (delegate = tree.connections.find(connection)) {
            return delegate
        }
    }

    return null
}

Aplomb.prototype.getDelegation = function (table) {
    var delegations

    if (delegations = this.delegations.find(table)) {
        return delegations
    }

    return null
}

Aplomb.prototype.addDelegation = function (table, key) {
    this.delegations.insert({
        table: table,
        key: key
    })
}

Aplomb.prototype.evictable = function (delegate) {
    var tree, current, min, tree, max, iterator, key = this.delegations.max().key,
        connections = this.connections.iterator()
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
