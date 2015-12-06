Round-robin in Python with UDP. https://github.com/kmcminn/udprr

Sticky scheduling in Javascript. https://github.com/SocketCluster/loadbalancer


main object should keep endpoints. we shouldn't have to govern them equally.
we should be able to create a new scheduler and give it some endpoints and
govern them however, and another, governed another way, and why should we
not be able to switch each runtime?

that should also give us room to support endpoint-specific rules easily.
Somehow.

then who should pay attention to health, and how?

we can put each scheduling algorithm in a function in a file.
/sticky.js, /whatever.js.

what are these schedulers going to be doing exactly. user might want
to check health differently depending on scheduling. shouldn't we know
already (depending)? we should just give it some endpoints, a health
mechanism, a scheduling mechanism. Or it will know what health to use.
I don't know.

# Sharding.

request comes. hash on a request[thing] to find its bucket, send it on its way.

So all we are really thinking about is where.

Alan said we could `&` the hash value.
but how is a bucket chosen, anyway? It sounded like it's up to the client.
oh right. whoever's got the bucket, cuz we're supposed to keep track of
who has which buckets. duh. right.
