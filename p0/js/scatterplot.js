class Scatterplot {

  constructor(_config, _data) {

    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 250,
      margin: _config.margin || { top: 25, right: 50, bottom: 20, left: 50 }
    };
    this.data = _data;
    this.initVis();
  }

  initVis() {
    let vis = this;

    vis.width =
      vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;

    vis.height =
      vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    vis.xScale = d3.scaleLinear().range([0, vis.width]);
    vis.yScale = d3.scaleBand().range([0, vis.height]);

    // Initialize axes
    vis.xAxis = d3
      .axisBottom(vis.xScale)
      .ticks(6)
      .tickSize(-vis.height - 10)
      .tickPadding(10)
      .tickFormat((d) => `${d.toFixed(1)}`);

    vis.yAxis = d3
      .axisLeft(vis.yScale)
      .tickFormat((d) => "Trial " + d);

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", 500)
      .attr("height",250);

    // Append group element that will contain our actual chart
    // and position it according to the given margin config
    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${vis.height})`);

    // Append y-axis group
    vis.yAxisG = vis.chart.append("g").attr("class", "axis y-axis");

    // Append y-axis titles
    vis.chart
      .append("text")
      .attr("class", "axis-title")
      .attr("y", 0 - vis.config.margin.top)
      .attr("x", vis.width + 10)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Accuracy(Mean)");
  }

  updateVis() {
    let vis = this;

    vis.xValue = (d) => d.accuracy;

    // sort the y-axis value
    vis.data.sort(function (a, b) {
      var keyA = a.trial;
      var keyB = b.trial;
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    });

    vis.yValue = (d) => d.trial;

    // compute x-axis minimum and maximum
    let minAccuracy = vis.data.map(a => a.accuracy).sort()[0]
    let xMin = minAccuracy < 0 ?  Math.floor(minAccuracy) : 0
    let maxAccuracy = vis.data.map(a => a.accuracy).sort()[vis.data.length-1]
    let xMax = Math.ceil(maxAccuracy)

    // Set the scale input domains
    vis.xScale.domain([xMin, xMax]);
    vis.yScale.domain(vis.data.map(vis.yValue));

    vis.renderVis();
  }


  renderVis() {
    let vis = this;

    // Add circles
    vis.chart
      .selectAll(".point")
      .data(vis.data)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("r", 8)
      .attr("cy", (d) => vis.yScale(vis.yValue(d)) + vis.yScale.bandwidth() / 2)
      .attr("cx", (d) => vis.xScale(vis.xValue(d)))
      .attr("fill", "darkblue")
      .attr("opacity", "0.3");

    // Compute mean value for each trial
    let mean = vis.data.reduce((result, item) => {
      result[item.trial] = result[item.trial] || [];
      result[item.trial].push(item);
      return result;
    }, Object.create(null))

    let keys = Object.keys(mean)
    let means = []
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let len = mean[key].length;
      let sum = mean[key].reduce(function (res, obj) { return res + obj.accuracy; }, 0);
      let currMean = Math.round((sum / len) * 100) / 100;
      means.push({trial: +key, mean: currMean})
    }

    // Add right y-axis
    vis.chart
      .selectAll('.text')
        .data(means)
        .enter()
      .append('text')
        .text(d => d.mean)
        .attr('class', 'custom-paragraph')
        .attr("y", (d) =>  (+d.trial - 0.4) * vis.yScale.bandwidth())
        .attr("x", vis.width + vis.config.margin.right / 3)
        .attr("fill", "#525252")

    vis.xAxisG.call(vis.xAxis).call((g) => g.select(".domain").remove());
    vis.yAxisG.call(vis.yAxis).call((g) => g.select(".domain").remove());
  }
}
