require('proof')(9, prove)

function prove(assert) {
    var r = require('../../../aplomb/router.js')
    var delegates = [
            'http://192.168.0.14:8080',
            'http://192.168.0.14:5432/blah/two',
            'http://192.168.0.14:2345'
        ]
    var router = new r.Router({
        delegates: delegates,
        extract: function (obj) {
            return obj.username + ':' + obj.password
        },
        version: '1'//,
        //incrementVersion: function (x) {return x + 2}
    })
    var dist = Math.floor(256, router.routes[0].delegates.length)

    assert(router.routes[0].buckets[120].url, delegates[1], 'true')

    assert(delegates.indexOf(router.match({ key: 'shep' })) > -1, 'delegate matched')

    router.add('http://192.173.0.14:2381')
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
    assert((router.routes[0].version == 4), 'version incremented')
    router.incrementVersion = function (x) {return parseInt(x) + 2}
    router.remove('http://192.173.0.14:2382')
    assert((router.routes[0].version == 6), 'version increment swapped')

    assert((dist == Math.floor(256, router.routes[0].delegates.length)),
    'distribution reproduced')


    router.addConnection('1.1', { username: 'user', password: 'pass' })
    router.addConnection('1.2', { username: 'user', password: 'pass' })
    router.addConnection('2', { username: 'user', password: 'pass' })
    router.addConnection('9', { username: 'userr', password: 'ppass' })
    router.addConnection('9', { username: 'fewer', password: 'sass' })

    router.removeConnection({ username: 'fewer', password: 'sass' })

    router.addConnection('9', { username: 'bluer', password: 'sass' })

    router.removeConnection({ username: 'user', password: 'pass' })

    assert((router.connections[0].connections.size == 2), 'tables shredded')

    assert((router.connections[0].version[0] == 9), 'connection version\
    managed')
}
