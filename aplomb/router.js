var hash = require('hash.murmur3.32')
var fnv = require('b-tree/benchmark/fnv')

function Router () {
    var length = 255
    this.buckets = []
    while ((length--) > -1) {
        this.buckets.push({
            url: '127.0.0.1'
        })
    }
}

Router.prototype.match = function (key) {
}

exports.Router = Router
