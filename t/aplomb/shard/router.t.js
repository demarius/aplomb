var monotonic = require('monotonic')
require('proof')(17, prove)

function prove(assert) {
    var Router = require('../../../aplomb.js'),
        delegates = [
            'http://192.168.0.14:8080',
            'http://192.168.0.14:5432/blah/two',
            'http://192.168.0.14:2345'
        ],
        router = new Router({
            delegates: delegates,
            incrementVersion: function (x) {return x + 1},
            sort: function (a, b) {
                return a.key - b.key
            },
            extract: function (obj) {
                return obj.username + ':' + obj.password
            }
        }),
        table = router.routes.max().table,
        distribution = Math.floor(256, table.delegates.length)

    assert(table.buckets[120].url, delegates[1], 'true')

    table = router.addDelegate('http://192.173.0.14:2381')
    router.addTable(table, 2)
    table = router.addDelegate('http://192.173.0.14:2382')
    router.addTable(table, 3)

    assert(router.routes.max().table.delegates.indexOf('http://192.173.0.14:2381') > -1,
    'delegate added')

    var indices = 0, table = router.routes.max().table
    for (var b in table.buckets) {
        if (table.buckets[b].url == 'http://192.173.0.14:2381') {
            indices++
        }
    }

    assert((indices == 51), 'buckets redistributed')

    table = router.replaceDelegate('http://192.173.0.14:2382', 'http://192.173.0.14:2383')
    router.addTable(table, 4)

    assert(router.routes.max().table.delegates.indexOf('http://192.173.0.14:2382') == -1)

    table = router.removeDelegate('http://192.173.0.14:2381')
    router.addTable(table, 5)
    table = router.removeDelegate('http://192.173.0.14:2383')
    router.addTable(table, 6)

    assert((router.routes.max().key == 6), 'version incremented')

    assert((distribution == Math.floor(256, router.routes.max().table.delegates.length)),
    'distribution reproduced')

    var b = router.connectionTable('12')

    assert((b.version == 12), 'generated connection table')


    router.addConnection(1, { username: 'user', password: 'pass' })
    router.addConnection(2, { username: 'user', password: 'pass' })
    router.addConnection(2, { username: 'user', password: 'pass' })
    router.addConnection(6, { username: 'userr', password: 'ppass' })
    router.addConnection(6, { username: 'fewer', password: 'sass' })

    router.removeConnection({ username: 'fewer', password: 'sass' })

    router.addConnection(6, { username: 'bluer', password: 'sass' })

    router.removeConnection({ username: 'user', password: 'pass' })

    assert((router.connections[0].connections.size == 2), 'tables shredded')
    router.addConnection(2, { username: 'user', password: 'pass' })
    router.addConnection(2, { username: 'userr', password: 'ppass' })

    assert((router.connections[0].version[0] == 6), 'connection version\
    managed')

    assert((delegates.indexOf(router.getDelegates({username : 'bluer', password:
    'sass'})[0]) > -1), 'matched')

    var evict = router.evictable('http://192.168.0.14:8080')
    console.log('evicted', evict)
    assert((evict.username == 'user'), 'evicted old')

    assert((router.getConnection({username: 'user', password: 'pass'}).username
    == 'user'), 'got connection')

    assert((router.getConnection({}) == null), 'not found')

    for (var e, del = 0, I = delegates.length; del < I; del++) {
        while (e = router.evictable(delegates[del])) {
            console.log('evicting', e)
            router.removeConnection(e)
        }
        assert((router.evictable(delegates[del]) == null), 'all evicted')
    }

    assert(router.getTable({ version: monotonic.parse('2.0') }).version[0] == 2, 'fetched table')
}
