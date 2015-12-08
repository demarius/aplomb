var hash = require('hash.murmur3.32')
var fnv = require('b-tree/benchmark/fnv')

function Router (options) {
    this.delegates = options.delegates
    var length = Math.max(256, this.delegates.length)
    this.buckets = []
    while ((length--) > 0) {
        this.buckets.push({
            url: options.delegates.shift() || '127.0.0.1'
        })
    }
}

Router.prototype.match = function (key) {
   return fnv(key, 0, 32).readUIntLE(0, 1)
}

exports.Router = Router
