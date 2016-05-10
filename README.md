Load balancer with configurable scheduling and balancing.


### Usage:

Create a router with some delegates and a key extraction function.
```
var router = require('./aplomb')

router = new router({
    delegates: [                     // list of targets
        'http://192.168.0.14:8080',
        'http://192.168.0.14:2345' ],
    extract: function (connection) { // extract key from connection
        return connection.key },
    version: '1.0'
})

```

Reconfigure as you please; we'll redistribute for you. Grab the new
configuration whenever you like.

```
router.addDelegate('http://192.173.0.14:2381')
router.addDelegate('http://192.173.0.14:2382')
router.replaceDelegate('http://192.173.0.14:2382', 'http://192.173.0.14:2383')
router.removeDelegate('http://192.173.0.14:2381')

router.addConnection(3, { key: 'soup' } )
```


Use `evictable` to sniff out dead connections.

```
    var old;
    while (old = router.evictable('http://192.173.0.14:2382')) {
        console.log(old)
    }
```
