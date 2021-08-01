---
layout: post
title: phabricode-vscode-extension
excerpt: "Writing a VSCode Extension"
categories: [coding]
tags: [howto]
---

[phabricode](https://github.com/hudson-trading/phabricode)

## `phabricode` ##

Phabricator is, among other things, a code review platform -and it's what we currently use at work. I was looking to optimise my workflow (read: minimise distractions when using a browser) at work when I came across a Chrome extension made by a colleague of mine: [phabtab](https://github.com/sdutoit/phabtab). Greatly inspired by this, I began mulling over creating something similar for VSCode. Now there already are a few Phabricator extensions available in the market place but none seemed to really do what I was hoping to achieve - embed comments directly in code. It took a while to get to something useable and here are some lessons I wished I had learnt earlier on.

### Tinker ###

By far the easiest way to get started is to clone [the sample VSCode extensions by Microsoft](https://github.com/Microsoft/vscode-extension-samples) and explore the various widgets available. I originally wanted to do something with `CodeLens` and ended down a rabbit hole trying to understand the documentation. The most valuable thing was to use the relevant sample and tinker along the way - making incremental changs, substituting data for my own etc... Once I had a skeleton working, I created a brand new project and started copying snippets across. As an aside, don't forget to commit before you engage on refactoring! And that also means using meaningful commit messages, not just `wip` everywhere. Being able to come back to a working baseline saved me tons of time.

#### Pushing reset ####

When things go haywire and your breakpoints don't seem to hit where they should, it hints at a disconnect between the TypeScript and JavaScript code. When writing extensions, you'll most likely use TypeScript - and your code will be transpiled to JavaScript (which the extension will run). Things get tricky when transpilation fails, meaning your previous JavaScript artifact is the one being run, not your latest change. When that happens it can help to clear you the `outDir` specified in your `tsconfig.json` file - that way anything that doesn't transpile will break, instead of giving you this half-way state.

Another gotcha is in relation to settings. Extensions can have their own configuration via `vscode.workspace.getConfiguration` - if defaults are specified (e.g. a timeout, a path), those will live in `package.json` under the `contributes.configuration.properties` key. Changing those during a live debug session typically won't work - and if you overwrote those settings locally you need to remember to clear those up.
 
All in all, it's worth remembering certain changes won't take effect with a hot reload - you actually need to stop your debug session, rebuild, and start again.

### Set up your environment correctly ###

One thing that tripped me up a few times was the TypeScript transpilation - it's easy to forget that behind the scenes, your `tsconfig.json` will specify how TypeScript gets converted to JavaScript. For instance any `src/*.js` module you reference will need to be specified via an `include`: `"include": ["./src/restapi.js"]`. Also note how you intend to do module resolution. If you're coming from `nodejs`, you probably want `"moduleResolution": "node"`.

#### Debugging client-side ####

Once you ship it, you're pretty much on your own - thankfully VSCode (being based on the Electron framework), offers similar developer tools that you'd see in your browser. Head over to Help -> Toggle Developer Tools. All `console.log` calls made by your extension will be visible here (for better or worse). The downside however is that network calls made by the extension itself won't be logged.


### Language gotchas ###

Being new to TypeScript (and to JS to a certain extent), I came loaded with tons of preconceptions on how the language worked. For instance, `Map` isn't a Python's `dict`:

{% highlight javascript %}
const myMap = new Map();
console.log(myMap.get('keyThatDoesNotExist', 'aDefaultValue'));
{% endhighlight %}

will actually print `undefined` - not `aDefaultValue`. In cases like this, the MDN documentation comes in handy with interactive examples.

Being aware of asynchronous APIs is a necessity. Take `Array.prototype.map` - if the function you pass in returns a promise, what you'll get back will be a whole lot of promises. What you need to do instead is something like this:

{% highlight javascript %}
const itemPromises = phab.result.data.filter(item => item.comments.length >0).map(item => this.processItem(item));
const nestedItems: Array<Array<CommentWrapper>> = (await Promise.all(itemPromises));
{% endhighlight %}

and `await` on `Promise.all` instead. Note however that this itself introduces more gotchas - `Promise.all` will reject as soon as one of the promises it's waiting for rejects - regardless of any that might have succeeded. You'll need to wrap this in a `try/catch` block to be safe (one of those do as I say, not as I do kind of thing - woops).
