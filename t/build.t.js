require('proof')(3, prove)

function prove (assert) {
    var Aplomb = require('..'),
        aplomb = new Aplomb({
	compare: function (a, b) {
	    return a - b
	},
	extract: function (object) {
	    return object.id
	},
	bucketCount: 12,
	delegateCount: 4
    })

    var first = aplomb.createDelegation(1, '127.0.0.1:8081')
    assert(first, {
	key: 1,
	enacted: false,
	buckets: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	delegates: [ '127.0.0.1:8081' ]
    }, 'initial delegation')

    var second = aplomb.createDelegation(2, '127.0.0.1:8082', first)
    assert(second, {
	key: 1,
	enacted: false,
	buckets: [ 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0 ],
	delegates: [ '127.0.0.1:8081', '127.0.0.1:8082' ]
    }, 'second delegation')

    var third = aplomb.createDelegation(3, '127.0.0.1:8083', second)
    assert(third, {
	key: 1,
	enacted: false,
	buckets: [ 0, 0, 0, 1, 1, 1, 2, 2, 2, 0, 0, 0 ],
	delegates: [ '127.0.0.1:8081', '127.0.0.1:8082', '127.0.0.1:8083']
    }, 'third delegation')
}
