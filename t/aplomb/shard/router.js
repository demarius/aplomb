require('proof')(1, prove)

function prove(assert) {
    var r = new require('../../../aplomb/router.js')
    var router = new r.Router({
        delegates: [
            'http://192.168.0.14:8080',
            'http://192.168.0.14:8080',
            'http://192.168.0.14:8080'
        ]
    })

    console.log(router.buckets)
    assert(true, 'true')
}
