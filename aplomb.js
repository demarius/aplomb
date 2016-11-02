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

Aplomb.prototype.max = function () {
    return this.delegations.max()
}

Aplomb.prototype.getEnactedDelegation = function () {
    var delegations = this.delegations.iterator(), delegation

    while (delegation = delegations.prev()) {
        if (delegation.enacted) {
            break
        }
    }

    if (delegation == null || delegation.delegates.length == 0) {
        return null
    }

    return delegation
}

Aplomb.prototype.getIndex = function (connection) {
    var key = this.extract(connection)
    var hash = fnv(0, new Buffer(key), 0, Buffer.byteLength(key))

    return hash % this.bucketCount
}

Aplomb.prototype.getDelegates = function (connection) {
    var key = this.extract(connection)
    var hash = fnv(0, new Buffer(key), 0, Buffer.byteLength(key))
    var index = hash % this.bucketCount
    var delegates = []

    this.delegations.reach(function (delegation) {
        if (delegation.delegates.length !== 0) {
            delegates.push(delegation.buckets[index])
        }
    })

    return delegates.filter(function (delegate, i, set) {
        return (set.indexOf(delegate) == i)
    })
}

Aplomb.prototype.getDelegate = function (connection) {
    var delegation = this.getEnactedDelegation()
    var index = this.getIndex(connection)

    return delegation ? delegation.buckets[index] : null
}

Aplomb.prototype.addDelegate = function (key, delegate) {
    if (this.delegations.size) {

        var delegation = this.delegations.max()
        var delegates = delegation.delegates.slice()

        if (~delegates.indexOf(delegate)) {
            return {
                key: key,
                enacted: false,
                buckets: delegation.buckets,
                delegates: delegates
            }
        }

        if (delegates.length) {
            var buckets = delegation.buckets.slice()
            var redist = Array.apply(null, Array(delegates.length))
                         .map(Number.prototype.valueOf, 0)

            delegates.push(delegate)

            var total = Math.ceil(buckets.length / delegates.length)
            var each = Math.ceil(total / (delegates.length - 1))

            /*
            for (var b = 0, I = buckets.length; b < I && total; b++) {
                redist[delegates.indexOf(buckets[b])]++
                if (redist[delegates.indexOf(buckets[b])] == each) continue

                buckets[b] = delegate
                total--
            }*/
	    var block, remainder = this.bucketCount % delegates.length, k = 0
	    for (var i = 0, I = delegates.length; i < I; i++) {
		block = Math.floor(this.bucketCount / delegates.length) + (Math.max(0, remainder--) ? 1 : 0)
		for (var j = 0; j < block; j++) {
		    buckets[k++] = delegates[i]
		}
	    }

            return {
                key: key,
                enacted: false,
                buckets: buckets,
                delegates: delegates
            }
        }
    }

    return {
        key: key,
        enacted: false,
        buckets: Array.apply(null, Array(this.bucketCount))
                      .map(String.prototype.toString, delegate),
        delegates: [ delegate ]
    }
}

Aplomb.prototype.removeDelegate = function (key, delegate) {
    assert(this.delegations.size)

    var delegation = this.delegations.max()

    if (delegation.delegates.length > 1) {
        if (!~delegation.delegates.indexOf(delegate)) {
            return {
                key: key,
                enacted: false,
                buckets: delegation.buckets,
                delegates: delegation.delegates
            }
        }

        var delegates = delegation.delegates.slice()
        var buckets = delegation.buckets.slice()
        var index = delegates.indexOf(delegate)

        assert(~index, 'index not found')

        delegates.splice(index, 1)

        for (var i = 0, b = 0, B = buckets.length; b < B; b++) {
            if (buckets[b] == delegate) {
                buckets[b] = delegates[i++ % delegates.length]
            }
        }

        return {
            key: key,
            enacted: false,
            buckets: buckets,
            delegates: delegates
        }
    }

    return {
        key: key,
        enacted: false,
        buckets: null,
        delegates: []
    }
}

Aplomb.prototype.replaceDelegate = function (key, oldDelegate, newDelegate) {
    var delegation = this.delegations.max()
    var buckets = delegation.buckets.slice()

    var delegates = delegation.delegates.map(function (delegate) {
        return delegate == oldDelegate ? newDelegate : delegate
    })

    for (var b = 0, I = buckets.length; b < I; b++) {
        if (delegation.buckets[b] == oldDelegate) {
            buckets[b] = newDelegate
        }
    }

    return {
        key: key,
        enacted: false,
        buckets: buckets,
        delegates: delegates
    }
}

Aplomb.prototype.getDelegations = function () {
    var delegations = []

    this.delegations.reach(function (delegation) {
        delegations.push(delegation)
    })

    return delegations
}

Aplomb.prototype.addDelegation = function (delegation) {
    this.delegations.insert(delegation)

    this.connections.insert({
        key: delegation.key,
        connections: new RBTree(function (a, b) {
            a = this.extract(a)
            b = this.extract(b)
            return a < b ? -1 : a > b ? 1 : 0
        }.bind(this))
    })
}

Aplomb.prototype.removeDelegation = function (key) {
    this.connections.remove({ key: key })

    return this.delegations.remove({ key: key })
}

Aplomb.prototype.addConnection = function (key, connection) {
    var tree = this.connections.find({ key: key })

    if (tree === null) {
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
        found = !! tree.connections.remove(connection) || found
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
    var latest = this.getEnactedDelegation()
    if (!latest) return null

    var tree
    var compare = this.compare
    var iterator = this.connections.iterator()

    if (((tree = iterator.next()) != null) &&
        compare(tree.key, latest.key) != 0) {
        while (tree.connections.size != 0) {
            var connection = tree.connections.min()

            if (this.getDelegate(connection) == delegate) {
                tree.connections.remove(connection)
                this.addConnection(latest.key, connection)
            } else {

                return {
                    type: 'connection',
                    connection: connection
                }
            }
        }

        return {
            type: 'delegation',
            key: tree.key
        }
    }

    return null
}

module.exports = Aplomb
