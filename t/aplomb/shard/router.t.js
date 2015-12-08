require('proof')(2, prove)

function prove(assert) {
    var r = new require('../../../aplomb/router.js')
    var delegates = [
            'http://192.168.0.14:8080',
            'http://192.168.0.14:5432',
            'http://192.168.0.14:2345'
        ]
    var router = new r.Router({
        delegates: delegates,
        extract: function (obj) {
            return obj.key
        }
    })

    assert(router.buckets[120].url, delegates[1], 'true')

    assert(delegates.indexOf(router.match({ key: 'shep' })) > -1, 'delegate matched')
}
