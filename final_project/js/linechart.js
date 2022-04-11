class Linechart {
  constructor(_config, _data, _colorMap, _indexMap, _generalColorMap) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 700,
      containerHeight: _config.containerHeight || 300,
      margin: _config.margin || { top: 30, right: 20, bottom: 20, left: 40 },
      yearRange: _config.yearRange || [2017, 2021],
      crime: _config.crime || null,
      nightMode: _config.nightMode || false,
      neibourhood: _config.neibourhood || null,
      tooltipPadding: 10,
    };
    this.data = _data;
    this.colorMap = _colorMap || {};
    this.indexMap = _indexMap || {};
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

    // xScale
    vis.xScale = d3.scaleTime().range([0, vis.width]);

    // yScale
    vis.yScale = d3.scaleLinear().range([vis.height, 0]);

    // day colorScale
    vis.dayColorScale = d3
      .scaleOrdinal()
      .range(["#2A5509", "#41b6c4", "#8d82f7"])
      .domain([0, 1, 2]);

    // night color Scale
    vis.nightColorScale = d3
      .scaleOrdinal()
      .range(["#8ce382", "#F36565", "#f7cadc"])
      .domain([0, 1, 2]);

    // labelScale
    vis.yPositionScale = d3
      .scaleOrdinal()
      .range([-10, 5, 20])
      .domain([0, 1, 2]);

    // x-axis layout
    vis.xAxis = d3
      .axisBottom(vis.xScale)
      .tickFormat(d3.timeFormat("%y-%m"))
      .tickPadding(5);

    // y-axis layout
    vis.yAxis = d3
      .axisLeft(vis.yScale)
      .ticks(10)
      .tickPadding(5)
      .tickFormat(d3.format("d"));

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    // Append group element that will contain our actual chart
    // and position it according to the given margin config
    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    // Append x-axis to bottom
    vis.xAxisG = vis.chart
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${vis.height})`);

    // Append y-axis to left
    vis.yAxisG = vis.chart.append("g").attr("class", "axis y-axis");

    // Initialize tooltip
    vis.tooltip = vis.chart
      .append("g")
      .attr("class", "tooltip")
      .style("display", "none");

    // Initialize trackingArea
    vis.trackingArea = vis.chart
      .append("rect")
      .attr("width", vis.width - 20)
      .attr("height", vis.height)
      .attr("fill", "none")
      .attr("pointer-events", "all");

    // append x-axis label
    vis.chart
      .append("text")
      .attr("class", "x-axis-label")
      .classed("night", vis.config.nightMode)
      .attr("font-size", 12)
      .attr("transform", `translate(${vis.width - 20},${vis.height - 10})`)
      .text("Date");

    // append y-axis label
    vis.chart
      .append("text")
      .attr("class", "y-axis-label")
      .classed("night", vis.config.nightMode)
      .attr("font-size", 12)
      .attr("transform", `translate(-40, -10)`)
      .text("Cases");

    vis.updateVis();
  }

  /**
   * Prepare data and scales
   */
  updateVis() {
    let vis = this;

    let hasNeibourhood = vis.config.neibourhood != null ? true : false;

    // group by Month
    vis.groupByMonthData = [];
    let crimePerMonth = [];

    // domain
    vis.xScale.domain([
      new Date(vis.config.yearRange[0] - 1, 11, 31),
      new Date(vis.config.yearRange[vis.config.yearRange.length - 1], 12, 31),
    ]);

    // helper function
    vis.yValue = (d) => d[1]; // total # of crimes
    vis.xValue = (d) => d[0]; // date

    vis.line = d3
      .line()
      .x((d) => vis.xScale(vis.xValue(d)))
      .y((d) => vis.yScale(vis.yValue(d)));

    // filter data by year and neighborhood
    if (hasNeibourhood) {
      // with crime
      if (vis.config.crime !== null) {
        vis.filterYearValue =
          vis.config.yearRange.length === 1
            ? (d) =>
                d.YEAR === vis.config.yearRange[0] &&
                vis.config.neibourhood.includes(d.NEIGHBOURHOOD) &&
                d.TYPE.includes(vis.config.crime)
            : (d) =>
                d.YEAR >= vis.config.yearRange[0] &&
                d.YEAR <= vis.config.yearRange[1] &&
                vis.config.neibourhood.includes(d.NEIGHBOURHOOD) &&
                d.TYPE.includes(vis.config.crime);
      } else {
        // without crime
        vis.filterYearValue =
          vis.config.yearRange.length === 1
            ? (d) =>
                d.YEAR === vis.config.yearRange[0] &&
                vis.config.neibourhood.includes(d.NEIGHBOURHOOD)
            : (d) =>
                d.YEAR >= vis.config.yearRange[0] &&
                d.YEAR <= vis.config.yearRange[1] &&
                vis.config.neibourhood.includes(d.NEIGHBOURHOOD);
      }
      // filter data
      let yearData = vis.data.filter(vis.filterYearValue);

      // count monthly # of crimes based on each neighborhood
      vis.filteredData = d3.rollups(
        yearData,
        (g) => g.length,
        (d) => d.NEIGHBOURHOOD,
        (d) => d.YEAR,
        (d) => d.MONTH
      );

      // Group data i.e. [["point grey", [...]], ["downtown", [...]], ...]
      let groupData = [];
      vis.filteredData.forEach((neighborhood) => {
        let monthArr = [neighborhood[0], []];
        neighborhood[1].forEach((year) => {
          year[1].forEach((month) => {
            let date = new Date(year[0], month[0] - 1, 1);
            monthArr[1].push([date, month[1]]);
            crimePerMonth.push(month[1]);
          });
        });
        groupData.push(monthArr);
      });

      // Sort by date
      groupData.forEach((neibourhood) => {
        neibourhood[1].sort(function sortByDateAscending(a, b) {
          // Dates will be cast to numbers automagically:
          return a[0] - b[0];
        });
      });

      vis.yScale.domain([0, d3.max(crimePerMonth) + 10]);
      vis.groupByMonthData = groupData;
    } else {
      let groupData = ["Vancouver", []];
      // without neighborhood
      if (vis.config.crime !== null) {
        vis.filterYearValue =
          vis.config.yearRange.length === 1
            ? (d) =>
                d.YEAR === vis.config.yearRange[0] &&
                d.TYPE.includes(vis.config.crime)
            : (d) =>
                d.YEAR >= vis.config.yearRange[0] &&
                d.YEAR <= vis.config.yearRange[1] &&
                d.TYPE.includes(vis.config.crime);
      } else {
        vis.filterYearValue =
          vis.config.yearRange.length === 1
            ? (d) => d.YEAR === vis.config.yearRange[0]
            : (d) =>
                d.YEAR >= vis.config.yearRange[0] &&
                d.YEAR <= vis.config.yearRange[1];
      }
      // filter data
      let yearData = vis.data.filter(vis.filterYearValue);

      // count monthly # of crimes based on each neighborhood
      vis.filteredData = d3.rollups(
        yearData,
        (g) => g.length,
        (d) => d.YEAR,
        (d) => d.MONTH
      );

      //Group data i.e. [["Vancouver", [...]]]
      vis.filteredData.forEach((year) =>
        year[1].forEach((month) => {
          let date = new Date(year[0], month[0] - 1, 1);
          groupData[1].push([date, month[1]]);
          crimePerMonth.push(month[1]);
        })
      );

      // sort data by month
      groupData[1].sort(function sortByDateAscending(a, b) {
        // Dates will be cast to numbers automagically:
        return a[0] - b[0];
      });

      vis.groupByMonthData.push(groupData);
      vis.yScale.domain([0, d3.max(crimePerMonth) + 10]);
    }
    vis.renderVis();
  }

  /**
   * Bind data to visual elements, update axes
   */
  renderVis() {
    let vis = this;

    // transition helper function
    vis.transition = function transition(path) {
      path
        .transition()
        .duration(5500)
        .attrTween("stroke-dasharray", function () {
          var len = this.getTotalLength();
          return function (t) {
            return d3.interpolateString("0," + len, len + ",0")(t);
          };
        })
        .on("end", () => {
          d3.select(this).call(transition);
        });
    };

    //group by neighborhood
    const groupByNeighbor = vis.chart
      .selectAll(".lineChartNeighbor")
      .data(vis.groupByMonthData, (d) => d[0])
      .join((enter) => enter.append("g"))
      .attr("class", (d) => `lineChartNeighbor neighbor-${d[0]}`)
      .attr("stroke", (d, i) => {
        if (vis.config.nightMode) {
          return vis.nightColorScale(i);
        }
        return vis.dayColorScale(i);
      });

    // draw line
    const line = groupByNeighbor
      .selectAll(".chart-line")
      .data(
        (d) => [d[1]],
        (d) => d[0]
      )
      .join("path")
      .attr("class", "chart-line")
      .attr("fill", "none")
      .attr("opacity", 0.5)
      .attr("stroke-width", 3)
      .style("display", "block")
      .attr("d", vis.line)
      .call(vis.transition);

    //draw neighborhood label
    const neighborLabel = vis.chart
      .selectAll(".line-label")
      .data(vis.groupByMonthData, (d) => d[0])
      .join("text")
      .attr("class", "line-label")
      .attr("x", 50)
      .attr("y", (d, i) => vis.yPositionScale(i))
      .attr("font-size", 15)
      .attr("opacity", 0.5)
      .attr("fill", (d, i) => {
        if (vis.config.nightMode) {
          return vis.nightColorScale(i);
        }
        return vis.dayColorScale(i);
      })
      .text((d) => d[0]);

    // draw crime label
    vis.chart
      .selectAll(".crime-label")
      .data([vis.config.crime])
      .join("text")
      .attr("class", "crime-label")
      .classed("night", vis.config.nightMode)
      .attr("font-size", 12)
      .attr("font-weight", 50)
      .attr("fill", (d) => vis.colorMap[d] || vis.generalColorMap[d])
      .attr("id", (d) => {
        if (d === "Theft") {
          return "crime-theft-linechart";
        }
        if (d === "Mischief") {
          return "crime-mischief-linechart";
        }
        if (d === "Break and Enter") {
          return "crime-bae-linechart";
        }
        if (d === "Vehicle Collision or Pedestrian Struck") {
          return "crime-vc-linechart";
        } else {
          return "neighbor-crime-" + vis.indexMap[d];
        }
      })
      .attr("x", 290)
      .attr("y", -10)
      .text((d) => d);

    // tooltip
    vis.trackingArea
      .on("mouseenter", () => {
        vis.tooltip.style("display", "block");
      })
      .on("mouseleave", () => {
        vis.tooltip.style("display", "none");
      })
      .on("mousemove", (event, d, i) => {
        // get date from the tracking area
        let date = vis.xScale.invert(d3.pointer(event, this.svg.node())[0]);
        date.setMonth(date.getMonth() - 4);
        vis.bisectDate = d3.bisector((d) => d[0]).right;
        const originalData = [];
        for (let neighbor of vis.groupByMonthData) {
          const index = vis.bisectDate(neighbor[1], date, 1);
          const a = neighbor[1][index - 1];
          const b = neighbor[1][index];
          if (a === undefined) {
            originalData.push(b);
          } else if (b === undefined) {
            originalData.push(a);
          } else {
            let preciseData = b[0] && date - a[0] > b[0] - date ? b : a;
            if (originalData.length !== 0) {
              const firstDate = originalData[0][0];
              const month = firstDate.getMonth();
              const year = firstDate.getFullYear();
              if (+preciseData[0].getTime() !== +firstDate.getTime()) {
                preciseData[0].setMonth(month);
                preciseData[0].setFullYear(year);
              }
            }
            originalData.push(preciseData);
          }
        }
        //draw circle
        const focus = vis.tooltip
          .selectAll(".focus-circle")
          .data(originalData)
          .join("circle")
          .attr("class", "focus-circle")
          .style("fill", "none")
          .attr("stroke", (d) => {
            if (vis.config.nightMode) {
              return "white";
            }
            return "black";
          })
          .attr("r", 6)
          .style("opacity", 1)
          .attr("cx", (d) => vis.xScale(vis.xValue(d)))
          .attr("cy", (d) => vis.yScale(vis.yValue(d)));

        // draw vertical line
        const tooltipLine = vis.tooltip
          .selectAll(".tooltip-line")
          .data(originalData)
          .join("line")
          .attr("stroke", (d) => {
            if (vis.config.nightMode) {
              return "white";
            }
            return "black";
          })
          .attr("class", "tooltip-line")
          .attr("x1", (d) => vis.xScale(vis.xValue(d)))
          .attr("x2", (d) => vis.xScale(vis.xValue(d)))
          .attr("y1", 0)
          .attr("y2", vis.height);

        // append cases
        const focusCase = vis.tooltip
          .selectAll(".tooltip-case")
          .data(originalData)
          .join("text")
          .attr("class", "tooltip-case")
          .attr("text-anchor", (d) =>
            vis.xScale(vis.xValue(d)) > vis.width - vis.width / 6
              ? "end"
              : "left"
          )
          .attr("dx", (d) =>
            vis.xScale(vis.xValue(d)) > vis.width - vis.width / 6 ? -10 : 10
          )
          .attr("alignment-baseline", "middle")
          .attr("font-size", 12)
          .attr("fill", (d) => {
            if (vis.config.nightMode) {
              return "white";
            }
            return "black";
          })
          .attr("x", (d) => vis.xScale(vis.xValue(d)))
          .attr("y", (d) => vis.yScale(vis.yValue(d)))
          .text((d) => d[1]);

        // append date at the bottom
        const focusDate = vis.tooltip
          .selectAll(".tooltip-date")
          .data(originalData)
          .join("text")
          .attr("class", "tooltip-date")
          .attr("text-anchor", (d) =>
            vis.xScale(vis.xValue(d)) > vis.width - vis.width / 6
              ? "end"
              : "left"
          )
          .attr("dx", (d) =>
            vis.xScale(vis.xValue(d)) > vis.width - vis.width / 6 ? -10 : 5
          )
          .attr("alignment-baseline", "middle")
          .attr("font-size", 12)
          .attr("fill", (d) => {
            if (vis.config.nightMode) {
              return "white";
            }
            return "black";
          })
          .attr("x", (d) => vis.xScale(vis.xValue(d)))
          .attr("y", vis.height + 5)
          .text((d) => {
            return (
              d[0].getFullYear() +
              "-" +
              ("0" + (d[0].getMonth() + 1)).slice(-2) +
              "-" +
              ("0" + d[0].getDate()).slice(-2)
            );
          });
      });

    vis.xAxisG
      .call(vis.xAxis)
      .selectAll(".tick line")
      .attr("stroke", vis.config.nightMode ? "white" : "black");

    vis.yAxisG
      .call(vis.yAxis)
      .selectAll(".tick line")
      .attr("stroke", vis.config.nightMode ? "white" : "black");
    vis.xAxisG
      .call(vis.xAxis)
      .selectAll(".tick text")
      .attr("fill", vis.config.nightMode ? "white" : "black");

    vis.yAxisG
      .call(vis.yAxis)
      .selectAll(".tick text")
      .attr("fill", vis.config.nightMode ? "white" : "black");
    //Update axes
    vis.xAxisG.call(vis.xAxis).call((g) => g.select(".domain").remove());

    vis.yAxisG.call(vis.yAxis).call((g) => g.select(".domain").remove());
  }
}
