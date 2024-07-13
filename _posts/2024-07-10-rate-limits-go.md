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
func rateLogger(ctx context.Context, limit *rate.Limiter, countChan <-chan struct{}) {
    ticker := time.NewTicker(time.Second)
    count := 0
    defer ticker.Stop()
    intervalStart := time.Now()
    for {
        select {
        case <- ctx.Done():
            break
        case <- countChan:
            count += 1
        case intervalEnd := <- ticker.C:
            log.Printf("requests/second: %d, elapsed: %s ", count, intervalEnd.Sub(intervalStart))
            intervalStart = intervalEnd
            count = 0
        }
    }
}
{% endhighlight %}

Running this for 10 seconds and we're already getting rate-limited - at 33 requests/second that's somewhat expected.
```
~/r/c/golang ❯❯❯ go run ratelimit3.go -w 40 -t 10                                                               master ◼
2024/07/13 13:50:27 [worker 38] Public rate limit exceeded
2024/07/13 13:50:27 [worker 0] Public rate limit exceeded
2024/07/13 13:50:27 [worker 7] Public rate limit exceeded
2024/07/13 13:50:27 [worker 4] Public rate limit exceeded
2024/07/13 13:50:27 [worker 6] Public rate limit exceeded
2024/07/13 13:50:28 requests/second: 6, elapsed: 1.000361042s
2024/07/13 13:50:29 requests/second: 33, elapsed: 999.991958ms
2024/07/13 13:50:29 [worker 33] Public rate limit exceeded
2024/07/13 13:50:29 [worker 36] Public rate limit exceeded
2024/07/13 13:50:29 [worker 37] Public rate limit exceeded
2024/07/13 13:50:29 [worker 16] Public rate limit exceeded
```

## Introducing a `Limiter`

We can create a `Limiter` by calling the `NewLimiter` constructor with our rate `r` (which represents the number of requests per seconds) and the burst capacity `b` - in our case the former will be 10, and we'll deal with the latter separately.

{% highlight golang %}
    limiter := rate.NewLimiter(rate.Limit(10),1)
{% endhighlight %}

And each goroutines wait for a token before making a request:

{% highlight golang %}
			for {
				select {
				case <-ctx.Done():
					return
				default:
					if err := limiter.Wait(ctx); err != nil {
                        // if we get there, waiting would exceed the context's deadline
                        // so let's assume we're done
                        break
					}
					res, _ := client.Do(req)
                    countChan <- struct{}{}
					body, _ := ioutil.ReadAll(res.Body)
					defer res.Body.Close()
                    // we completed a request! let the counter know
					var data map[string]any
					_ = json.Unmarshal(body, &data)
					if val, ok := data["message"]; ok {
						log.Printf("[worker %d] %s", idx, val)
					}
				}

			}
{% endhighlight %}


Running this again for 10s with just as many workers (40), it's all clean!
```
~/r/c/golang ❯❯❯ go run ratelimit4.go -w 40 -t 10                                                               master ◼
2024/07/13 13:53:16 requests/second: 0, tokens available: -28.99, elapsed: 1.0010665s
2024/07/13 13:53:17 requests/second: 2, tokens available: -18.99, elapsed: 1.000019459s
2024/07/13 13:53:18 requests/second: 18, tokens available: -10.00, elapsed: 999.602916ms
2024/07/13 13:53:19 requests/second: 20, tokens available: -6.00, elapsed: 999.669459ms
2024/07/13 13:53:20 requests/second: 9, tokens available: -7.00, elapsed: 1.00023475s
2024/07/13 13:53:21 requests/second: 10, tokens available: -8.99, elapsed: 1.000437625s
2024/07/13 13:53:22 requests/second: 7, tokens available: -7.99, elapsed: 999.992458ms
2024/07/13 13:53:23 requests/second: 11, tokens available: -7.00, elapsed: 999.642333ms
2024/07/13 13:53:24 requests/second: 12, tokens available: -6.00, elapsed: 999.72375ms
2024/07/13 13:53:25 requests/second: 8, tokens available: 1.00, elapsed: 1.000533709s
2024/07/13 13:53:26 requests/second: 2, tokens available: 1.00, elapsed: 999.314833ms
2024/07/13 13:53:27 requests/second: 1, tokens available: 1.00, elapsed: 1.000788167s
2024/07/13 13:53:27 done
```

But wait up - what are those negative numbers? In a nutshell this tells us how many tokens need to be replenished before another gets released (that's the `limiter.Wait(ctx)` call). A new token gets added to the bucket every 1/10th of a second (0.1 seconds). If I have 20 coroutines all asking for a tokens at once, the `limiter.Wait(ctx)` will essentially place a hold on the next 20 tokens - meaning that the 21st corouting asking for one will have to wait for 2.1 seconds (`20x0.1+0.1` seconds), which leads to this interesting behaviour.

We can illustrate by calculating both the time to the next token (which is `limit.Tokens()/<rate per second>` and logging the time we were blocked during the `limiter.Wait` call:

{% highlight golang %}
                    beforeWait := time.Now()
					if err := limiter.Wait(ctx); err != nil {
                        // if we get there, waiting would exceed the context's deadline
                        // so let's assume we're done
                        break
					}
                    afterWait := time.Now()
                    waitTime := afterWait.Sub(beforeWait)
                    if waitTime > 1*time.Second {
						log.Printf("[worker %d] waited %s for a token", idx, waitTime)
                    }
{% endhighlight %}

And sure enough, some workers will wait quite a bit:
```
2024/07/13 14:56:32 [worker 33] waited 2.200255084s for a token
2024/07/13 14:56:32 [worker 37] waited 2.299760416s for a token
2024/07/13 14:56:32 [worker 38] waited 2.400653292s for a token
2024/07/13 14:56:32 [worker 30] waited 2.500609666s for a token
2024/07/13 14:56:32 [worker 6] waited 1.138844833s for a token
```

Going back to how we created a limiter, we specified the burst `b` as 1 - which meant that we'd have at most 1 token available in the bucket at any point in time (that is, this is our bucket's capacity - we still replenish at the same rate but if it's full, we don't add any more tokens). We can easily see this by kicking off our monitor without the coroutines:

```
~/r/c/golang ❯❯❯ go run ratelimit4.go -w 40 -t 20 -r 10                                                   ✘ 1 master ◼
2024/07/13 14:31:31 requests/second: 0, tokens available: 1.00, elapsed: 1.000864834s
2024/07/13 14:31:32 requests/second: 0, tokens available: 1.00, elapsed: 999.962166ms
2024/07/13 14:31:33 requests/second: 0, tokens available: 1.00, elapsed: 1.0000055s
2024/07/13 14:31:34 requests/second: 0, tokens available: 1.00, elapsed: 1.000001292s

```

This mostly work because our coroutines are constantly starved for tokens. If instead we had periods of dormancy it'd be great for the bucket to have a greater capacity - so when work resumes, we can make a bunch of requests in one go instead of waiting one by bone. Let's do it.

However Coinbase gives us a burst capacity of 15 - meaning that when we start our bucket already has 15 tokens available for us to use. But if we change this to 15, we can see we are still hitting rate limits - what gives?

```
~/r/c/golang ❯❯❯ go run ratelimit4.go -w 40 -t 20 -r 10                                                   ✘ 1 master ◼
2024/07/13 14:33:38 requests/second: 0, tokens available: -15.00, elapsed: 1.001029541s
2024/07/13 14:33:39 requests/second: 2, tokens available: -6.00, elapsed: 999.997167ms
2024/07/13 14:33:40 [worker 0] Public rate limit exceeded
2024/07/13 14:33:40 [worker 19] Public rate limit exceeded
2024/07/13 14:33:40 [worker 3] Public rate limit exceeded
2024/07/13 14:33:40 [worker 5] Public rate limit exceeded
2024/07/13 14:33:40 [worker 1] Public rate limit exceeded
```

Our program starts with 15 tokens (which are consumed **immediately** by all our goroutines) - but starts to replenish it at rate of 1 token every 0.1 seconds. Meaning that from t=0s to t=1s we have made up to *25* such requests. From Coindbase's perspective we should only be allowed to make requests at t=1.5s! However this isn't something that the `rate` package provides out of the box. If the aim is to fully avoid being rate-limited, keeping `b` smaller than our consumption rate is key.

# Taking it further

The `rate` package provides enough functionality out of the box to be useful, but for more elaborate use-cases there are a number of packages that provide more advanced functionality.

Another idea would be to set the rate limit dynamically - some services might throttle requests during peak times and it'd be great if we could feed that back to the limiter to adjust the rate accordingly. And given some sort of cool-off period, it could try gently ramping up again.

The full code for the (latest) version of the example is available [here](https://github.com/axiomiety/crashburn/blob/master/golang/post-ratelimit/ratelimit5.go).
