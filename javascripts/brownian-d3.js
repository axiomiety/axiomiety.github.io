var UTILS = {
  generateTicks: function(num_ticks, up_prob) {
    /* EMEAScript 2015 supports default parameters! */
    if (num_ticks === undefined) {num_ticks = 50;}
    if (up_prob === undefined) {up_prob = 0.5;}

    var ticks = [];
    for (var i = 0; i < num_ticks; i++) {
      ticks.push( (Math.random() < up_prob) ? 1 : -1);
    };
    return ticks;
  },

  cumulativeSum: function(arr) {
    var csum = [];
    /* not sure if reduce would make more sense */
    if (arr.length) {
      csum.push(arr[0]);
      for (var i = 1; i < arr.length; i++) {
        csum.push(csum[i-1] + arr[i]);
      }
    }
    return csum;
  },

  getPoints: function(arr) {
    var ret = [];
    for (var i = 0; i < arr.length; i++) {
      ret.push({x:i, y:arr[i]});
    }
    return ret;
  },
}

function getRandomData(num_ticks) {
  if (num_ticks === undefined) {num_ticks = 80;}
  var ticks = UTILS.generateTicks(num_ticks); // [-1, 1, 1, -1, 1, ...]
  var csum = UTILS.cumulativeSum(ticks); // [-1, 0 , 1, 0, ...]
  var points = UTILS.getPoints(csum); // [{x0,y0}, {x1,y1}, ...]
  return {ticks: ticks, cumulative_sum: csum, points: points};
}

function displayHistogram(values) {
  var margin = {top: 10, right: 20, bottom: 20, left: 20};
  var width = 500 - margin.left - margin.right;
  var height = 400 - margin.top - margin.bottom;
  
  d3.select('#random_walk_histogram').select('svg').remove(); // remove the previous svg container if there is one
  var svgContainer = d3.select('#random_walk_histogram').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
  num_bins = 30;
  
  var xScale = d3.scale.linear()
    .domain([
      //Math.min.apply(Math, values), Math.max.apply(Math, values)])
      Math.floor(d3.min(values) / num_bins) * num_bins,
      Math.ceil(d3.max(values) / num_bins) * num_bins
    ])
    .range([0, width]);
  
  var data = d3.layout.histogram()
        .bins(xScale.ticks(num_bins)) //40 uniformly distributed bins
        (values);
  
  var yScale = d3.scale.linear()
    .domain([0, d3.max(data, function(d) { return d.y; })])
    .range([height, 0]); // inverted, so it goes up instead of down
  
  var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom");
    
  var bar = svgContainer.selectAll(".bar")
    .data(data)
    .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d) { return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")"; });
  
  
  bar.append("rect")
    .attr("x", 1)
    .attr("width", Math.round(width/num_bins)-1)
    .attr("height", function(d) { return height - yScale(d.y); });
    
  // add the x-axis
  svgContainer.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);
}

function displayBarChart(ticks) {
  var margin = {top: 10, right: 10, bottom: 10, left: 10};
  var width = 620 - margin.left - margin.right;
  var height = 100 - margin.top - margin.bottom;
  var barSpacing = 1;
  
  d3.select('#random_walk_barchart').select('svg').remove(); // remove the previous svg container if there is one
  var svgContainer = d3.select('#random_walk_barchart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
  svgContainer.selectAll('.rect') // not sure why we need the selectAll there...
    .data(ticks)
    .enter() // will cause the below to be called for each entry in data
    .append('rect')
    .attr('x', function(d, i) { return i * (width / ticks.length); }) // includes the padding!
    .attr('y', function(d) {return (d > 0) ? 0 : 40;})
    .attr('width', width / ticks.length - barSpacing)
    .attr('height', 40)
    .attr("fill", function(d) { return "rgb(0, 0, " + ((d > 0) ? 100 : 200) + ")"; });
    ;
}

function displayRandomWalk(csum, points) {
  var margin = {top: 50, right: 50, bottom: 50, left: 50};
  var width = 620 - margin.left - margin.right;
  var height = 400 - margin.top - margin.bottom;

  var lineFunc = d3.svg.line()
                .x( function(d) { return xScale(d.x); } )
                .y( function(d) { return yScale(d.y); } )
                .interpolate('linear');
  
  // scales for each axis
  var xScale = d3.scale.linear()
    .domain([0, csum.length])
    .range([0,width]);
    
  var yScale = d3.scale.linear()
    .domain([Math.min.apply(Math, csum), Math.max.apply(Math, csum)])
    .range([height,0]); // we use an inverted range so positive numbers are above negative ones

  // axis
  var xAxis = d3.svg.axis().scale(xScale)
        .orient("bottom") // that's the orientation of the ticks themselves!
        .ticks(5);
  var yAxis = d3.svg.axis().scale(yScale)
        .orient("left")
        .ticks(5);
  
  // create the svg element inside the random_walk div
  d3.select('#random_walk').select('svg').remove(); // remove the previous svg container if there is one
  var svgContainer = d3.select('#random_walk').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // add the line
  svgContainer.append('path')
    .attr('d', lineFunc(points))
    .attr('stroke', 'blue')
    .attr('stroke-width', 2)
    .attr('fill', 'none')
    ;
    
  // add the axis
  svgContainer.append('g')
    .attr('class','x axis')
    .attr("transform", "translate(0," + yScale(0) + ")") // so it's in line with the 0 on the y axis - TODO need to fix the margin though
    .call(xAxis);

  svgContainer.append('g')
    .attr('class','y axis')
    .call(yAxis);
}

function displayMultipleRandomWalks(data) {
  /*  data is essentially an MxN matrix with M paths of length N */
  var margin = {top: 50, right: 50, bottom: 50, left: 50};
  var width = 620 - margin.left - margin.right;
  var height = 500 - margin.top - margin.bottom;

  var lineFunc = d3.svg.line()
                .x( function(d, i) { return xScale(i); } )
                .y( function(d) { return yScale(d); } )
                .interpolate('linear');
  
  // scales for each axis
  var xScale = d3.scale.linear()
    .domain([0, data[0].length])
    .range([0,width]);
  
  // in order to get our y scale right, we need to get the overall min/max values
  var data_min = [];
  var data_max = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    data_min.push( Math.min.apply(Math, row) );
    data_max.push( Math.max.apply(Math, row) );
  }
  
  var yScale = d3.scale.linear()
    .domain([Math.min.apply(Math, data_min), Math.max.apply(Math, data_max)])
    .range([height,0]); // we use an inverted range so positive numbers are above negative ones

  // axis
  var xAxis = d3.svg.axis().scale(xScale)
        .orient("bottom") // that's the orientation of the ticks themselves!
        .ticks(5);
  var yAxis = d3.svg.axis().scale(yScale)
        .orient("left")
        .ticks(5);
  
  d3.select('#random_walk_multi').select('svg').remove(); // remove the previous svg container if there is one
  var svgContainer = d3.select('#random_walk_multi').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  svgContainer.selectAll(".line")
    .data(data)
    .enter().append("path")
    .attr("class", "line")
    .attr("d", lineFunc);
}

function generateMultiplePaths(num_paths, num_ticks) {
  data = [];
  for (var i = 0; i < num_paths; i++) {
    var d = getRandomData(num_ticks);
    data.push( d.cumulative_sum );
  }
  return data;
}

function refresh(what) {
  if (what == 'random_walk') {
    data = getRandomData(); 
    displayRandomWalk(data.cumulative_sum, data.points);
    displayBarChart(data.ticks);
  }

  if (what == 'random_walk_multi') {
    var num_ticks = 250;
    blah = generateMultiplePaths(200,num_ticks);
    displayMultipleRandomWalks(blah);
  
    var foo = [];
  
    for (var i = 0; i < blah.length; i++) {
      foo.push( blah[i][num_ticks-1] );
    }
  
    displayHistogram(foo);
  }
}

refresh(); // could be an onLoaded or something
