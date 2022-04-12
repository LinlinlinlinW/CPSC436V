class Barchart {
  constructor(
    _config,
    _data,
    _colorMap,
    _indexMap,
    _generalColorMap,
    _isDetail
  ) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 700,
      containerHeight: _config.containerHeight || 250,
      margin: _config.margin || { top: 40, right: 20, bottom: 20, left: 0 },
      crime: _config.crime || "",
      nightMode: _config.nightMode || false,
      neibourhood: _config.neibourhood || null,
      neighborhoodTitle_margin: 25,
      yearRange: _config.yearRange || [2017, 2021],
    };
    this.data = _data;
    this.colorMap = _colorMap || {};
    this.indexMap = _indexMap || {};
    this.isDetail = _isDetail || false;
    this.generalColorMap = _generalColorMap || {};
    this.initVis();
  }

  /**
   * Create SVG area, initialize scales and axes
   */
  initVis() {
    let vis = this;
    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    // Initialize scales
    vis.xScale = d3.scaleLinear().range([vis.width, 400]);
    vis.yScale = d3.scaleBand().range([0, vis.height]).paddingInner(0.15);

    // Initialize axes
    vis.yAxis = d3.axisRight(vis.yScale).tickSizeOuter(0);

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    vis.barchartBars = vis.chart.append("svg").attr("id", "barchart-bars");

    // Append y-axis group
    vis.yAxisG = vis.barchartBars
      .append("g")
      .attr("class", "axis y-axis")
      .attr("transform", `translate(${vis.width - 320}, 0)`);

    vis.title = vis.chart
      .append("text")
      .style("display", "block")
      .attr("class", "barchart-title")
      .attr("transform", `translate(100, -10)`)
      .text(vis.isDetail ? "Please select a neighborhood" : "Vancouver");

    if (vis.isDetail) {
      vis.updateVis();
    } else {
      vis.updateGeneralVis();
    }
  }

  /**
   * Prepare data and scales
   */
  updateVis() {
    let vis = this;

    let hasNeibourhood = vis.config.neibourhood != null ? true : false;

    // total Crime to calculate avg/percentage

    if (hasNeibourhood) {
      vis.hasNeibourhood = true;
      if (vis.config.yearRange.length === 1) {
        vis.filterValue = (d) =>
          d.NEIGHBOURHOOD === vis.config.neibourhood &&
          d.YEAR === vis.config.yearRange[0];
      } else {
        vis.filterValue = (d) =>
          d.NEIGHBOURHOOD === vis.config.neibourhood &&
          d.YEAR >= vis.config.yearRange[0] &&
          d.YEAR <= vis.config.yearRange[1];
      }
      const neighborData = vis.data.filter(vis.filterValue);

      //group data by crime type
      vis.filteredData = d3.rollups(
        neighborData,
        (g) => g.length,
        (d) => d.TYPE
      );

      // sort data with descending order
      vis.filteredData = vis.filteredData.sort(function (a, b) {
        return d3.descending(a[1], b[1]);
      });
      vis.filteredData.forEach((crime) =>
        crime.push(Math.ceil((crime[1] / neighborData.length).toFixed(2) * 100))
      );

      vis.xValue = (d) => d[1]; // crime count
      vis.yValue = (d) => d[0]; // crime type

      vis.xScale.domain([0, d3.max(vis.filteredData, vis.xValue)]);
      vis.yScale.domain(vis.filteredData.map(vis.yValue));
      vis.renderVis();
    } else {
      vis.hasNeibourhood = false;
      vis.barchartBars.style("display", "none");
      vis.title.text("Please select a neighborhood");
    }
  }

  updateGeneralVis() {
    let vis = this;
    let hasNeibourhood = vis.config.neibourhood != null ? true : false;

    // total Crime to calculate avg/percentage
    vis.xValue = (d) => d[1]; // crime count
    vis.yValue = (d) => d[0]; // crime type
    if (hasNeibourhood) {
      vis.hasNeibourhood = true;
      if (vis.config.yearRange.length === 1) {
        vis.filterValue = (d) =>
          d.NEIGHBOURHOOD === vis.config.neibourhood &&
          d.YEAR === vis.config.yearRange[0];
      } else {
        vis.filterValue = (d) =>
          d.NEIGHBOURHOOD === vis.config.neibourhood &&
          d.YEAR >= vis.config.yearRange[0] &&
          d.YEAR <= vis.config.yearRange[1];
      }
    } else {
      if (vis.config.yearRange.length === 1) {
        vis.filterValue = (d) => d.YEAR === vis.config.yearRange[0];
      } else {
        vis.filterValue = (d) =>
          d.YEAR >= vis.config.yearRange[0] &&
          d.YEAR <= vis.config.yearRange[1];
      }
    }
    const neighborData = vis.data.filter(vis.filterValue);
    vis.filteredData = [
      ["Theft", 0],
      ["Mischief", 0],
      ["Break and Enter", 0],
      ["Vehicle Collision or Pedestrian Struck", 0],
    ];
    neighborData.forEach((d) => {
      // 2. filter crimes into 4 general types
      if (d.TYPE.includes("Theft")) {
        let currVal = vis.filteredData[0][1];
        vis.filteredData[0][1] = currVal + 1;
      }
      if (d.TYPE.includes("Mischief")) {
        let currVal = vis.filteredData[1][1];
        vis.filteredData[1][1] = currVal + 1;
      }
      if (d.TYPE.includes("Break and Enter")) {
        let currVal = vis.filteredData[2][1];
        vis.filteredData[2][1] = currVal + 1;
      }
      if (d.TYPE.includes("Vehicle Collision or Pedestrian Struck")) {
        let currVal = vis.filteredData[3][1];
        vis.filteredData[3][1] = currVal + 1;
      }
    });
    // sort data with descending order
    vis.filteredData = vis.filteredData.sort(function (a, b) {
      return d3.descending(a[1], b[1]);
    });

    vis.filteredData.forEach((crime) =>
      crime.push(
        Math.round((crime[1] / neighborData.length) * 100)
      )
    );
    vis.xScale.domain([0, d3.max(vis.filteredData, vis.xValue)]);
    vis.yScale.domain(vis.filteredData.map(vis.yValue));
    vis.renderVis();
  }
  /**
   * Bind data to visual elements, update axes
   */
  renderVis() {
    let vis = this;

    vis.chart
      .selectAll(".barchart-title")
      .data([vis.config.neibourhood])
      .join("text")
      .attr("class", "barchart-title")
      .classed("night", vis.config.nightMode)
      .attr("transform", `translate(100, -10)`)
      .text((d) => (vis.config.neibourhood != null ? d : "Vancouver"));

    // Add rectangles
    vis.barchartBars
      .style("display", "block")
      .selectAll(".bar")
      .data(vis.filteredData, vis.yValue)
      .join("rect")
      .attr("class", "bar")
      .classed("night", vis.config.nightMode)
      .attr("id", (d) => {
        if (vis.isDetail) {
          return "neighbor-crime-" + vis.indexMap[d[0]];
        } else {
          if (d[0] === "Theft") {
            return "crime-theft";
          }
          if (d[0] === "Mischief") {
            return "crime-mischief";
          }
          if (d[0] === "Break and Enter") {
            return "crime-bae";
          }
          if (d[0] === "Vehicle Collision or Pedestrian Struck") {
            return "crime-vc";
          }
        }
      })
      .attr("width", (d) => vis.width - vis.xScale(vis.xValue(d)))
      .attr("height", vis.yScale.bandwidth())
      .attr("opacity", (d) => (d[0] === vis.config.crime ? 1 : 0.7))
      .attr("stroke", (d) => {
        if (d[0] === vis.config.crime) {
          if (vis.config.nightMode) {
            return "white";
          } else {
            return "black";
          }
        } else {
          return "none";
        }
      })
      .attr("fill", (d) => {
        if (vis.isDetail) {
          return vis.colorMap[d[0]];
        }
        return vis.generalColorMap[d[0]];
      })
      .attr("stroke-width", (d) => (d[0] === vis.config.crime ? 2 : 0))
      .attr("x", (d) => vis.xScale(vis.xValue(d)) - 320)
      .transition()
      .duration(800)
      .ease(d3.easeLinear)
      .attr("y", (d) => vis.yScale(vis.yValue(d)));
      

    // Add percentage
    vis.barchartBars
      .style("display", "block")
      .selectAll(".percentage")
      .data(vis.filteredData, vis.yValue)
      .join("text")
      .attr("class", "percentage")
      .classed("night", vis.config.nightMode)
      .attr("x", 60)
      .transition()
      .duration(800)
      .ease(d3.easeLinear)
      .attr("y", (d) => vis.yScale(vis.yValue(d)) + vis.yScale.bandwidth() / 2)
      .text((d) => d[2] + "%")
      .attr("font-size", 11)
      .attr("text-anchor", "middle");

    // Update the axes because the underlying scales might have changed
    vis.yAxisG
      .call(vis.yAxis)
      .selectAll(".tick text")
      .attr("fill", vis.config.nightMode ? "white" : "black");
    vis.yAxisG.call(vis.yAxis).call((g) => g.select(".domain").remove());
  }
}
