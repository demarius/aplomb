require('proof')(22, prove)

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

    var delegation = aplomb.addDelegate('127.0.0.1:8080')

    assert(delegation, {
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

    aplomb.addDelegation(1, delegation)

    assert(aplomb.getDelegate({ user: 'a', password: 'p' }), '127.0.0.1:8080', 'get delegate')

    var delegates = aplomb.getDelegates({ user: 'u', password: 'p' })
    assert(delegates, [ '127.0.0.1:8080' ], 'delegates')

    delegation = aplomb.addDelegate('127.0.0.1:8081')

    assert(delegation, {
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

    aplomb.addDelegation(2, delegation)

    delegates = aplomb.getDelegates({ user: 'u', password: 'b' })
    assert(delegates, [ '127.0.0.1:8081', '127.0.0.1:8080' ], 'multiple delegates')

    delegates = aplomb.getDelegates({ user: 'u', password: 'a' })
    assert(delegates, [ '127.0.0.1:8080' ], 'duplicate delegates')

    delegation = aplomb.removeDelegate('127.0.0.1:8081')
    assert(delegation, {
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

    aplomb.addDelegation(3, delegation)

    delegates = aplomb.getDelegates({ user: 'u', password: 'y' })
    assert(delegates, [ '127.0.0.1:8080', '127.0.0.1:8081' ], 'delegate order changed')

    delegation = aplomb.removeDelegate('127.0.0.1:8080')
    assert(delegation, { buckets: null, delegates: [] }, 'remove down to zero')

    aplomb.addDelegation(4, delegation)

    assert(aplomb.getDelegate({ user: 'a', password: 'p' }), null, 'get delegate no delegates')

    delegates = aplomb.getDelegates({ user: 'u', password: 'b' })
    assert(delegates, [ '127.0.0.1:8080', '127.0.0.1:8081' ], 'delegate skip null')

    delegation = aplomb.addDelegate('127.0.0.1:8081')
    assert(delegation, {
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
    aplomb.addDelegation(5, delegation)

    delegates = aplomb.getDelegates({ user: 'u', password: 'x' })
    assert(delegates, [ '127.0.0.1:8081', '127.0.0.1:8080' ], 'delegates after empty delegation')

    aplomb.addDelegation(6, aplomb.addDelegate('127.0.0.1:8080'))

    delegation = aplomb.replaceDelegate('127.0.0.1:8080', '127.0.0.1:8082')
    assert(delegation, {
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
    aplomb.addDelegation(7, delegation)

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

    delegation = aplomb.addDelegate('127.0.0.1:8080')
    assert(delegation, {
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
    aplomb.addDelegation(8, delegation)
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

    var connection
    while (connection = aplomb.evictable('127.0.0.1:8080')) {
            aplomb.removeConnection(connection)
        }
}
