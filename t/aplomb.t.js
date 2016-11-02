require('proof')(9, prove)

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
    //assert(delegates, [ '127.0.0.1:8080' ], 'delegates')

    delegation = aplomb.addDelegate(2, '127.0.0.1:8081')
    aplomb.addDelegation(delegation)

    aplomb.bucketCount = 27
    var delegate
    console.log('delegates: ', aplomb.max().delegates)
    for (var l = 2; l < 8; l++) {
        delegate =  '127.0.0.1:808' + l
        console.log('adding: ', delegate)
        delegation = aplomb.addDelegate(9 + l, delegate)
        aplomb.addDelegation(delegation)
        delegation.enacted = true
    }
    console.log('delegates: ', aplomb.max().delegates)

    var max = aplomb.max(), buckets = max.buckets,
        unique = buckets.filter(function (bucket, i, set) {
        return (set.indexOf(bucket) == i)
    })
    console.log('buckets: ', buckets.length)
    assert(buckets.length, 27, 'extra buckets distributed')


    assert(unique.length, 8, 'Delegates distributed evenly')

    console.log('unique items:', unique)
    //console.log(max)

    aplomb.bucketCount = 50;

    for (l = 8; l < 13; l++) {
        delegation = aplomb.addDelegate(9 + l, '127.0.0.1:808' + l)
        aplomb.addDelegation(delegation)
        delegation.enacted = true
    }
    max = aplomb.max(), buckets = max.buckets,
        unique = buckets.filter(function (bucket, i, set) {
        return (set.indexOf(bucket) == i)
    })

    console.log('unique/delegates: ', unique)
    assert(buckets.length, 50, 'extra buckets distributed')
    assert(unique.length, 12, 'Delegates distributed evenly')
    assert(buckets, [
	'127.0.0.1:8080',
	'127.0.0.1:8080',
	'127.0.0.1:8080',
	'127.0.0.1:8080',
	'127.0.0.1:8080',
        '127.0.0.1:8081',
        '127.0.0.1:8081',
        '127.0.0.1:8081',
        '127.0.0.1:8081',
        '127.0.0.1:8081',
        '127.0.0.1:8082',
        '127.0.0.1:8082',
        '127.0.0.1:8082',
        '127.0.0.1:8082',
        '127.0.0.1:8083',
        '127.0.0.1:8083',
        '127.0.0.1:8083',
        '127.0.0.1:8083',
        '127.0.0.1:8084',
        '127.0.0.1:8084',
        '127.0.0.1:8084',
        '127.0.0.1:8084',
        '127.0.0.1:8085',
        '127.0.0.1:8085',
        '127.0.0.1:8085',
        '127.0.0.1:8085',
        '127.0.0.1:8086',
        '127.0.0.1:8086',
        '127.0.0.1:8086',
        '127.0.0.1:8086',
        '127.0.0.1:8087',
        '127.0.0.1:8087',
        '127.0.0.1:8087',
        '127.0.0.1:8087',
        '127.0.0.1:8088',
        '127.0.0.1:8088',
        '127.0.0.1:8088',
        '127.0.0.1:8088',
        '127.0.0.1:8089',
        '127.0.0.1:8089',
        '127.0.0.1:8089',
        '127.0.0.1:8089',
        '127.0.0.1:80810',
        '127.0.0.1:80810',
        '127.0.0.1:80810',
        '127.0.0.1:80810',
        '127.0.0.1:80811',
        '127.0.0.1:80811',
        '127.0.0.1:80811',
        '127.0.0.1:80811',
        '127.0.0.1:80812',
        '127.0.0.1:80812',
        '127.0.0.1:80812',
        '127.0.0.1:80812'
    ], 'buckets')

    //console.log(aplomb.max())
    //
    assert(Aplomb.prototype._distribute([ 1, 2, 3, 4 ], 12), [ 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4 ], 'distribute')
}
