require('proof')(3, function (assert) {
    var Aplomb = require('..')

    var aplomb = new Aplomb({
        bucketCount: 7,
        compare: function (a, b) { return a - b },
        extract: function (connection) {
                return connection.user + ':' + connection.password
        }
    })

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

    assert(aplomb.evictable(''), null, 'evictable no enacted delegation')

    delegation.enacted = true

    assert(aplomb.getDelegate({ user: 'a', password: 'p' }), '127.0.0.1:8080', 'get delegate')
})
