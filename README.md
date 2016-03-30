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

Add and remove delegates and we'll redistribute for you. Grab the new
configuration whenever you like.
