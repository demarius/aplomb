var hash = require('hash.murmur3.32')
var fnv = require('b-tree/benchmark/fnv')

function Router (options) {
    this.routes = []
    this.distribute(options.delegates, 256)
    this.extract = options.extract
}

Router.prototype.match = function (obj) {
    var key = this.extract(obj)
    return this.routes[0].buckets[fnv(new Buffer(key), 0, Buffer.byteLength(key)).readUIntLE(0, 1)].url
}

Router.prototype.distribute = function (delegates, length) {
    var dist = Math.floor(length / delegates.length)
    var buckets = []
    delegates.forEach(function (del) {
        for (var i=0; i<dist; i++) {
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
        delegates: delegates
    })
}

Router.prototype.add = function (delegate) {
// redistribute buckets
    var delegates = this.routes[0].delegates
    delegates.push(delegate)
    this.distribute(delegates, this.routes[0].buckets.length)
}

Router.prototype.remove = function (delegate) {
// keep old config until migration complete
    var delegates = this.routes[0].delegates.slice(),
    buckets = this.routes[0].buckets.slice(), indices = []
    delegates = delegates.splice(delegates.indexOf(delegate), 1)
    //this.distribute(delegates)... nah

    for (var b in this.routes[0].buckets) {
        if (this.routes[0].buckets[b].url == delegate) {
            indices.push(b)
        }
    }

    var dist = Math.floor(indices.length, this.routes[0].delegates.length - 1)

    for (var b in indices) {
        for (var i=0; i<dist; i++) {
            buckets[indices[b]].url = delegates[i]
        }
    }

    this.routes.unshift({
        buckets: buckets,
        delegates: delegates
    })
}


exports.Router = Router
