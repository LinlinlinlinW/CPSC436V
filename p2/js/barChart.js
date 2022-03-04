class Barchart {

  	constructor(_config, _dispatcher, _data) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: _config.containerWidth || 260,
			containerHeight: _config.containerHeight || 300,
			margin: _config.margin || {top: 25, right: 20, bottom: 20, left: 40},
		
			// by default: oecd
			region: "oecd"
		}
		this.dispatcher = _dispatcher,
		this.data = _data;
		this.initVis();
  	}

	/**
	 * Create SVG area, initialize scales and axes
	 */
	initVis() {
	let vis = this;

	vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
	vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

	vis.yScale = d3.scaleLinear()
		.range([vis.height, 0]) 

	vis.xScale = d3.scaleBand()
		.range([0, vis.width])
		.paddingInner(0.2);

	vis.xAxis = d3.axisBottom(vis.xScale)
		.ticks(['Male', 'Female'])
		.tickSizeOuter(0);

	vis.yAxis = d3.axisLeft(vis.yScale)
		.ticks(6)
		.tickSize(-vis.width)
		.tickSizeOuter(0)
		.tickFormat(d3.format("d"))

	// Define size of SVG drawing area
	vis.svg = d3.select(vis.config.parentElement)
		.attr('width', vis.config.containerWidth)
		.attr('height', vis.config.containerHeight);

	// SVG Group containing the actual chart; D3 margin convention
	vis.chart = vis.svg.append('g')
		.attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

	// Append empty x-axis group and move it to the bottom of the chart
	vis.xAxisG = vis.chart.append('g')
		.attr('class', 'axis x-axis')
		.attr('transform', `translate(0,${vis.height})`);

	// Append y-axis group 
	vis.yAxisG = vis.chart.append('g')
		.attr('class', 'axis y-axis');

	// Append axis title
	vis.svg.append('text')
		.attr('class', 'axis-title')
		.attr('x', 0)
		.attr('y', 0)
		.attr('dy', '.71em')
		.text('Gender');
	}

	/**
	 * Prepare data and scales
	 */
	updateVis() {
		let vis = this;

		let region = vis.config.region;

		let filteredByRegion = vis.data.filter(d => d[region] === 1 && d.duration > 0)

		let aggregatedDataMap = d3.rollups(filteredByRegion, v => v.length, d => d.gender);

		vis.aggregatedData = Array.from(aggregatedDataMap, ([gender, count]) => ({ gender, count }));

		// Specificy accessor functions
		vis.xValue = d => d.gender;
		vis.yValue = d => d.count;

		// Set the scale input domains
		vis.xScale.domain(vis.aggregatedData.map(vis.xValue));
		vis.yScale.domain([0, d3.max(vis.aggregatedData, vis.yValue)]);

		vis.renderVis();
	}

	/**
	 * Bind data to visual elements, update axes
	 */
	renderVis() {
	let vis = this;

	const bars = vis.chart.selectAll('.bar')
		.data(vis.aggregatedData, vis.xValue)
		.join('rect')
		.attr('class', 'bar')
		.attr('x', d => vis.xScale(vis.xValue(d)))
		.attr('width', vis.xScale.bandwidth())
		.attr('height', d => vis.height - vis.yScale(vis.yValue(d)))
		.attr('y', d => vis.yScale(vis.yValue(d)))
		.on("click", function (event, d) {
			// Check if current category is active and toggle class
			const isActive = d3.select(this).classed("active");

			d3.selectAll(".bar.active").classed("active", false);
			d3.select(this).classed("active", !isActive);

			// Get the names of all active/filtered categories
			const selectedGender = vis.chart
				.selectAll(".bar.active")
				.data()
				.map((k) => k.gender);

			// Trigger filter event and pass array with the selected category names
			vis.dispatcher.call("filterGender", event, selectedGender);
		});

	// Update axes
	vis.xAxisG.call(vis.xAxis);
	vis.yAxisG.call(vis.yAxis);
	}
}