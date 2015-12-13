require('proof')(6, prove)

function prove(assert) {
    var r = require('../../../aplomb/router.js')
    var delegates = [
            'http://192.168.0.14:8080',
            'http://192.168.0.14:5432/blah/two',
            'http://192.168.0.14:2345'
        ]
    var unversioned = new r.Router({
        delegates: delegates,
        extract: function (obj) {
            return obj.key
        }
    })

    var router = new r.Router({
        delegates: delegates,
        extract: function (obj) {
            return obj.username + ':' + obj.password
        },
        version: 1//,
        //incrementVersion: function (x) {return x + 2}
    })
    var dist = Math.floor(256, router.routes[0].delegates.length)

    assert(router.routes[0].buckets[120].url, delegates[1], 'true')

    assert(delegates.indexOf(router.match({ key: 'shep' })) > -1, 'delegate matched')

    router.add('http://192.173.0.14:2381')
    router.incrementVersion = function (x) {return x + 2}
    router.add('http://192.173.0.14:2382')

    assert(router.routes[0].delegates.indexOf('http://192.173.0.14:2381') > -1,
    'delegate added')

    var indices = 0
    for (var b in router.routes[0].buckets) {
        if (router.routes[0].buckets[b].url == 'http://192.173.0.14:2381') {
            indices++
        }
    }

    assert((indices == 51), 'buckets redistributed')
    router.remove('http://192.173.0.14:2381')
    router.remove('http://192.173.0.14:2382')

    assert((dist == Math.floor(256, router.routes[0].delegates.length)),
    'distribution reproduced')

    assert((router.routes[0].version == 8), 'version incremented')

    router.addConnection(9, { username: 'user', password: 'pass' })
}