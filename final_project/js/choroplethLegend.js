class MapLegend {
	constructor(_config, _colorMap, _generalColorMap, _indexMap) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: _config.containerWidth || 300,
			containerHeight: _config.containerHeight || 150,
			legendBottom: 50,
			legendLeft: 50,
			legendRectHeight: 12, 
			legendRectWidth: 150,
			nightMode: _config.nightMode || false,
			crimeColorScale: _config.crimeColor || ['#E4E2E2', '#1B1B1B'],
			crimeNumberExtent: _config.totalCrimeExtent || [1583, 48725],
			crime: _config.crime || "",
		}
		this.generalColorMap = Object.assign({}, _colorMap, _generalColorMap);
		this.indexMap = _indexMap;
		this.generalCirmeMap = {
			"Theft": "theft",
			"Mischief": "mischief",
			"Break and Enter": "bae",
			"Vehicle Collision or Pedestrian Struck": "vc"
		};
		this.initVis();
	}

	/**
	 * Create SVG area, initialize scales and axes
	 */
	initVis() {
		let vis = this;
		vis.svg = d3.select(vis.config.parentElement).append('svg')
          .attr('width', vis.config.containerWidth)
          .attr('height', vis.config.containerHeight)
          .attr('x', '68%')
          .attr('y', '0%')

		vis.chart = vis.svg.append('g')
		// Initialize gradient for the legend
		vis.linearGradient = vis.svg.append('defs').append('linearGradient')
		.attr("id", "legend-gradient")
		.attr('transform', `translate(100,30)`);

		// Append legend
		vis.legend = vis.chart.append('g')
			.attr('class', 'legend')
			.attr('transform', `translate(20,30)`);
		
		vis.legendRect = vis.legend.append('rect')
			.attr('width', vis.config.legendRectWidth)
			.attr('height', vis.config.legendRectHeight);

		vis.legendTitle = vis.legend.append('text')
			.attr('class', 'legend-title')
			.attr('dy', '.35em')
			.attr('y', -10)
			.attr('font-size', 12)
			.text('Severity level of total number of crimes')

        this.updateVis();
	}

	/**
	 * Prepare data and scales
	 */
	updateVis() {
		let vis = this;
		let crimeColor
		if(vis.config.nightMode) {
			if(vis.config.crime) {
				let colorVariable = vis.indexMap[vis.config.crime] === undefined ? `--crime-${vis.generalCirmeMap[vis.config.crime]}` : `--crime-${vis.indexMap[vis.config.crime]}`
				let colorCSS = getComputedStyle(document.documentElement).getPropertyValue(colorVariable)
				crimeColor = colorCSS
			} else crimeColor = 'grey'
		} else crimeColor = vis.config.crime ? vis.generalColorMap[vis.config.crime] : '#1B1B1B'
		
      	let crimeColorRange = ['#ffffff00', crimeColor]
		// Define begin and end of the color luminance
		vis.legendRanges = [
			{ color: crimeColorRange[0], value: vis.config.crimeNumberExtent[0], offset: 0},
			{ color: crimeColorRange[1], value: vis.config.crimeNumberExtent[1], offset: 100},
		  ];

		vis.renderVis();
	}

	/**
	 * Bind data to visual elements, update axes
	 */
	renderVis() {
		let vis = this;

		// Add legend labels
		vis.legend.selectAll('.legend-label')
			.data(vis.legendRanges)
		  .join('text')
			.attr('class', 'legend-label')
			.attr('text-anchor', 'middle')
			.classed('night', vis.config.nightMode)
			.attr('dy', '.35em')
			.attr('y', 20)
			.attr('x', (d,index) => {
			  return index == 0 ? 0 : vis.config.legendRectWidth;
			})
			.text(d => d.value);

		// Update gradient for legend
		vis.linearGradient.selectAll('stop')
			.data(vis.legendRanges)
		.join('stop')
			.attr('offset', d => d.offset)
			.attr('stop-color', d => d.color);
		vis.legendRect.attr('fill', 'url(#legend-gradient)');
	}

}