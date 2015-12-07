var hash = require('hash.murmur3.32')
var fnv = require('b-tree/benchmark/fnv')

function Router () {
    var length = 256
    this.buckets = []
    while ((length--) > 0) {
        this.buckets.push({
            url: '127.0.0.1'
        })
    }
}

Router.prototype.match = function (key) {
   return fnv(key, 0, 32).readUIntLE(0, 1)
}

exports.Router = Router
