var hash = require('hash.murmur3.32')
var fnv = require('b-tree/benchmark/fnv')

function Router () {
    var length = 255
    this.endpoints = []
    while ((length--) > -1) {
        this.endpoints.push({
            url: '127.0.0.1'
        })
    }
}

Router.prototype.match = function (key) {
}

exports.Router = Router
