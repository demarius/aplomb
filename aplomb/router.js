var hash = require('hash.murmur3.32')
var fnv = require('b-tree/benchmark/fnv')

function Router (options) {
    this.distribute(options.delegates)
    this.extract = options.extract
}

Router.prototype.match = function (obj) {
    var key = this.extract(obj)
    return this.buckets[fnv(new Buffer(key), 0, Buffer.byteLength(key)).readUIntLE(0, 1)].url
}

Router.prototype.distribute = function (delegates) {
    var length = 256, dist = Math.floor(length / delegates.length)
    this.delegates = delegates
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

Router.prototype.newDelegate = function (del) {
// redistribute buckets
}

Router.prototype.removeDelegate = function () {
// keep old config until migration complete
}


exports.Router = Router
