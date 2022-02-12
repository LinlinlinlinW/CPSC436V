class Timeline {

  /**
   * Class constructor with initial configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      disasterCategories: _config.disasterCategories,
      containerWidth: 800,
      containerHeight: 900,
      tooltipPadding: 15,
      margin: {top: 120, right: 20, bottom: 50, left: 45},
      legendWidth: 170,
      legendHeight: 8,
      legendRadius: 5
    }
    this.data = _data;
    this.selectedCategories = [];
    this.initVis();
  }
  
  /**
   * We initialize the arc generator, scales, axes, and append static elements
   */
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Todo: Initialize scales and axes
    vis.xScale = d3.scaleTime()
        .range([0, vis.width]);

    vis.yScale = d3.scaleLinear()
        .range([0, vis.height]);

    vis.dataScale = d3.scaleLinear()
        .range([0, vis.width]);

    vis.colorScale = d3.scaleOrdinal();
    
    // Initialize axes
    vis.xAxis = d3
        .axisTop(vis.xScale)
        .tickPadding(3)
        .tickSize(10)
        .tickFormat(d3.timeFormat("%b"))

    vis.yAxis = d3
        .axisLeft(vis.yScale)
        .tickSize(-vis.width)
        .ticks(37)
        .tickPadding(15)
        .tickFormat(d3.format("d"))

    // Initialize arc generator that we use to create the SVG path for the half circles. 
    vis.arcGenerator = d3.arc()
        .outerRadius(d => vis.radiusScale(d))
        .innerRadius(0)
        .startAngle(-Math.PI / 2)
        .endAngle(Math.PI / 2);

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chartArea = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Todo: Append axis groups
    vis.xAxisG = vis.chartArea
        .append("g")
        .attr("class", "axis x-axis");

    // Append y-axis group
    vis.yAxisG = vis.chartArea
        .append("g")
        .attr("class", "axis y-axis")
        .attr('transform', `translate(${0},${15})`);

    // Initialize clipping mask that covers the whole chart
    vis.chartArea.append('defs')
      .append('clipPath')
        .attr('id', 'chart-mask')
      .append('rect')
        .attr('width', vis.width)
        .attr('y', -vis.config.margin.top)
        .attr('height', vis.config.containerHeight);

    // Apply clipping mask to 'vis.chart' to clip semicircles at the very beginning and end of a year
    vis.chart = vis.chartArea.append('g')
        .attr('clip-path', 'url(#chart-mask)');

    // Optional: other static elements

    /**
     * compute costDomain for radius scale
     */
    let costDomain = vis.data.filter((v, i, a) => a.indexOf(v) === i).map((d) => +d.cost);
    let costMin = d3.min(costDomain)
    let costMax = d3.max(costDomain)
    vis.radiusScale = d3.scaleSqrt()
      .range([4, 140])
      .domain([costMin, costMax])
    
    vis.updateVis();
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis() {
    let vis = this

    // Todo
    /** sort the data by year */
    vis.data.sort(function (a, b) {
      var keyA = a.year;
      var keyB = b.year;
      if (keyA > keyB) return -1;
      if (keyA < keyB) return 1;
      return 0;
    });

    /** get grouped data by year */
    vis.groupDataByYear = d3.groups(vis.data, d => d.year);

    /** initialize xValue with months */ 
    vis.xValue = (d) => {
      let month = d.date.getMonth()
      return month
    }

    /** initialize yValue with years */ 
    vis.yValue = (d) => {
      return d[0]
    }

    /** compute yRange*/
    vis.yScale.domain([2017, 1980]);

    /** compute xRange*/
    vis.xScale.domain([new Date("2016-1-1"), new Date("2016-12-31")])

    /** 
     * compute color range
     */
    // get unique values of categories
    let colorDomainCate = vis.data.map(d => d.category).filter((v, i, a) => a.indexOf(v) === i)
    let clrPairs = {};

    colorDomainCate.forEach(e => {
      switch (e) {
        case "winter-storm-freeze":
          clrPairs = Object.assign(clrPairs, {"winter-storm-freeze": "#ccc"})
          break;
        case "drought-wildfire":
          clrPairs = Object.assign(clrPairs, {"drought-wildfire": "#ffffd9"})
          break;
        case "flooding":
          clrPairs = Object.assign(clrPairs, {"flooding": "#41b6c4"})
          break;
        case "tropical-cyclone":
          clrPairs = Object.assign(clrPairs, {"tropical-cyclone": "#081d58"})
          break;
        case "severe-storm":
          clrPairs = Object.assign(clrPairs, {"severe-storm": "#c7e9b4"})
          break;
        default:
          break;
      }
    })
    
    let colorDomain = Object.keys(clrPairs)
    let colorRange = Object.values(clrPairs)
    vis.colorScale.range(colorRange);
    vis.colorScale.domain(colorDomain);

    /**
     * compute data domain
     */
    vis.dataScale.domain([1, 366])

    /**
     * get the name of the costliest disaster of each year
     */

    let yearlyCostliestName = vis.groupDataByYear.map((d) => {
      // get the year & all the disasters in that year
      let year = d['0']
      let itemsInYear = d['1']

      // sort the disasters of that year by cost
      itemsInYear.sort((a,b) => a.cost > b.cost)

      // get the highest cost of that year
      let cost = itemsInYear[0].cost

      // get the names of disaster with that cost
      let name = itemsInYear.filter(obj => {
        return obj.cost === cost
      }).map(d => d.name)

      return {[year]: name}
    })

    vis.yearlyCostliestName = yearlyCostliestName

    vis.renderVis();
  }

  /**
   * Bind data to visual elements (enter-update-exit) and update axes
   */
  renderVis() {
    let vis = this;

    // Todo
    /** 
     * 1st level: 
     * Create a group for each year and set the position using SVG's translate() transformation. 
     */
    // SELECT (Bind data to selection)
    const yearGroup = vis.chart.selectAll('.year-group')
      .data(vis.groupDataByYear);

    // Enter (newly added data: yearGroupEnter)
    const yearGroupEnter = yearGroup.enter().append('g')
      .attr('class', 'year-group');

    // Enter + update
    yearGroupEnter.merge(yearGroup)
      .attr('transform', (d) => `translate(0, ${vis.yScale(vis.yValue(d))})`)
    
    // Exit
    yearGroup.exit().remove()
    
    /**
     *  2nd level:
     *  Within each year group, 
     *  create a group for each disaster and position it based on the day of the year.
     */
    // Enter + update
    const disasterGroup = yearGroup
      .merge(yearGroupEnter)
      .selectAll('.disaster-group')
      .data(d => d[1], d => d.name);

    const disasterGroupEnter = disasterGroup
      .enter()
      .append('g')
      .attr('class', 'disaster-group')
      
    disasterGroupEnter
      .merge(disasterGroupEnter) 
      .attr('transform', (d) => {
        let dayOfYear = d3.timeFormat("%j")
        let day = dayOfYear(d.date)
        let translate = `translate(${vis.dataScale(day)}, 15)`
        return translate
      })
    
    // exit
    disasterGroup.exit().remove()
    
    /**
     * 3rd level: 
     * Within each disaster, create a path element for the semicircle, 
     * and a text label for the largest disaster per year
     */
    const semicircles = disasterGroup
      .merge(disasterGroupEnter)
      .selectAll(".mark")
      .data((d) => [d]);

    // Enter
    const semicirclesEnter = semicircles
      .enter()
      .append("path")
      .attr("class", "mark");

    // Update
    semicirclesEnter
      .merge(semicircles)
      .attr('text-anchor', 'middle')
      .attr('d', d => vis.arcGenerator(+d.cost))
      .attr('fill', (d) => vis.colorScale(d.category))
      .attr('fill-opacity', 0.8)
      .attr('stroke', "#333")
      .attr('stroke-width', 0.3)
      .style('opacity', 0.6)
      .on("mouseover", (event, d) => {
        d3
          .select("#tooltip")
          .style("display", "block")
          .style("left", event.pageX + vis.config.tooltipPadding + "px")
          .style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
              <div class='tooltip-title'>${d.name}</div>
              <div>$<strong>${d.cost}</strong> billion</div>
            `);
      })
      .on("mouseleave", () => {
        d3.select("#tooltip").style("display", "none");
      })

    // exit
    semicircles.exit().remove()

    /**
     * Add a text label with the name of the costliest disaster of each year. 
     */
    const textLabel = disasterGroup
      .merge(disasterGroupEnter)
      .selectAll(".text")
      .data((d) => [d]);

    const textLabelEnter = textLabel
      .enter()
      .append('text')
      .attr("class", "text")
    
    //update
    textLabelEnter
      .merge(textLabel)
      .text(d => {     
        let currYear = +d.year
        let currName = d.name

        // get the array of costliest disasters' names of this year
        let costliestNameInThisYear = vis.yearlyCostliestName.filter(d=>d[currYear])[0][currYear]
        if ((costliestNameInThisYear.includes(currName))) {
          return d.name
        }
        else {
          return null
        }}
      )
      .attr('y', (d) => {
        return 12
      })
      .attr('opacity', 0.6)
      .attr('font-size', 12)
      .attr('text-anchor', 'middle')

    // exit
    textLabel.exit().remove()

    vis.xAxisG.call(vis.xAxis).call((g) => g.select(".domain").remove());
    vis.yAxisG.call(vis.yAxis).call((g) => g.select(".domain").remove());
  }
 
  renderLegend() {
    let vis = this;

    // Todo: Display the disaster category legend that also serves as an interactive filter.
    // You can add the legend also to `index.html` instead and have your event listener in `main.js`.
  }
}