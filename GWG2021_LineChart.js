var myData = "date	Uncontrolled	Controlled\n\
20150101	0.744	0.973\n\
20160101	0.763	0.976\n\
20170101	0.765	0.977\n\
20180101	0.779	0.978\n\
20190101	0.794	0.981\n\
20200101	0.807	0.983\n\
20210101	0.819	0.983\n";

var margin = {
  top:20,
  right:80,
  bottom:30,
  left:50
};

var w = 800 - margin.left - margin.right;
var h = 300 - margin.top - margin.bottom;

var parseDate = d3.timeParse("%Y%m%d");

var scaleX = d3.scaleTime()
.range([0,w]);

var scaleY = d3.scaleLinear()
.range([h,0]);

//updating color scale to new SubCategory
var color = d3.scaleOrdinal()
    .range(["#D50E51","#2E0B96"]);	


var xAxis = d3.axisBottom()
.scale(scaleX);

var yAxis = d3.axisLeft()
.scale(scaleY)
.tickFormat(scaleY => `$${scaleY.toFixed(2)}`) //$ format
.tickSizeOuter(0) //no outer ticks

var line = d3.line()
.x(function(d){
  return scaleX(d.date)
})
.y(function(d){
  return scaleY(d.wage_gap)
})
.curve(d3.curveBasis);

var svg = d3.select("#line_Chart").append("svg")
    .attr("width",w + margin.left + margin.right)
    .attr("height",h + margin.top + margin.bottom)
    // .style("background-color","lightGreen")
    .append("g")
    .attr("transform","translate("+margin.left +","+margin.top+")")


var data = d3.tsvParse(myData);

color.domain(d3.keys(data[0]).filter(function(key){
  return key!=="date";

}))


data.forEach(function(d){
  d.date = parseDate(d.date);

});

var measures = color.domain().map(function(name){
  return {
    name:name,
    values:data.map(function(d){
      return {
        date:d.date,
        wage_gap:+d[name]
      };
    })
  };
});

scaleX.domain(d3.extent(data,function(d){
  return d.date;
}));
scaleY.domain([d3.min(measures,function(c){
  return d3.min(c.values,function(v){
    return v.wage_gap
  })
}),d3.max(measures,function(c){
  return d3.max(c.values,function(v){
    return v.wage_gap;
  })
})])

svg.append("g")
.attr("class","x axis")
.attr("transform","translate(0,"+h+")")
.call(xAxis);

svg.append("g")
.attr("class","y axis")
.call(yAxis)

var city = svg.selectAll(".city")
.data(measures)
.enter().append("g")
.attr("class","city");

city.append("path")
.attr("class","line")
.attr("d",function(d){
  return line(d.values);
})
.style("stroke",function(d){
  return color(d.name)
});

city.append("text")
.datum(function(d){

  return{
    name:d.name,
    value:d.values[d.values.length -1]
  };
})
.attr("transform",function(d){
  return "translate(" + scaleX(d.value.date)+","+scaleY(d.value.wage_gap)+")";
})
.attr("x",3)
.attr("dy",".35")
.text(function(d){
  return d.name;
});

var mouseG = svg.append("g") // this the black vertical line to folow mouse
.attr("class","mouse-over-effects");

mouseG.append("path")
.attr("class","mouse-line")
.style("stroke","black")
.style("stroke-width","1px")
.style("opacity","0");

var lines = document.getElementsByClassName("line");
var mousePerLine = mouseG.selectAll(".mouse-per-line")
.data(measures)
.enter()
.append("g")
.attr("class","mouse-per-line");

mousePerLine.append("circle")
.attr("r",7)
.style("stroke",function(d){
  return color(d.name);
})
.style("fill", "none")
.style("stroke-width", "1px")
.style("opacity", "0");

mousePerLine.append("text")
.attr("transform","translate(3,-10)");

mouseG.append("rect")
.attr("width",w)
.attr("height",h)
.attr("fill","none")
.attr("pointer-events","all")
.on("mouseout",function(){
  d3.select(".mouse-line").style("opacity","0");
  d3.selectAll(".mouse-per-line circle").style("opacity","0");
  d3.selectAll(".mouse-per-line text").style("opacity","0")
})
.on("mouseover",function(){
  d3.select(".mouse-line").style("opacity","1");
  d3.selectAll(".mouse-per-line circle").style("opacity","1");
  d3.selectAll(".mouse-per-line text").style("opacity","1")

})
.on("mousemove",function(){

  var mouse = d3.mouse(this);
  d3.select(".mouse-line")
  .attr("d",function(){
    var d = "M" + mouse[0] +"," + h;
    d+=" " +mouse[0] + "," + 0;
    return d;
  })

  d3.selectAll(".mouse-per-line")
  .attr("transform",function(d,i){
    var xDate = scaleX.invert(mouse[0]),
    bisect =d3.bisector(function(d){ return d.date;}).right;
    idx = bisect(d.values,xDate);

    var beginning = 0,
     end = lines[i].getTotalLength(),
    target = null;

    while(true){
      target = Math.floor((beginning+end)/2)
      pos = lines[i].getPointAtLength(target);
      if((target ===end || target == beginning) && pos.x !==mouse[0]){
        break;
      }

      if(pos.x > mouse[0]) end = target;
      else if(pos.x < mouse[0]) beginning = target;
      else break; // position found
    }
    d3.select(this).select("text")
    .text(`$${scaleY.invert(pos.y).toFixed(2)}`) 
    .attr("fill",function(d){
      return color(d.name)
    });
    return "translate(" +mouse[0]+","+pos.y+")";

  });

});

// utilized https://codepen.io/Asabeneh/pen/RZpYBo