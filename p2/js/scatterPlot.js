class Scatterplot {

    constructor(_config, _dispatcher, _data, _currGender, _currLeader) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 695,
            containerHeight: _config.containerHeight || 300,
            margin: _config.margin || {top: 25, right: 10, bottom: 20, left: 30},
            tooltipPadding: _config.tooltipPadding || 15,
        
            // by default: oecd
            region: "oecd",
        }
    
        this.dispatcher = _dispatcher;
        this.data = _data;
        this.currGender = _currGender;
        this.selectedLeader = _currLeader;

        this.initVis();
    }
  
    /**
     * We initialize scales/axes and append static elements, such as axis titles.
     */
    initVis() {
        let vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.xScale = d3.scaleLinear()
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickSize(-vis.height - 10)
            .tickPadding(10)

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(6)
            .tickSize(-vis.width - 10)
            .tickPadding(10);

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart 
        // and position it according to the given margin config
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // click this rect and clear the selected leader
        vis.chart.append('rect')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .attr('fill', 'transparent')
            .on("click", () => {
                vis.selectedLeader = []
                vis.renderVis()
                vis.dispatcher.call("filterLeader", null, [])
            })

        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0, ${vis.height})`);
        
        // Append y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        // Append both axis titles
        vis.chart.append('text')
            .attr('class', 'axis-title')
            .attr('y', vis.height - 15)
            .attr('x', vis.width + 10)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text('GDP per Capita (US$)');

        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', 0)
            .attr('y', 0)
            .attr('dy', '.71em')
            .text('Age');
    }

    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
        let vis = this;
        let region = vis.config.region;  
        
        vis.filteredData = vis.data.filter((d) => d[region] === 1 && d.duration > 0 && d.pcgdp != null)

        vis.xValue = (d) => d.pcgdp
        vis.yValue = (d) => d.start_age
        
        // Set the scale input domains
        vis.xScale.domain([0, d3.max(vis.filteredData, vis.xValue)]);
        vis.yScale.domain([25, 95])

        vis.renderVis();
    }

    /**
     * Bind data to visual elements.
     */
    renderVis() {
        let vis = this;
        
        const points = vis.chart
            .selectAll(".point")
            .data(vis.filteredData, (d) => d.id)
            .join("circle")
            .attr("class", "point")
            .classed("selected", (d) => {   
                if(vis.selectedLeader.includes(d.id)) {
                    return true;
                }
                return false;
            })
            .classed("active", (d) => {
                if (vis.currGender === undefined) {
                    return false
                }
                if(d.gender === vis.currGender) {
                    return true
                }
                return false
            })
            .classed("inactive", (d) => {
                if (vis.currGender === undefined) {
                    return false
                }
                if (d.gender !== vis.currGender) {
                    return true
                }
                return false
            })
            .attr("r", 5)
            .attr("cy", (d) => vis.yScale(vis.yValue(d)))
            .attr("cx", (d) => vis.xScale(vis.xValue(d)))

        // Tooltip event listeners
        points
            .on("mouseover", (event, d) => {
                d3
                .select("#tooltip")
                .style("display", "block")
                .attr("stroke", "#494949")
                .style("left", event.pageX + vis.config.tooltipPadding + "px")
                .style("top", event.pageY + vis.config.tooltipPadding + "px")
                .html(`
                    <div class="tooltip-title">${d.leader}</div>
                    <div>
                        <i>${d.country}</i>
                        <i>${d.start_year} - ${d.end_year}</i>
                    </div>
                    <ul>
                        <li>Age at inauguration: ${d.start_age}</li>
                        <li>Time in office: ${d.end_year - d.start_year} years</li>
                        <li>GDP/capita: ${Math.floor(d.pcgdp)}</li>
                    </ul>
                `);
            })
            .on("mouseleave", () => {
                d3.select("#tooltip").style("display", "none");
            });

        points
            .on("click", (event, d) => {
                // flip current point's class
                d3.select(event.currentTarget)
                .classed(
                    "selected", 
                    !d3.select(event.currentTarget).classed("selected")
                )
                if (vis.selectedLeader.includes(d.id)) {
                    vis.selectedLeader = vis.selectedLeader.filter(k => k !== d.id)
                }
                else {
                    vis.selectedLeader.push(d.id)
                }

                vis.dispatcher.call("filterLeader", event, vis.selectedLeader)
            })
        

        // Update the axes/gridlines
        // We use the second .call() to remove the axis and just show gridlines
        vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.select('.domain').remove());

        vis.yAxisG
            .call(vis.yAxis)
            .call(g => g.select('.domain').remove())
    }
}