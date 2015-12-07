#!/usr/bin/env/node

require('proof')(1, function (assert) {
   assert(require('../../../aplomb/shard.js'), 'require')
})
