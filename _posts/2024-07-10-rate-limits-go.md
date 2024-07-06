---
layout: post
title: rate-limits-go
excerpt: "A quick look at rate limits in Go"
categories: [coding]
tags: [howto,golang]
---

Companies providing APIs will often cap usage in some way - most often the metric in question is the number of requests (or messages, orders, ...) per second. As an end user it's often important to respect those limits if a breach can cause you to get banned or penalised in some ways. 

# Coinbase's public API

Coinbase has a public [market data](https://docs.cdp.coinbase.com/exchange/docs/welcome/) API which, among other things, allows us to query a [book for a given pair](https://api.exchange.coinbase.com/products/ETH-USD/book?level=2) (TL;DR, this lists the various price bands at which folks are willing to buy and/or sell - it changes all the time depending on supply and demand among other things). This is a *public* endpoint and as per [their published rate limits](https://docs.cdp.coinbase.com/exchange/docs/rate-limits/) we may make up to 10 requests per second, with a burst of 15 ([this page](https://auth0.com/docs/understand-rate-limit-burst-capability) from Auth0 provides a great explanation of the difference between the rate limit and burst capacity).

## Hitting rate limits

Let's start with a short snippet whose sole objective is to get rate-limited.

{% highlight golang %}
package main

import (
	"encoding/json"
	"flag"
	"io/ioutil"
	"log"
	"net/http"
	"sync"
)

func main() {
	var numWorkers = flag.Int("w", 20, "number of workers")
	flag.Parse()

	var wg sync.WaitGroup
	for i := 0; i < *numWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			client := &http.Client{}
			req, _ := http.NewRequest("GET", "https://api.exchange.coinbase.com/products/ETH-USD/book?level=2", nil)
			req.Header.Add("Content-Type", "application/json")
			for {
				res, _ := client.Do(req)
				body, _ := ioutil.ReadAll(res.Body)
				defer res.Body.Close()
				var data map[string]any
				_ = json.Unmarshal(body, &data)
				if val, ok := data["message"]; ok {
					log.Println(val)
				}
			}
		}()
	}
	wg.Wait()
	log.Println("done")
}
{% endhighlight %}

Depending on where you're running this, you'll need to tweak the number of works - but 20 should be plenty (note each coroutine continously requests the endpoint):

```
~/r/c/golang ❯❯❯ go run ratelimit.go -w 20                                                               ✘ 1 master ✱ ◼
2024/07/06 15:03:12 Public rate limit exceeded
2024/07/06 15:03:12 Public rate limit exceeded
2024/07/06 15:03:12 Public rate limit exceeded
2024/07/06 15:03:12 Public rate limit exceeded
```

Press `ctrl-c` to exit. Yeah it's not pretty, we'll fix that up later.

## We need stats...

But how many requests are we actually making? Let's add a (crude) monitor! And for this we'll also add a `context.Context` with a timeout (you wouldn't want to leave this running forever right?).

{% highlight golang %}


{% endhighlight %}

Running this for 5 seconds and we're already getting rate-limited:
```
~/r/c/golang ❯❯❯ go run ratelimit2.go -w 20 -t 5                                                              master ✱ ◼
2024/07/06 15:12:59 requests/second: 0, elapsed: 1.000510667s
2024/07/06 15:13:00 [worker 7] Public rate limit exceeded
2024/07/06 15:13:00 [worker 2] Public rate limit exceeded
2024/07/06 15:13:00 [worker 9] Public rate limit exceeded
2024/07/06 15:13:00 [worker 17] Public rate limit exceeded
2024/07/06 15:13:00 [worker 6] Public rate limit exceeded
2024/07/06 15:13:00 requests/second: 21, elapsed: 999.088875ms
2024/07/06 15:13:01 requests/second: 6, elapsed: 1.000262792s
2024/07/06 15:13:02 requests/second: 19, elapsed: 999.631625ms
2024/07/06 15:13:03 requests/second: 9, elapsed: 1.000540083s
2024/07/06 15:13:04 requests/second: 15, elapsed: 1.000512458s
2024/07/06 15:13:04 done
```

## Introducing a `Limiter`

We can create a `Limiter` by calling the `NewLimiter` constructor with our rate `r` (which represents the number of requests per seconds) and the burst capacity `b` - in our case the former will be 10, and the latter will be 15.


# Taking it further

