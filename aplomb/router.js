var hash = require('hash.murmur3.32')
var fnv = require('b-tree/benchmark/fnv')

function Router (options) {
    this.routes = []
    this.distribute(options.delegates, 256)
    this.extract = options.extract
}

Router.prototype.match = function (obj) {
    var key = this.extract(obj)
    return this.buckets[fnv(new Buffer(key), 0, Buffer.byteLength(key)).readUIntLE(0, 1)].url
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
}

Router.prototype.remove = function (delegate) {
// keep old config until migration complete
}


exports.Router = Router
