require('proof')(30, prove)

function prove(assert) {
    var Aplomb = require('..')

    var aplomb = new Aplomb({
            bucketCount: 7,
            compare: function (a, b) { return a - b },
            extract: function (connection) {
                        return connection.user + ':' + connection.password
                    }
        })

    assert(aplomb.getDelegate({ user: 'a', password: 'p' }), null, 'get delegate no delegations')

    var delegation = aplomb.addDelegate(1, '127.0.0.1:8080')

    assert(delegation, {
            key: 1,
            enacted: false,
            buckets: [
                        '127.0.0.1:8080',
                        '127.0.0.1:8080',
                        '127.0.0.1:8080',
                        '127.0.0.1:8080',
                        '127.0.0.1:8080',
                        '127.0.0.1:8080',
                        '127.0.0.1:8080'
                    ],
            delegates: [ '127.0.0.1:8080' ]
        }, 'add delegate')

    aplomb.addDelegation(delegation)

    assert(aplomb.getDelegate({ user: 'a', password: 'p' }), null, 'get delegate not enacted')
    assert(aplomb.evictable(''), null, 'evictable no enacted delegation')
    delegation.enacted = true
    assert(aplomb.getDelegate({ user: 'a', password: 'p' }), '127.0.0.1:8080', 'get delegate')

    var delegates = aplomb.getDelegates({ user: 'u', password: 'p' })
    assert(delegates, [ '127.0.0.1:8080' ], 'delegates')

    delegation = aplomb.addDelegate(2, '127.0.0.1:8081')

    assert(delegation, {
            key: 2,
            enacted: false,
            buckets: [
                        '127.0.0.1:8081',
                        '127.0.0.1:8081',
                        '127.0.0.1:8081',
                        '127.0.0.1:8081',
                        '127.0.0.1:8080',
                        '127.0.0.1:8080',
                        '127.0.0.1:8080'
                    ],
            delegates: [ '127.0.0.1:8080', '127.0.0.1:8081' ]
        }, 'add delegate')

    aplomb.addDelegation(delegation)
    delegation.enacted = true

    delegates = aplomb.getDelegates({ user: 'u', password: 'b' })
    assert(delegates, [ '127.0.0.1:8081', '127.0.0.1:8080' ], 'multiple delegates')

    delegates = aplomb.getDelegates({ user: 'u', password: 'a' })
    assert(delegates, [ '127.0.0.1:8080' ], 'duplicate delegates')

    delegation = aplomb.removeDelegate(3, '127.0.0.1:8081')
    assert(delegation, {
            key: 3,
            enacted: false,
            buckets: [
                        '127.0.0.1:8080',
                        '127.0.0.1:8080',
                        '127.0.0.1:8080',
                        '127.0.0.1:8080',
                        '127.0.0.1:8080',
                        '127.0.0.1:8080',
                        '127.0.0.1:8080'
                    ],
            delegates: [ '127.0.0.1:8080' ]
        }, 'remove down to one')

    aplomb.addDelegation(delegation)
    delegation.enacted = true

    delegates = aplomb.getDelegates({ user: 'u', password: 'y' })
    assert(delegates, [ '127.0.0.1:8080', '127.0.0.1:8081' ], 'delegate order changed')

    delegation = aplomb.removeDelegate(4, '127.0.0.1:8080')
    assert(delegation, {
            key: 4, enacted: false, buckets: null, delegates: []
        }, 'remove down to zero')

    aplomb.addDelegation(delegation)
    delegation.enacted = true

    assert(aplomb.getDelegate({ user: 'a', password: 'p' }), null, 'get delegate no delegates')

    delegates = aplomb.getDelegates({ user: 'u', password: 'b' })
    assert(delegates, [ '127.0.0.1:8080', '127.0.0.1:8081' ], 'delegate skip null')

    delegation = aplomb.addDelegate(5, '127.0.0.1:8081')
    assert(delegation, {
            key: 5,
            enacted: false,
            buckets: [
                        '127.0.0.1:8081',
                        '127.0.0.1:8081',
                        '127.0.0.1:8081',
                        '127.0.0.1:8081',
                        '127.0.0.1:8081',
                        '127.0.0.1:8081',
                        '127.0.0.1:8081'
                    ],
            delegates: [ '127.0.0.1:8081' ]
        }, 'add after delete')
    aplomb.addDelegation(delegation)
    delegation.enacted = false

    delegates = aplomb.getDelegates({ user: 'u', password: 'x' })
    assert(delegates, [ '127.0.0.1:8081', '127.0.0.1:8080' ], 'delegates after empty delegation')

    aplomb.addDelegation(aplomb.addDelegate(6, '127.0.0.1:8080'))
    aplomb.max().enacted = true

    delegation = aplomb.replaceDelegate(7, '127.0.0.1:8080', '127.0.0.1:8082')
    assert(delegation, {
            key: 7,
            enacted: false,
            buckets: [
                        '127.0.0.1:8082',
                        '127.0.0.1:8082',
                        '127.0.0.1:8082',
                        '127.0.0.1:8082',
                        '127.0.0.1:8081',
                        '127.0.0.1:8081',
                        '127.0.0.1:8081'
                    ],
            delegates: [ '127.0.0.1:8081', '127.0.0.1:8082' ]
        }, 'replace')
    aplomb.addDelegation(delegation)
    delegation.enacted = true

    delegates = aplomb.getDelegates({ user: 'u', password: 'b' })
    assert(delegates, [ '127.0.0.1:8082', '127.0.0.1:8080', '127.0.0.1:8081' ], 'delegates after replace')

    for (var i = 0; i < 6; i++) {
            aplomb.removeDelegation(i)
        }

    delegates = aplomb.getDelegates({ user: 'u', password: 'b' })
    assert(delegates, [ '127.0.0.1:8082', '127.0.0.1:8080' ], 'delegates after remove delegation')

    var delegations = aplomb.getDelegations()
    assert(delegations, [
          { key: 7,
                  enacted: true,
                  buckets:
                   [ '127.0.0.1:8082',
                              '127.0.0.1:8082',
                              '127.0.0.1:8082',
                              '127.0.0.1:8082',
                              '127.0.0.1:8081',
                              '127.0.0.1:8081',
                              '127.0.0.1:8081' ],
                  delegates: [ '127.0.0.1:8081', '127.0.0.1:8082' ] },
          { key: 6,
                  enacted: true,
                  buckets:
                   [ '127.0.0.1:8080',
                              '127.0.0.1:8080',
                              '127.0.0.1:8080',
                              '127.0.0.1:8080',
                              '127.0.0.1:8081',
                              '127.0.0.1:8081',
                              '127.0.0.1:8081' ],
                  delegates: [ '127.0.0.1:8081', '127.0.0.1:8080' ] }
        ], 'delegations')

    delegation = aplomb.addDelegate(8, '127.0.0.1:8080')
    assert(delegation, {
            key: 8,
            enacted: false,
            buckets: [
                        '127.0.0.1:8080',
                        '127.0.0.1:8080',
                        '127.0.0.1:8082',
                        '127.0.0.1:8082',
                        '127.0.0.1:8080',
                        '127.0.0.1:8081',
                        '127.0.0.1:8081'
                    ],
            delegates: [ '127.0.0.1:8081', '127.0.0.1:8082', '127.0.0.1:8080' ]
        }, 'three delegates')
    aplomb.addDelegation(delegation)
    delegation.enacted = true
    console.log(aplomb.getIndex({ user: 'u', password: 'd' }))
    console.log(aplomb.getIndex({ user: 'u', password: 'c' }))
    console.log(aplomb.getIndex({ user: 'u', password: 'g' }))
    console.log(aplomb.getIndex({ user: 'u', password: 'b' }))
    console.log(aplomb.getIndex({ user: 'u', password: 'a' }))
    console.log(aplomb.getIndex({ user: 'u', password: 'e' }))
    console.log(aplomb.getIndex({ user: 'u', password: 'i' }))

    aplomb.addConnection(6, { user: 'u', password: 'd' })
    assert(aplomb.getConnection({ user: 'u', password: 'd' }), { user: 'u', password: 'd' }, 'find')
    aplomb.removeConnection({ user: 'u', password: 'd' })
    assert(aplomb.getConnection({ user: 'u', password: 'd' }), null, 'not found')
    aplomb.addConnection(6, { user: 'u', password: 'd' })
    aplomb.addConnection(6, { user: 'u', password: 'g' })
    aplomb.removeConnection({ user: 'u', password: 'd' })
    assert(aplomb.getConnection({ user: 'u', password: 'd' }), null, 'not found again')
    aplomb.addConnection(6, { user: 'u', password: 'd' })
    aplomb.addConnection(6, { user: 'u', password: 'c' })

    assert(aplomb.getConnectionCount(6), 3, 'get connection count')

    var eviction
    while (eviction = aplomb.evictable('127.0.0.1:8080')) {
        console.log(eviction)
            switch (eviction.type) {
                    case 'connection':
                        aplomb.removeConnection(eviction.connection)
                        break
                    case 'delegation':
                        assert(aplomb.getConnectionCount(6), 0, 'connections removed')
                        aplomb.removeDelegation(eviction.key)
                        aplomb.removeConnectionSet(eviction.key)
                        break
                    }
        }

    assert(aplomb.getConnectionCount(6), 0, 'connection set removed')

    assert(aplomb.addDelegate(9, '127.0.0.1:8080'), {
            key: 9,
            enacted: false,
            buckets: [
                        '127.0.0.1:8080',
                        '127.0.0.1:8080',
                        '127.0.0.1:8082',
                        '127.0.0.1:8082',
                        '127.0.0.1:8080',
                        '127.0.0.1:8081',
                        '127.0.0.1:8081'
                    ],
            delegates: [ '127.0.0.1:8081', '127.0.0.1:8082', '127.0.0.1:8080' ]
        }, 'add delegation already exists')
    assert(aplomb.removeDelegate(9, '127.0.0.1:8083'), {
            key: 9,
            enacted: false,
            buckets: [
                        '127.0.0.1:8080',
                        '127.0.0.1:8080',
                        '127.0.0.1:8082',
                        '127.0.0.1:8082',
                        '127.0.0.1:8080',
                        '127.0.0.1:8081',
                        '127.0.0.1:8081'
                    ],
            delegates: [ '127.0.0.1:8081', '127.0.0.1:8082', '127.0.0.1:8080' ]
        }, 'remove delegation does not exist')
}
