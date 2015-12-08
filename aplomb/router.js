var hash = require('hash.murmur3.32')
var fnv = require('b-tree/benchmark/fnv')

function Router (options) {
    this.delegates = options.delegates
    this.extract = options.extract
    var length = 256, dist = Math.floor(length / options.delegates.length)
    this.buckets = []
    this.delegates.forEach(function (del) {
        for (var i=0; i<dist; i++) {
            length--
            this.buckets.push({
                url: del
            })
        }
    }, this)
    while (length-- > 0) {
        this.buckets.push({ url: this.delegates[this.delegates.length - 1] })
    }
}

Router.prototype.match = function (obj) {
    var key = this.extract(obj)
    return this.buckets[fnv(new Buffer(key), 0, Buffer.byteLength(key)).readUIntLE(0, 1)].url
}

exports.Router = Router
