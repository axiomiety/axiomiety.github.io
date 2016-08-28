---
layout: post
title: zmq-tornado-ws
excerpt: "Using Tornado as a gateway between zmq and websockets."
categories: [tech]
tags: [howto zmq tornado websockets]
---

I've been playing a little bit with [zmq](http://zeromq.org/). It really makes communication between components really easy, and the docs are plain great. I have also been experimenting with websockets on the client and was wondering if there was a way to bridge the two.

Now there are `zmq` libraries available for JavaScript - but this works if you're also using JavaScript on the backend - which we won't be. Instead we'll use [tornado](http://www.tornadoweb.org/en/stable/) as our gateway between the clients and the backend 'engines' (or engine in our case - but with `zmq` it's really easy to scale). As a bonus, it allows us to segregate the backend logic - as `tornado` is an event loop, it's critical we offload any processing to another thread/process so it can keep handling clients.

# Rolling the dice

The backend will do nothing more than parse a string like '3d6' and roll 3 6-sided dice. The method itself is straight-forward.

{% highlight python %}
import  re
import  random
dice_expr = re.compile('^(\d+)d(\d+)$')
def _roll(what):
  g = dice_expr.match(what)
  if g:
    num_rolls, dice_size = g.groups()
    num_rolls = int(num_rolls)
    dice_size = int(dice_size)
    return [(random.randrange(1, dice_size)) for _ in range(num_rolls)]
  else:
    return 'whaaat?'

{% endhighlight %}

You'll notice we're returning actual objects. That's because we'll convert the return value to JSON before passing it back to the client.

# The engine

This is nothing more than a `zmq.REP` socket on which we `recv` forever - the message is will be of the `<client uuid>:<roll>` format. You might notice the `recv_string` and `send_string` methods being a bit out of place. This is because in Python 3, strings are no longer equivalent to bytes - so the zmq API has those conveninence methods built-in.

{% highlight python %}
def server(port='5556'):
  context = zmq.Context()
  socket = context.socket(zmq.REP)
  socket.bind('tcp://*:{0}'.format(port))
  logging.info('[SV] running R.O.L.L. server on port {port}'.format(port=port))

  while True:
    clientid, clientreq = socket.recv_string().split()
    logging.info('[SV] received roll {req} from client {cl}'.format(req=clientreq, cl=clientid))

    time.sleep(2) # so we can convince ourselves the gateway works fine asynchronously
    roll = json.dumps(_roll(clientreq)) # this is bad - we should sanitise user input
    socket.send_string('{cl}:{r}'.format(cl=clientid, r=roll)) # sending the clientid back because the gateway doesn't know whose this belongs to

{% endhighlight %}

# The gateway

This was the most interesting part. When accepting new websocket connections, we generate a uuid to identify the client's connection (as a client might have more than one). We then store it in `PubWebSocket.client`, a simple dictionary. The reason for this is that we're doing everything async - so when the engine sends data back, we need to know which client the response belongs to.

Another cool thing is because `tornado` works on an event loop, our callback will always be on the main thread - so no locking of `clients` is required. But it does also mean that whatever our callback does must be quick and non-blocking. Here we just push the updates back to the clients.

You'll note we don't have a callback (`publish_updates`) registered for when the `zmq_socket` receives data - this will be done separately later.

{% highlight python %}
class PubWebSocket(tornado.websocket.WebSocketHandler):
  clients = dict()
  zme_socket = None

  def open(self):
    client_id = str(uuid.uuid1())
    PubWebSocket.clients[client_id] = self
    self.client_id = client_id
    logging.info('[PWS] websocket opened - request headers: \n{headers}'.format(headers=self.request.headers))
    logging.info('client id: {clid}'.format(clid=client_id))

  def on_message(self, msg):
    logging.info('[PWS] received message {msg} from client {cl}'.format(msg=msg, cl=self.client_id))
    PubWebSocket.zmq_socket.send_string('{0} {1}'.format(self.client_id, msg))

  @classmethod
  def publish_updates(cls, msgs):
    logging.info('[PWS] receives msgs <{msgs}>'.format(msgs=msgs))
    for msg in msgs:
      msg_unicode = msg.decode('utf-8') # given we're receiving bytes
      cid, upd = msg_unicode.split(':')
      logging.info('[PWS] publishing {msg} to {cl}'.format(msg=upd, cl=cid))
      client = PubWebSocket.clients.get(cid)
      if client:
        client.write_message(u'{upd}'.format(upd=upd)) # note the unicode!
      else:
        logging.error('[PWS] received callback for nonexsitent client: {cl}'.format(cl=cid))

  def on_close(self):
    del PubWebSocket.clients[self.client_id]
    logging.info('[PWS] removing client {cl}'.format(cl=self.client_id))

{% endhighlight %}

# The glue

Now that we have our gateway and our engine, let's start them up together:

{% highlight python %}
if __name__ == '__main__':
  server_port = '5556'
  import threading
  t = threading.Thread(target=server, args=(server_port,))
  t.start()

  app = tornado.web.Application([
    (r'/ws', PubWebSocket), # this endpoint will be localhost/ws
    ])
  http_server = tornado.httpserver.HTTPServer(app)
  http_server.listen(8088)

  context = zmq.Context()
  client_sock = context.socket(zmq.REQ)
  client_sock.connect('tcp://localhost:{port}'.format(port=server_port))
  stream_sock = zmqstream.ZMQStream(client_sock)
  stream_sock.on_recv(PubWebSocket.publish_updates)
  PubWebSocket.zmq_socket = stream_sock

  tornado.ioloop.IOLoop.instance().start() # get the ball rolling

{% endhighlight %}

# The proof

To get this live, we need clients. You can fire up a js console in Chrome or Firefox or alternatively just use `nodejs` (note that if you're using the latter, you'll need `npm install ws` - just one of the many websockets implementations available).

{% highlight javascript %}
> ws = new WebSocket('ws://localhost:8088/ws');
> ws.on('message', function(message) {console.log('received: %s', message);});
> ws.send('3d4');
undefined
> received: [1, 2, 1]
{% endhighlight %}

And the server logs:

{% highlight python %}
vagrant@vagrant:/shared/crashburn$ python3 zmq_ws_gateway.py
INFO:root:[SV] running R.O.L.L. server on port 5556
INFO:root:[PWS] websocket opened - request headers:
{'Sec-Websocket-Version': '13', 'Upgrade': 'websocket', 'Host': 'localhost:8088', 'Sec-Websocket-Key': 'MTMtMTQ3MjM5MDk5NDc4Mw==', 'Sec-Websocket-Extensions': 'permessage-deflate; client_max_window_bits', 'Connection': 'Upgrade'}
INFO:root:client id: 81a83f28-6d23-11e6-9aee-080027ee3298
INFO:root:[SV] received roll 3d4 from client 81a83f28-6d23-11e6-9aee-080027ee3298
INFO:root:[PWS] receives msgs <[b'81a83f28-6d23-11e6-9aee-080027ee3298:[1, 2, 1]']>
INFO:root:[PWS] publishing [1, 2, 1] to 81a83f28-6d23-11e6-9aee-080027ee3298
{% endhighlight %}

# Taking this further

I'd like to see how this works with a number of engines all sharing the same socket. `zmq` has a number of features available like using round-robin to dispatch work to various workers.

The full Python source is available [here](https://github.com/axiomiety/crashburn/blob/master/zmq_ws_gateway.py).
