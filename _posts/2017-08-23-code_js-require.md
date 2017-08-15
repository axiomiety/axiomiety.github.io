---
layout: post
title: js-require
excerpt: "Building our own `require` directive."
categories: [coding]
tags: [js, howto]
comments: false
---

# `nodejs`'s `require`

If you have ever used `node.js` you're probably familiar with the `require` function which essentially loads a module into the current namespace. Until recently I was under the impression that was some sort of built-in for the language, a bit like `new` or `Object`. It turns out however that `require` is a 'real' function and something we can build ourselves! 

## Setting the scene

One of the aims of modules is to keep code neatly (?) organised and manageable. That is, we don't want to pollute the global namespace. There are a couple of ways to achieve that - one of the most common ones being to use objects:

``` javascript
> var foo = {}
undefined
> foo.sayHello = function() {console.log("Hello");}
[Function]
> foo.sayHello()
Hello
```

Functionality is associated with the `foo` object. However that may not provide as much encapsulation as we'd like and everything is exposed:

``` javascript
> foo.secretRatio = 1.5
1.5
> foo.range = function(mult) { return this.secretRatio * mult; }
[Function]
> foo.range(2)
3
> foo.secretRatio = 2
2
> foo.range(2)
4
```

We can do better though by leveraging JavaScript's `Function` constructor:

``` javascript
> var foo2 = new Function("", `const secretRatio=1.5;return {range: function(mult) {return secretRatio * mult;}}`)();
undefined
> Object.keys(foo2)
[ 'range' ]
> Object.keys(foo)
[ 'sayHello', 'secretRatio', 'range' ]
> foo2.range(2)
3
```

Note that the 2nd argument to `Function` was nothing more than a string containing our code - which, really, is what a module file actually is.

## `require`, first cut

With this in mind it should be possible to write a thin wrapper that reads a file and shoves its content in the body of a `Function` object:

``` javascript
var fs = require('fs');
function myRequire(path) {
  const c = fs.readFileSync(path, 'utf8'); // we should handle errors!
  var modFun = new Function("", c);
  return modFun();
}

var foo3 = myRequire('foo3.js');
console.log(foo3.range(2));
```

We're cheating a little by leveraging the `fs` module - in the browser you'd probably use the `FileReader` API. If we were writing an interpreter from scratch that'd probably be part of the built-in functionality.

## Improving

The above wasn't particlularly clever - it loads modules alright, but subsequent calls will load them again. We can address this by exposing a single global variable which will store all our modules and introducing a cache:

``` javascript

function myRequire(path) {
  if (path in myRequire._cache) return myRequire._cache[path];

  const moduleCode = fs.readFileSync(path, 'utf8'); // we should handle errors!
  var exports = {};
  var moduleFunction = new Function("exports", moduleCode); // `exports` will be made available inside `c`
  moduleFunction(exports);
  myRequire._cache[path] = exports;
  return exports;
}
myRequire._cache = {};
```


