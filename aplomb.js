var RBTree = require('bintrees').RBTree
var fnv = require('hash.fnv')
var assert = require('assert')

function Aplomb (options) {
    this.compare = options.compare
    this.extract = options.extract
    this.bucketCount = options.bucketCount
    this.delegations = new RBTree(compare)
    this.connections = new RBTree(compare)

    function compare (a, b) { return options.compare(a.key, b.key) }
}

Aplomb.prototype.getIndex = function (connection) {
    var key = this.extract(connection),
        hash = fnv(0, new Buffer(key), 0, Buffer.byteLength(key))
    return hash % this.bucketCount
}

Aplomb.prototype.getDelegates = function (connection) {
    var index = this.getIndex(connection),
        delegates = []
    this.delegations.reach(function (delegation) {
        if (delegation.delegates.length != 0) {
            delegates.push(delegation.buckets[index])
        }
    })
    return delegates.filter(function (del, i, set) {
        return (set.indexOf(del) == i)
    })
}

Aplomb.prototype.getDelegate = function (connection) {
    var delegation = this.delegations.max()
    if (delegation == null || delegation.delegates.length == 0) {
        return null
    }
    return delegation.buckets[this.getIndex(connection)]
}

Aplomb.prototype.addDelegate = function (delegate) {
    if (this.delegations.size) {
        var delegation = this.delegations.max(),
            delegates = delegation.delegates
        if (delegates.length) {
            var buckets = delegation.buckets.slice(),
                redist = Array.apply(null, Array(delegates.length)).map(Number.prototype.valueOf, 0)

            delegates.push(delegate)

            var total = Math.ceil(buckets.length / delegates.length),
                each = Math.ceil(total / (delegates.length - 1))

            for (var b = 0, I = buckets.length; b < I && total; b++) {
                if (redist[delegates.indexOf(buckets[b])] == each) {
                    continue
                }
                redist[delegates.indexOf(buckets[b])]++
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
    assert(this.delegations.size)

    var delegation = this.delegations.max()
    if (delegation.delegates.length > 1) {
        var delegates = delegation.delegates.slice(),
            buckets = delegation.buckets.slice(),
            index = delegates.indexOf(delegate)

        assert(~index, 'index not found')
        delegates.splice(index, 1)

        for (var i = 0, b = 0, B = buckets.length; b < B; b++) {
            if (buckets[b] == delegate) {
                buckets[b] = delegates[i++ % delegates.length]
            }
        }

        return { buckets: buckets, delegates: delegates }
    }

    return { buckets: null, delegates: [] }
}

Aplomb.prototype.replaceDelegate = function (oldDelegate, newDelegate) {
    var delegation = this.delegations.max(),
        buckets = delegation.buckets.slice()

    var delegates = delegation.delegates.map(function (delegate) {
        return delegate == oldDelegate ? newDelegate : delegate
    })

    for (var b = 0, I = buckets.length; b < I; b++) {
        if (delegation.buckets[b] == oldDelegate) {
            buckets[b] = newDelegate
        }
    }

    return { buckets: buckets, delegates: delegates }
}

Aplomb.prototype.getDelegations = function () {
    var delegations = []

    this.delegations.reach(function (delegation) {
        delegations.push(delegation)
    })

    return delegations
}

Aplomb.prototype.addDelegation = function (key, delegation) {
    this.delegations.insert({
        key: key,
        buckets: delegation.buckets,
        delegates: delegation.delegates
    })
}

Aplomb.prototype.removeDelegation = function (key) {
    return this.delegations.remove({ key: key })
}

Aplomb.prototype.addConnection = function (key, connection) {
    var tree = this.connections.find({ key: key })
    if (tree == null) {
        tree = {
            key: key,
            connections: new RBTree(function (a, b) {
                a = this.extract(a)
                b = this.extract(b)
                return a < b ? -1 : a > b ? 1 : 0
            }.bind(this))
        }
        this.connections.insert(tree)
    }
    tree.connections.insert(connection)
}

Aplomb.prototype.getConnectionCount = function (key) {
    var version = this.connections.find({ key: key })
    return version ? version.connections.size : 0
}

Aplomb.prototype.removeConnectionSet = function (key) {
    return !! this.connections.remove({ key: key })
}

Aplomb.prototype.removeConnection = function (connection) {
    var tree, iterator = this.connections.iterator(), found = false

    while (tree = iterator.prev()) {
        /*
        tree.connections.remove(connection)
        if (tree.connections.size == 0) {
            this.connections.remove(tree)
        }
        */
        found = !! tree.connections.remove(connection) || false
    }

    return found
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

Aplomb.prototype.evictable = function (delegate) {
    var tree

    var compare = this.compare
    var latest = this.delegations.max()
    var iterator = this.connections.iterator()

    if (((tree = iterator.next()) != null) && compare(tree.key, latest.key) != 0) {
        while (tree.connections.size != 0) {
            var connection = tree.connections.min()
            if (this.getDelegate(connection) == delegate) {
                tree.connections.remove(connection)
                this.addConnection(latest.key, connection)
            } else {
                return { type: 'connection', connection: connection }
            }
        }

        return { type: 'delegation', key: tree.key }
    }

    return null
}

module.exports = Aplomb
