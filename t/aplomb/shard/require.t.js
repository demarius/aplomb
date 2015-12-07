require('proof')(1, prove)
function prove (assert) {
   assert(require('../../../aplomb/shard.js'), 'require')
}
