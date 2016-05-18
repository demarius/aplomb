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
            incrementVersion: function (x) {return x + 1},
            sort: function (a, b) {
                return a - b
            },
            extract: function (obj) {
                return obj.username + ':' + obj.password
            }
        }), table, distribution

    delegates.forEach(function (del, i) {
        table = router.addDelegate(del)
        console.log(table)
        router.addTable(table, i + 1)
    })

    table = router.delegations.max().table,
    distribution = Math.floor(256, table.delegates.length)

    assert(table.buckets[120].url, delegates[1], 'true')

    table = router.addDelegate('http://192.173.0.14:2381')
    router.addTable(table, 4)
    table = router.addDelegate('http://192.173.0.14:2382')
    router.addTable(table, 5)

    assert(router.delegations.max().table.delegates.indexOf('http://192.173.0.14:2381') > -1,
    'delegate added')

    var indices = 0, table = router.delegations.max().table
    for (var b in table.buckets) {
        if (table.buckets[b].url == 'http://192.173.0.14:2381') {
            indices++
        }
    }

    assert((indices == 51), 'buckets redistributed')

    table = router.replaceDelegate('http://192.173.0.14:2382', 'http://192.173.0.14:2383')
    router.addTable(table, 6)

    assert(router.delegations.max().table.delegates.indexOf('http://192.173.0.14:2382') == -1, 'delegate replaced')

    table = router.removeDelegate('http://192.173.0.14:2381')
    router.addTable(table, 7)
    table = router.removeDelegate('http://192.173.0.14:2383')
    router.addTable(table, 8)

    assert((router.delegations.max().key == 8), 'version incremented')

    assert((distribution == Math.floor(256, router.delegations.max().table.delegates.length)),
    'distribution reproduced')

    var b = router.connectionTree(12)

    assert((b.key == 12), 'generated connection table')


    router.addConnection(1, { username: 'user', password: 'pass' })

    router.addConnection(2, { username: 'user', password: 'pass' })
    router.addConnection(2, { username: 'user', password: 'pass' })

    router.addConnection(6, { username: 'userr', password: 'ppass' })
    router.addConnection(6, { username: 'fewer', password: 'sass' })

    router.removeConnection({ username: 'fewer', password: 'sass' })

    router.addConnection(6, { username: 'bluer', password: 'sass' })

    router.removeConnection({ username: 'user', password: 'pass' })

    assert((router.connections.size == 3), 'trees generated')
    router.addConnection(2, { username: 'user', password: 'pass' })
    router.addConnection(2, { username: 'userr', password: 'ppass' })

    assert((router.connections.max().key == 6), 'connection version managed')

    assert((delegates.indexOf(router.getDelegates({username : 'bluer', password:
    'sass'})[0]) > -1), 'matched')
    table = router.removeDelegate('http://192.173.0.14:8080')
    router.addTable(table, 9)

    var evict = router.evictable('http://192.168.0.14:8080')
    console.log('evicted', evict)
    //assert((evict.username == 'user'), 'evicted old')

    console.log(router.getConnection({username: 'userr', password: 'ppass'}))
    assert((router.getConnection({username: 'userr', password: 'ppass'}).username
    == 'userr'), 'got connection')

    assert((router.getConnection({}) == null), 'not found')

    for (var e, del = 0, I = delegates.length; del < I; del++) {
        while (e = router.evictable(delegates[del])) {
            console.log('evicting', e)
            router.removeConnection(e)
        }
        assert((router.evictable(delegates[del]) == null), 'all evicted')
    }

    assert(router.getTable({ key: 2 }).key == 2, 'fetched table')
}
