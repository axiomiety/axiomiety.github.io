---
layout: default
title: articles/gaming-snake
category: pages
---

I've been writing software for years but it always bugged me I never wrote a game. So this was me rectifying that.

__Disclaimer__: Prior to this I hadn't written any javascript. While I did make an effort to make the code clean and easy to read, let's just say it can most certainly be improved.

## Building a Snake clone ##

Snake is a fairly simple game in that controls are simple (left/right/up/down) and the only moving part is the player - there are no other moving objects like projectile, platforms etc... With comments and generous use of white-space the whole game takes up roughly 200 lines of code (with html).

### Preliminaries (ie, simplifying things) ###

Collision detection isn't exactly easy. I originally approached this by making everything a rectangle and checking if the any of the player's head vertices fell into 'colision regions'. Let's just say that as a first iteration it wasn't particularly smart. I then redefined the problem by having my world as a grid made out of identical squares. This means I could then represent the world as such (smaller version):


    | 0 | 1 | 2 | 3 | 4 | 5 |
    | 6 | 7 | 8 | 9 | 10| 11|
    | 12| 13| 14| 15| 16| 17|
    | 18| 19| 20| 21| 22| 23|


That is, my world is a single-dimensional array. Walls would occupy coordiates 0-5, 6 & 11, 12 & 17, and 18-23. Code-wise, it would look like this:

{% highlight javascript %}
    var walls = new Array();
    // top wall
    for (var i = 0; i < Utils.grid_width; i++) { walls.push(i) };
    // side walls top left and bottom right will be filled by top/bottom walls
    for (var i = 1; i < Utils.grid_height; i++) { walls.push(i*Utils.grid_width); walls.push(i*Utils.grid_width-1); };
    // bottom wall
    for (var i = 0; i <= Utils.grid_width; i++) { walls.push(Utils.grid_length-i); };
{% endhighlight %}

If you think of the player as occupying a single coordinate, it also makes it easy to determine collisions. It's just a case of checking if the player's position matches that of the walls (later we'll expand to check the tail coordinates too). It also makes it really easy to move the player from one direction to another. Indeed, left/right are -1/+1 and up/down are -/+ the grid width (6 in the example above). With this out of the way, let's look at the game loop.

Now this new coordinate system is all easy and simple to use, but it won't help us much when it comes to drawing shapes on a cartesian graph. To help this process, I have a small utility function which does just that:

{% highlight javascript %}
      ut.grid_coordinate_to_cartesian = function (g) {
        col = Math.floor(g/ut.grid_width);
        row = g % ut.grid_width;
        return {x: row*CONSTS.grid_square_width, y: col*CONSTS.grid_square_width};
      };
{% endhighlight %}

In a nutshell, the x coordinate is obtained by finding out how far along the width we are. This is achieved using the modulo operator. For the y coordinate we see check how many full widths fit our current coordinate. We finish off my multiplying this by the width of the grid's square width (remember that our grid is made out of identical and adjacent unit squares).

### Game loop ###

The core of this game (and most games actually) is the game loop. This is a loop that runs continuously and generally does two things. Update the game state (based on user inputs, collisions etc...) and redraws the scenes. And that's pretty much 'it'.

For Snake, updating the game state essentially means:
   * Update the list of coordinates occupied by the tail
   * Update the head's position based on user input
   * Check if we've just eaten an apple (and increase the tail length accordingly)
   * Check for collisions and end the game if there's one

In code it's like this:

{% highlight javascript %}
      update: function() {
        // only pop if current tail length < expected
        if (this.tail_grid_coordinates.length == this.tail_length) {
          // pop the last tail element
          tc = this.tail_grid_coordinates.shift();
        }
        // add current head
        this.tail_grid_coordinates.push(this.head_grid_coordinate);
        // update head based on the direction
        switch (this.direction) {
          case Utils.keys.left:
            this.head_grid_coordinate -= 1;
            break;
          case Utils.keys.right:
            this.head_grid_coordinate += 1;
            break;
          case Utils.keys.up:
            this.head_grid_coordinate = this.head_grid_coordinate - Utils.grid_width;
            break;
          case Utils.keys.down:
            this.head_grid_coordinate = this.head_grid_coordinate + Utils.grid_width;
            break;
        }
        if (apple != null && player.head_grid_coordinate == apple.coord) {
          apple = null; // reset the apple
          this.tail_length += CONSTS.tail_growth;
        }
        if (Utils.collision_detected(player.head_grid_coordinate)) {
          game_over();
        }
{% endhighlight %}

With this in mind, this is what an iteration (frame?) of the game looks like:

{% highlight javascript %}
    function game_iteration() {
      canvas.clearRect(0, 0, CONSTS.canvas_width, CONSTS.canvas_height);
      draw_walls();
      if (apple == null) {
        apple = new Apple();
        apple.generate();
        player.score += 1; // the apple was eaten! (yeah it's a bit of a hack)
        // we only redraw the score when an apple gets eaten
        draw_score();
      }
      apple.draw();
      player.draw();
      player.update();
    }
{% endhighlight %}

You'll note that for every frame we clear the entire screen. That's rather heavy handed and we could clear out the last tail position instead - but it's simple and it works.

And this gets repeated for ever until the player collides with an object. Game. On.

### References  ###

Source available [here](https://github.com/axiomiety/crashburn/blob/master/snake_js.html), with comments.

The game is also available [here](snake_js.html).
