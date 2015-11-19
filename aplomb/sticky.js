var cadence = require('cadence')
var Vizsla = require('vizsla')

function Scheduler (options) {
    this._endpoints = { healthy: [], spotty: [], failed: [] }
    this._endpoints = options.endpoints
    this._agent = new Vizsla
}

Scheduler.prototype.addEndpoint = cadence(function (async, url) {
    async(function () {
        //Scheduler.health(url, async())
    }, function () {
        // add to _endpoints
    })
})

Scheduler.prototype.checkEndpoints = cadence(function (async) {
    async.forEach(function (url) {
    })(this._endpoints)
})

Scheduler.prototype.health = cadence(function (async, url) {
    // test an endpoint
})
