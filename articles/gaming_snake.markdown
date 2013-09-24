---
layout: default
title: articles/gaming-snake
category: pages
---

## Gaming - building a Snake clone ##

Source available [here](https://github.com/axiomiety/crashburn/blob/master/snake_js.html), explanations to follow!

{% highlight javascript %}
ut.grid_coordinate_to_cartesian = function (g) { 
        col = Math.floor(g/ut.grid_width); 
        row = g % ut.grid_width; 
        return {x: row*CONSTS.grid_square_width, y: col*CONSTS.grid_square_width}; 
};
{% endhighlight %}
