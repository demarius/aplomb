Load balancer with configurable scheduling and balancing.


### Usage:

Create a router with some delegates and a key extraction function.
```
var Aplomb = require('./aplomb')

var aplomb = new Aplomb({
    bucketCount: 256,
    compare: function (a, b) { return a - b },
    extract: function (connection) { // extract key from connection
        return connection.key }
})

```

Add a delegate and we'll give you a delegation.

```
var delegation = aplomb.addDelegate('http://192.173.0.14:2381')

aplomb.addDelegation(1, delegation) // 1 is the key for this delegation

delegation = aplomb.replaceDelegate('http://192.173.0.14:2381', 'http://localhost:5000')

aplomb.addConnection(3, { key: 'soup' } )

aplomb.addDelegation(2, delegation)

```


Use `evictable` to sniff out dead connections.

```
    var old;
    while (old = aplomb.evictable('http://192.173.0.14:2381')) {
        console.log(old)
    }
```
