var cadence = require('cadence')
var Vizsla = require('vizsla')

function Scheduler (options) {
    this._endpoints = {}
    this._endpoints = options.endpoints
    this._agent = new Vizsla
}

Scheduler.prototype.addEndpoint = cadence(function (async, url, health) {
    async(function () {
        if (typeof health == 'function') {
            health(async())
        } else {
            this._agent.fetch({
                url: url,
                post: health
            }, async())
        }
    }
    }, function () {
        this._endpoints[url] = { health: health, mock: mock }
    })
})

Scheduler.prototype.checkEndpoints = cadence(function (async) {
    async.forEach(function (url) {
    })(this._endpoints)
})

Scheduler.prototype.health = cadence(function (async, url) {
    // test
})
