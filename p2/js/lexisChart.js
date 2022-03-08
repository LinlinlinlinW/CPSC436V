class LexisChart {

	constructor(_config, _dispatcher, _data, _currGender, _selectedLeader) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 1000,
			containerHeight: 380,
			margin: {top: 15, right: 20, bottom: 20, left: 20},
			tooltipPadding: _config.tooltipPadding || 15,

			// by default: oecd
			region: "oecd"
		}

		this.dispatcher = _dispatcher;
		this.data = _data;
		this.currGender = _currGender;
		this.selectedLeader = _selectedLeader;

		this.initVis();
  	}

	/**
	 * Create scales, axes, and append static elements
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
			.ticks(8)
			.tickPadding(5)
			.tickFormat(d3.format("d"))

		vis.yAxis = d3.axisLeft(vis.yScale)
			.ticks(6)

		// Define size of SVG drawing area
		vis.svg = d3.select(vis.config.parentElement)
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);

		// Append group element that will contain our actual chart 
		// and position it according to the given margin config
		vis.chartArea = vis.svg.append('g')
			.attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

		vis.chart = vis.chartArea.append('g');

		// Create default arrow head
		vis.chart
			.append('defs').append('marker')
				.attr('id', 'normal-arrow-head')
				.attr('markerUnits', 'strokeWidth')
				.attr('refX', '2')
				.attr('refY', '2')
				.attr('markerWidth', '10')
				.attr('markerHeight', '10')
				.attr('orient', 'auto')
			.append('path')
				.attr('d', 'M0,0 L2,2 L 0,4')
				.attr('stroke', '#ddd')
				.attr('fill', 'none');
		
		// Create highlighted arrow head
		vis.chart
			.append('defs').append('marker')
				.attr('id', 'highlighted-arrow-head')
				.attr('markerUnits', 'strokeWidth')
				.attr('refX', '2')
				.attr('refY', '2')
				.attr('markerWidth', '10')
				.attr('markerHeight', '10')
				.attr('orient', 'auto')
			.append('path')
				.attr('d', 'M0,0 L2,2 L 0,4')
				.attr('stroke', '#aeaeca')
				.attr('fill', 'none');

		// Create selected arrow head
		vis.chart
			.append('defs').append('marker')
				.attr('id', 'selected-arrow-head')
				.attr('markerUnits', 'strokeWidth')
				.attr('refX', '2')
				.attr('refY', '2')
				.attr('markerWidth', '10')
				.attr('markerHeight', '10')
				.attr('orient', 'auto')
			.append('path')
				.attr('d', 'M0,0 L2,2 L 0,4')
				.attr('stroke', '#f5b342')
				.attr('fill', 'none');

		// Append empty x-axis group and move it to the bottom of the chart
		vis.xAxisG = vis.chart.append('g')
			.attr('class', 'axis x-axis')
			.attr('transform', `translate(0, ${vis.height})`);

		// Append y-axis group
		vis.yAxisG = vis.chart.append('g')
			.attr('class', 'axis y-axis');
		
		// Create y-axis text label
		vis.svg.append('text')
			.attr('class', 'axis-title')
			.attr('x', 0)
			.attr('y', 0)
			.attr('dy', '.71em')
			.text('Age');

		// Initialize clipping mask that covers the whole chart
		vis.chartArea.append('defs')
			.append('clipPath')
				.attr('id', 'chart-mask')
			.append('rect')
				.attr('width', vis.width)
				.attr('y', -vis.config.margin.top)
				.attr('height', vis.config.containerHeight);

		vis.chart = vis.chartArea.append('g')
			.attr('clip-path', 'url(#chart-mask)');
	}


	updateVis() {
		let vis = this;

		// Todo: prepare data
		let region = vis.config.region;
		vis.filteredData = 
			vis.currGender === undefined? 
			vis.data.filter(d => d[region] === 1 && d.duration > 0) 
			:
			vis.data.filter(d => d[region] === 1 && d.duration > 0 && d.gender === vis.currGender)

		vis.highlightedData = vis.data.filter(d => d.label === 1 && d[region] === 1 && d.duration > 0)

		vis.x1Value = (d) => d.start_year
        vis.y1Value = (d) => d.start_age
		vis.x2Value = (d) => d.end_year
        vis.y2Value = (d) => d.end_age

        // Set the scale input domains
        vis.xScale.domain([1950, 2021]);
        vis.yScale.domain([25, 95]);

		vis.renderVis();
	}


	renderVis() {

		// Todo: Bind data to visual elements (enter-update-exit or join)
		let vis = this;

		const arrows = vis.chart
			.selectAll(".arrow")
			.data(vis.filteredData, (d) => d.id)
			.join("line")
			.attr("class", "arrow")
			.classed(".selected", (d) => {
				if (vis.selectedLeader !== undefined && vis.selectedLeader.includes(d.id)) {
					return true;
				}
				return false;
			})
			.classed(".highlighted", (d) => {
				if (d.label === 1) {
					return true;
				}
				return false;
			})
			.attr("x1", (d) => vis.xScale(vis.x1Value(d)))
			.attr("x2", (d) => vis.xScale(vis.x2Value(d)))
			.attr("y1", (d) => vis.yScale(vis.y1Value(d)))
			.attr("y2", (d) => vis.yScale(vis.y2Value(d)))
			.attr("marker-end", d => {
				if (vis.selectedLeader !== undefined && vis.selectedLeader.includes(d.id)) {
					return "url(#selected-arrow-head)"
				}
				if (d.label === 1) {
					return "url(#highlighted-arrow-head)"
				}
				return "url(#normal-arrow-head)"
			})
			.attr("stroke-width", d => {
				if (vis.selectedLeader !== undefined && vis.selectedLeader.includes(d.id)) {
					return 2.5
				}
				if (d.label === 1) {
					return 2.5
				}
				return 1
			})
			.attr("stroke", d => {
				if (vis.selectedLeader !== undefined && vis.selectedLeader.includes(d.id)) {
					return "#f5b342"
				}
				if (d.label === 1) {
					return "#aeaeca"
				}	
				return "#ddd"
			})	

		// Tooltip event listeners
        arrows
            .on("mouseover", (event, d) => {
				d3
				.select("#tooltip")
				.style("display", "block")
				.style("left", (event.pageX + vis.config.tooltipPadding) + "px")
				.style("top", (event.pageY + vis.config.tooltipPadding) + "px")
				.html(`
					<div class="tooltip-title">${d.leader}</div>
					<div>
						<i>${d.country}</i>
						<i>${d.start_year} - ${d.end_year}</i>
					</div>
					<ul>
						<li>Age at inauguration: ${d.start_age}</li>
						<li>Time in office: ${d.end_year - d.start_year} years</li>
						<li>GDP/capita: ${parseInt(d.pcgdp)}</li>
					</ul>
				`);
            })
            .on("mouseleave", () => {
                d3.select("#tooltip").style("display", "none");
            });

		arrows.on("click", (event, d) => {
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


		// Add textLabel
		vis.chart.selectAll('.text')
			.data(vis.filteredData, d => d.id)
			.join('text')
			.attr('class', 'text')
			.text((d) => {
				if (d.label === 1) {
					return d.leader
				}
			})
			.attr('transform', 
				d => 
				`translate(${vis.xScale((d.end_year - d.start_year)/2 + d.start_year - 1.5)}, 
				${vis.yScale((d.end_age - d.start_age)/2 + d.start_age - 0.5)}) rotate(-20)`)
	

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