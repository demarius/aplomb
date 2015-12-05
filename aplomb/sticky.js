var cadence = require('cadence')
var Vizsla = require('vizsla')

function Scheduler (options) {
    this._endpoints = {}
    this._endpoints = options.endpoints
    this._agent = new Vizsla
}

Scheduler.prototype.addEndpoint = cadence(function (async, url, health) {
    // Not checking if URL exists, just reset.
    async(function () {
        this._endpoints[url] = {
            health: health || url,
            mock: mock,
            status: {
                healthy: [ Date.now() ],
                failed: []
            }
        }
        this.health(url, async())
    })
})

Scheduler.prototype.checkEndpoints = cadence(function (async) {
    var healthy = []
    async.forEach(function (url) {
        async(function () {
            this.health(url, async())
        }, function () {
        })
    })(Object.keys(this._endpoints))
})

Scheduler.prototype.health = cadence(function (async, url) {
    // test
    async(function () {
        if (typeof health == 'function') {
            this._endpoints[url].health(url, async())
        } else {
            this._agent.fetch({
                url: url,
                post: this.endpoints[url].health
            }, async())
        }
    }, function (healthy) {
        if (healthy == true) {
            this.endpoints[url].status.healthy.push(Date.now())
        }
        // need to catch error and push to failed, or 'else' failed
    })
})
