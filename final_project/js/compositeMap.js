class CompositeMap {

	constructor(_config, _dispatcher, _allCrimes, _data_used, _colorMap, _filteredCrime, _generalColorMap, _indexMap) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: _config.containerWidth || 900,
			containerHeight: _config.containerHeight || 600,
			margin: _config.margin || { top: 10, right: 10, bottom: 10, left: 40 },
			tooltipPadding: 10,
			titlePadding: 60,
			yearRange: _config.yearRange || [],
			nightMode: _config.nightMode || false,
		}
		this.dispatcher = _dispatcher;
		this.crimes = _allCrimes || [];
		this.currCrimeName = "" || null;
		this.data = _data_used;
		this.colorMap = _colorMap;
		this.filteredCrime = _filteredCrime || {
			'Theft': 0,
			'Mischief': 0,
			'Break and Enter': 0,
			'Vehicle Collision or Pedestrian Struck': 0
		};

		this.arcs = null;
		this.crimeText = null;
		this.tPie = null;
		this.mPie = null;
		this.bPie = null;
		this.vPie = null;
		this.generalColorMap = _generalColorMap || {};
		this.indexMap = _indexMap;

		this.initVis();
	}

	/**
	 * Create SVG area, initialize scales and axes
	 */
	initVis() {
		let vis = this;
		vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
		vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		// Define size of SVG drawing area
		vis.svg = d3.select(vis.config.parentElement)
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);

		// Append group element that will contain our actual chart 
		vis.chart = vis.svg.append('g')
			.attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

		vis.piechartMargin = 10;
		vis.pieWidth = 50;
		vis.pieHeight = 50;

		// init donutchart
		vis.donutchart = vis.chart
			.append("g")
			.attr("id", "donut_chart")
			.attr("width", 600)
			.attr("height", 500)
			.attr("transform",
				`translate(${vis.piechartMargin + vis.width / 2}, ${vis.height / 2})`)

		vis.piechart = vis.chart
			.append("g")
			.attr("width", 100)
			.attr("height", 500)
			.attr("transform", `translate(${vis.config.margin.left}, ${vis.config.margin.top})`)

		/* init each pie chart */
		// theft pie
		vis.theft_Pie_svg = vis.piechart.append('g')
			.attr("width", vis.pieWidth)
			.attr("height", vis.pieHeight)
			.attr('id', 'theftPie')
			.attr("transform", () => {
				return `translate(${vis.config.margin.left - 10} , 40)`;
			})
		
		vis.theft_Pie_title = vis.theft_Pie_svg.append('text')
			.attr("width", vis.pieWidth * 2)
			.attr("height", vis.pieHeight * 2)
			.attr('transform', `translate(0, ${vis.pieHeight + 10})`)
			.attr("text-anchor", "middle")

		// mischief pie
		vis.mischief_Pie_svg = vis.piechart.append('g')
			.attr("width", vis.pieWidth)
			.attr("height", vis.pieHeight)
			.attr('id', 'mischiefPie')
			.attr("transform", () => {
				return `translate(${vis.config.margin.left - 10} , 180)`;
			})
		vis.mischief_Pie_title = vis.mischief_Pie_svg.append('text')
			.attr('transform', `translate(0, ${vis.pieHeight + 10})`)
			.attr("text-anchor", "middle")

		// break and enter pie
		vis.bae_Pie_svg = vis.piechart.append('g')
			.attr("width", vis.pieWidth)
			.attr("height", vis.pieHeight)
			.attr('id', 'baePie')
			.attr("transform", () => {
				return `translate(${vis.config.margin.left - 10} , 320)`;
			})
		vis.bae_Pie_title = vis.bae_Pie_svg.append('text')
			.attr('transform', `translate(0, ${vis.pieHeight + 10})`)
			.attr("text-anchor", "middle")

		// vehicle and collision pie
		vis.vc_Pie_svg = vis.piechart.append('g')
			.attr("width", vis.pieWidth)
			.attr("height", vis.pieHeight)
			.attr('id', 'vcPie')
			.attr("transform", () => {
				return `translate(${vis.config.margin.left - 10} , 460)`;
			})
		vis.vc_Pie_title = vis.vc_Pie_svg.append('text')
			.attr('transform', `translate(0, ${vis.pieHeight + 10})`)
			.attr("text-anchor", "middle")

		this.updateVis();
	}

	/**
	 * Prepare data and scales
	 */
	updateVis() {
		let vis = this;

		if (vis.config.yearRange.length === 0) {
			vis.config.yearRange = [default_minYear, default_maxYear];
		}
		if (vis.config.yearRange.length === 1) {
			vis.config.yearRange = [vis.config.yearRange[0], vis.config.yearRange[0]];
		}

		vis.pie = d3.pie().padAngle(0.02)
			.value(d => d[1])

		this.getSubCrimesName();
		this.getSubCrimesAmount();

		this.updateDonutChartVis();
		this.updateInnerDonutChartVis();
		this.updatePieChartVis();

		vis.renderVis();
	}

	// categorize each crime into four general types by name
	getSubCrimesName() {
		let vis = this;

		let thefts = []
		let mischifs = []
		let baes = []
		let vcs = []
		vis.crimes.forEach((e, i) => {
			if (e.includes('Theft')) {
				thefts.push(e)
			}
			if (e.includes('Mischief')) {
				mischifs.push(e)
			}
			if (e.includes('Break and Enter')) {
				baes.push(e)
			}
			if (e.includes('Vehicle Collision or Pedestrian Struck')) {
				vcs.push(e)
			}
		})

		vis.thefts = thefts;
		vis.mischifs = mischifs;
		vis.baes = baes;
		vis.vcs = vcs;
	}

	// count the amount of each sub crime
	getSubCrimesAmount() {
		let vis = this;

		// object of objects: for pie chart use
		let theft_Data_Obj = {}
		let mischief_Data_Obj = {}
		let bae_Data_Obj = {}
		let vc_Data_Obj = {}

		// array of objects: for inner donut chart use
		let theft_Data_Arr = []
		let mischief_Data_Arr = []
		let bae_Data_Arr = []
		let vc_Data_Arr = []

		// objects & arrays initialization
		vis.thefts.forEach(e => {
			let src = {};
			src[e] = 0;
			Object.assign(theft_Data_Obj, src);

			let arr_src = {}
			arr_src['value'] = 0;
			arr_src['label'] = e;
			theft_Data_Arr.push(arr_src);
		})

		vis.mischifs.forEach(e => {
			let src = {};
			src[e] = 0;
			Object.assign(mischief_Data_Obj, src);

			let arr_src = {}
			arr_src['value'] = 0;
			arr_src['label'] = e;
			mischief_Data_Arr.push(arr_src);
		})

		vis.baes.forEach(e => {
			let src = {};
			src[e] = 0;
			Object.assign(bae_Data_Obj, src);

			let arr_src = {}
			arr_src['value'] = 0;
			arr_src['label'] = e;
			bae_Data_Arr.push(arr_src);
		})

		vis.vcs.forEach(e => {
			let src = {};
			src[e] = 0;
			Object.assign(vc_Data_Obj, src);

			let arr_src = {}
			arr_src['value'] = 0;
			arr_src['label'] = e;
			vc_Data_Arr.push(arr_src);
		})

		// put data into objects and arrays
		vis.data.forEach((e, i) => {
			if (e.YEAR >= vis.config.yearRange[0] && e.YEAR <= vis.config.yearRange[1]) {
				if (e.TYPE.includes('Theft')) {
					let currVal = theft_Data_Obj[e.TYPE]
					theft_Data_Obj[e.TYPE] = currVal + 1

					theft_Data_Arr.forEach((ele, i) => {
						if (e.TYPE === ele.label) {
							let curr = ele.value;
							ele.value = curr + 1
						}
					})
				}
				if (e.TYPE.includes('Mischief')) {
					let currVal = mischief_Data_Obj[e.TYPE]
					mischief_Data_Obj[e.TYPE] = currVal + 1

					mischief_Data_Arr.forEach((ele, i) => {
						if (e.TYPE === ele.label) {
							let curr = ele.value;
							ele.value = curr + 1
						}
					})
				}
				if (e.TYPE.includes('Break and Enter')) {
					let currVal = bae_Data_Obj[e.TYPE]
					bae_Data_Obj[e.TYPE] = currVal + 1

					bae_Data_Arr.forEach((ele, i) => {
						if (e.TYPE === ele.label) {
							let curr = ele.value;
							ele.value = curr + 1
						}
					})
				}
				if (e.TYPE.includes('Vehicle Collision or Pedestrian Struck')) {
					let currVal = vc_Data_Obj[e.TYPE]
					vc_Data_Obj[e.TYPE] = currVal + 1

					vc_Data_Arr.forEach((ele, i) => {
						if (e.TYPE === ele.label) {
							let curr = ele.value;
							ele.value = curr + 1
						}
					})
				}
			}
		})

		vis.theft_data_Obj = theft_Data_Obj;
		vis.mischief_data_Obj = mischief_Data_Obj;
		vis.bae_data_Obj = bae_Data_Obj;
		vis.vc_data_Obj = vc_Data_Obj;

		theft_Data_Arr.forEach(e => {
			e.pct = e.value / vis.filteredCrime['Theft'];
		})

		mischief_Data_Arr.forEach(e => {
			e.pct = e.value / vis.filteredCrime['Mischief'];
		})

		bae_Data_Arr.forEach(e => {
			e.pct = e.value / vis.filteredCrime['Break and Enter'];
		})

		vc_Data_Arr.forEach(e => {
			e.pct = e.value / vis.filteredCrime['Vehicle Collision or Pedestrian Struck'];
		})

		// sort each crimes by value
		function compare(a, b) {
			if (a.pct > b.pct) {
				return -1;
			}
			if (a.pct < b.pct) {
				return 1;
			}
			return 0;
		}

		theft_Data_Arr.sort(compare);
		mischief_Data_Arr.sort(compare);
		bae_Data_Arr.sort(compare);
		vc_Data_Arr.sort(compare);

		vis.theft_data_Arr = theft_Data_Arr;
		vis.mischief_data_Arr = mischief_Data_Arr;
		vis.bae_data_Arr = bae_Data_Arr;
		vis.vc_data_Arr = vc_Data_Arr;

		let all_crimes_Arr = [];
		theft_Data_Arr.forEach(e => all_crimes_Arr.push(e))
		mischief_Data_Arr.forEach(e => all_crimes_Arr.push(e))
		bae_Data_Arr.forEach(e => all_crimes_Arr.push(e))
		vc_Data_Arr.forEach(e => all_crimes_Arr.push(e))

		// append index to each crime
		all_crimes_Arr.forEach((e, i) => {
			e['index'] = i;
		})
		vis.all_crimes_Arr = all_crimes_Arr;
	}

	updateDonutChartVis() {
		let vis = this;

		/* data for donut chart */
		let theft_amt = vis.filteredCrime['Theft']
		let mischief_amt = vis.filteredCrime['Mischief']
		let bae_amt = vis.filteredCrime['Break and Enter']
		let vc_amt = vis.filteredCrime['Vehicle Collision or Pedestrian Struck']
		let all_amt = [theft_amt, mischief_amt, bae_amt, vc_amt]

		vis.theft_amt = theft_amt
		vis.mischief_amt = mischief_amt
		vis.bae_amt = bae_amt
		vis.vc_amt = vc_amt
		vis.all_amt = all_amt

		vis.generalCrimes = Object.keys(vis.filteredCrime)

		let generalCrimes_obj = {}
		vis.generalCrimes.forEach((e, i) => {
			let src = {}
			src[e] = all_amt[i]
			Object.assign(generalCrimes_obj, src)
		})

		vis.generalCrimes = vis.generalCrimes.map(function (item) { return item.includes('Vehicle') ? 'COLL.' : item; });

		vis.donutchart.outerRadius = 280;
		vis.donutchart.innerRadius = 250;

		vis.donutchart.data_ready = vis.pie(Object.entries(generalCrimes_obj))
	}

	updateInnerDonutChartVis() {
		let vis = this;

		// prepare data for the inner donut chart
		let inner_arcs_innerRadius = 225;
		let inner_arcs_outerRadius = 245;

		// init angle map
		let crimeAngleMap = {};

		/* theft arcs */
		let inner_arcs_start_angle_theft = vis.donutchart.data_ready[0]['startAngle'];
		let inner_arcs_end_angle_theft = vis.donutchart.data_ready[0]['endAngle'];
		let theftArcAngle = inner_arcs_end_angle_theft - inner_arcs_start_angle_theft - 0.03;

		let currStartTheft = inner_arcs_start_angle_theft + 0.02;
		vis.theft_data_Arr.forEach((e) => {
			let angleArr = []
			let src = {}
			let start = currStartTheft;
			let end = currStartTheft + e.pct * theftArcAngle;
			angleArr.push(start);
			angleArr.push(end);
			src[e.label] = angleArr;
			Object.assign(crimeAngleMap, src);
			currStartTheft = end;
		})

		/* mischief arcs */
		let inner_arcs_start_angle_mischief = vis.donutchart.data_ready[1]['startAngle'];
		let inner_arcs_end_angle_mischief = vis.donutchart.data_ready[1]['endAngle'];
		let mischiefArcAngle = inner_arcs_end_angle_mischief - inner_arcs_start_angle_mischief - 0.03;

		let currStartMischief = inner_arcs_start_angle_mischief + 0.02;
		vis.mischief_data_Arr.forEach((e) => {
			let angleArr = []
			let src = {}
			let start = currStartMischief;
			let end = currStartMischief + e.pct * mischiefArcAngle;
			angleArr.push(start);
			angleArr.push(end);
			src[e.label] = angleArr;
			Object.assign(crimeAngleMap, src);
			currStartMischief = end;
		})

		/* bae arcs */
		let inner_arcs_start_angle_bae = vis.donutchart.data_ready[2]['startAngle'];
		let inner_arcs_end_angle_bae = vis.donutchart.data_ready[2]['endAngle'];
		let baefArcAngle = inner_arcs_end_angle_bae - inner_arcs_start_angle_bae - 0.03;

		let currStartBae = inner_arcs_start_angle_bae + 0.02;
		vis.bae_data_Arr.forEach((e) => {
			let angleArr = []
			let src = {}
			let start = currStartBae;
			let end = currStartBae + e.pct * baefArcAngle;
			angleArr.push(start);
			angleArr.push(end);
			src[e.label] = angleArr;
			Object.assign(crimeAngleMap, src);
			currStartBae = end;
		})

		/* vc arcs */
		let inner_arcs_start_angle_vc = vis.donutchart.data_ready[3]['startAngle'];
		let inner_arcs_end_angle_vc = vis.donutchart.data_ready[3]['endAngle'];
		let vcfArcAngle = inner_arcs_end_angle_vc - inner_arcs_start_angle_vc - 0.03;

		let currStartVC = inner_arcs_start_angle_vc + 0.02;
		vis.vc_data_Arr.forEach((e) => {
			let angleArr = []
			let src = {}
			let start = currStartVC;
			let end = currStartVC + e.pct * vcfArcAngle;
			angleArr.push(start);
			angleArr.push(end);
			src[e.label] = angleArr;
			Object.assign(crimeAngleMap, src);
			currStartVC = end;
		})

		vis.arcGenerator = d3.arc()
			.innerRadius(inner_arcs_innerRadius)
			.outerRadius(inner_arcs_outerRadius)
			.startAngle((d) => crimeAngleMap[d.label][0])
			.endAngle((d) => crimeAngleMap[d.label][1])
			.cornerRadius(1)
	}

	updatePieChartVis() {
		let vis = this;

		vis.pieRadius = 30;

		vis.theftPie_Data_ready = vis.pie(Object.entries(vis.theft_data_Obj))
		vis.mischiefPie_Data_ready = vis.pie(Object.entries(vis.mischief_data_Obj))
		vis.baePie_Data_ready = vis.pie(Object.entries(vis.bae_data_Obj))
		vis.vcPie_Data_ready = vis.pie(Object.entries(vis.vc_data_Obj))
	}

	/**
	 * Bind data to visual elements, update axes
	 */
	renderVis() {
		let vis = this;

		/* update views when switching between d&n */
		vis.arcs !== null ? vis.arcs.remove() : null
		vis.crimeText !== null ? vis.crimeText.remove() : null
		vis.tPie !== null ? vis.tPie.remove() : null
		vis.mPie !== null ? vis.mPie.remove() : null
		vis.bPie !== null ? vis.bPie.remove() : null
		vis.vPie !== null ? vis.vPie.remove() : null
		d3.selectAll('.subcrime').remove()

		this.renderDonutChartVis();
		this.renderPieChartVis();

	}

	renderDonutChartVis() {
		let vis = this;
		/* draw donut chart */
		vis.arcs = vis.donutchart
			.selectAll("crime")
			.data(vis.donutchart.data_ready)
			.join("path")
			.attr("class", "crime")
			.classed("selected", (d) => {
				if (vis.currCrimeName === d.data[0]) {
					return true;
				}
				return false;
			})
			.classed("night", vis.config.nightMode)
			.attr("id", (d) => {
				if (d.data[0].includes("Theft")) {
					return "crime-theft";
				}
				if (d.data[0].includes("Mischief")) {
					return "crime-mischief";
				}
				if (d.data[0].includes("Break and Enter")) {
					return "crime-bae";
				}
				if (d.data[0].includes("Vehicle Collision or Pedestrian Struck")) {
					return "crime-vc";
				}
			})
			.attr(
				"d",
				d3
					.arc()
					.innerRadius(vis.donutchart.innerRadius)
					.outerRadius(vis.donutchart.outerRadius)
			)
			.attr("fill", (d) => vis.generalColorMap[d.data[0]])
			.on("click", (event, d) => {
				let id = event.currentTarget.id;
				let name = d.data[0];
				this.selectCrime(id, name);
			});

		// draw the label of the general crime type
		vis.crimeText = vis.arcs.select(".crimeText")
			.data(vis.generalCrimes)
			.join("text")
			.attr("class", "crimeText")
			.attr("font-size", "11px")
			.attr("fill", () => vis.config.nightMode ? 'white' : 'black')
			.attr("x", 0)
			.attr("dy", -10)
			.append("textPath")
			.attr("href", (d) => {
				if (d.includes('Theft')) {
					return "#crime-theft";
				}
				if (d.includes('Mischief')) {
					return "#crime-mischief";
				}
				if (d.includes('Break and Enter')) {
					return "#crime-bae";
				}
				if (d.includes('COLL.')) {
					return "#crime-vc";
				}
			})
			.text(d => d);

		// draw the inner donut chart
		vis.inner_arcs_theft = vis.arcs
			.select(".subcrime")
			.data(vis.all_crimes_Arr)
			.join("path")
			.attr("class", "subcrime")
			.classed("selected", (d) => {
				if (vis.currCrimeName === d.label) {
					return true;
				}
			})
			.classed("night", vis.config.nightMode)
			.attr("id", (d) => {
				let idx = (+vis.indexMap[d.label])
				let id = "crime-" + idx
				return id
			}
			)
			.attr('d', vis.arcGenerator)
			.attr("fill", (d) => vis.colorMap[d.label])
			.on("click", (event, data) => {
				let id = event.currentTarget.id
				let name = data.label;
				this.selectCrime(id, name);
			})
			.on('mousemove', (event, d) => {
				let gnrlType;
				if (d.label.includes("Theft")) {
					gnrlType = "Theft";
				}
				else if (d.label.includes("Mischief")) {
					gnrlType = "Mischief";
				}
				else if (d.label.includes("Break and Enter")) {
					gnrlType = "Break and Enter";
				}
				else if (d.label.includes("Vehicle Collision")) {
					gnrlType = "COLL.";
				}
				let subCrimeName = d.label
				let numOfCases = d.value
				let pct = d3.format('.3')(d.pct * 100)
				this.showTooltip(event, subCrimeName, numOfCases, gnrlType, pct)
			})
			.on('mouseleave', () => {
				d3.select('#subcrime-tooltip').style('display', 'none');
			})
	}

	renderPieChartVis() {
		let vis = this;

		/* draw pie charts */
		vis.tPie = vis.theft_Pie_svg
			.selectAll('crimePie')
			.data(vis.theftPie_Data_ready)
			.join('path')
			.attr("class", "crimePie")
			.classed("selected", (d) => {
				if (vis.currCrimeName === d.data[0]) {
					return true;
				}
			})
			.classed("night", vis.config.nightMode)
			.attr("id", (d) => {
				let idx = (+vis.indexMap[d.data[0]])
				let id = "crime-" + idx
				return id
			})
			.attr('d', d3.arc()
				.innerRadius(0)
				.outerRadius(vis.pieRadius)
			)
			.attr('fill', (d) => vis.colorMap[d.data[0]])
			.on('mousemove', (event, d) => {
				let gnrlType = 'Theft'
				let subCrimeName = d.data[0]
				let numOfCases = d.data[1]
				let pct = d3.format('.3')(d.data[1] * 100 / vis.theft_amt)
				this.showTooltip(event, subCrimeName, numOfCases, gnrlType, pct)
			})
			.on('mouseleave', () => {
				d3.select('#subcrime-tooltip').style('display', 'none');
			})
			.on("click", (event, d) => {
				let id = event.currentTarget.id;
				let name = d.data[0];
				this.selectCrime(id, name);
				this.typerEffect(0, name, id);
			})

		vis.mPie = vis.mischief_Pie_svg
			.selectAll('crimePie')
			.data(vis.mischiefPie_Data_ready)
			.join('path')
			.attr("class", "crimePie")
			.classed("selected", (d) => {
				if (vis.currCrimeName === d.data[0]) {
					return true;
				}
			})
			.classed("night", vis.config.nightMode)
			.attr("id", (d) => {
				return "crime-" + (vis.indexMap[d.data[0]])
			})
			.attr('d', d3.arc()
				.innerRadius(0)
				.outerRadius(vis.pieRadius)
			)
			.attr('fill', (d) => vis.colorMap[d.data[0]])
			.on('mousemove', (event, d) => {
				let gnrlType = 'Mischief'
				let subCrimeName = d.data[0]
				let numOfCases = d.data[1]
				let pct = d3.format('.3')(d.data[1] * 100 / vis.mischief_amt)
				this.showTooltip(event, subCrimeName, numOfCases, gnrlType, pct)
			})
			.on('mouseleave', () => {
				d3.select('#subcrime-tooltip').style('display', 'none');
			})
			.on("click", (event, d) => {
				let id = event.currentTarget.id;
				let name = d.data[0];
				this.selectCrime(id, name);
				this.typerEffect(0, name, id);
			})

		vis.bPie = vis.bae_Pie_svg
			.selectAll('crimePie')
			.data(vis.baePie_Data_ready)
			.join('path')
			.attr("class", "crimePie")
			.classed("selected", (d) => {
				if (vis.currCrimeName === d.data[0]) {
					return true;
				}
			})
			.classed("night", vis.config.nightMode)
			.attr("id", (d) => {
				return "crime-" + (vis.indexMap[d.data[0]])
			})
			.attr('d', d3.arc()
				.innerRadius(0)
				.outerRadius(vis.pieRadius)
			)
			.attr('fill', (d) => vis.colorMap[d.data[0]])
			.on('mousemove', (event, d) => {
				let gnrlType = 'Break and Enter'
				let subCrimeName = d.data[0]
				let numOfCases = d.data[1]
				let pct = d3.format('.3')(d.data[1] * 100 / vis.bae_amt)
				this.showTooltip(event, subCrimeName, numOfCases, gnrlType, pct)
			})
			.on('mouseleave', () => {
				d3.select('#subcrime-tooltip').style('display', 'none');
			})
			.on("click", (event, d) => {
				let id = event.currentTarget.id;
				let name = d.data[0];
				this.selectCrime(id, name);
				this.typerEffect(0, name, id);
			})

		vis.vPie = vis.vc_Pie_svg
			.selectAll('crimePie')
			.data(vis.vcPie_Data_ready)
			.join('path')
			.attr("class", "crimePie")
			.classed("selected", (d) => {
				if (vis.currCrimeName === d.data[0]) {
					return true;
				}
			})
			.classed("night", vis.config.nightMode)
			.attr("id", (d) => {
				return "crime-" + (vis.indexMap[d.data[0]])
			})
			.attr('d', d3.arc()
				.innerRadius(0)
				.outerRadius(vis.pieRadius)
			)
			.attr('fill', (d) => vis.colorMap[d.data[0]])
			.on('mousemove', (event, d) => {
				let gnrlType = 'COLL.'
				let subCrimeName = d.data[0]
				let numOfCases = d.data[1]
				let pct = d3.format('.3')(d.data[1] * 100 / vis.vc_amt)
				this.showTooltip(event, subCrimeName, numOfCases, gnrlType, pct)
			})
			.on('mouseleave', () => {
				d3.select('#subcrime-tooltip').style('display', 'none');
			})
			.on("click", (event, d) => {
				let id = event.currentTarget.id;
				let name = d.data[0];
				this.selectCrime(id, name);
				this.typerEffect(0, name, id);
			})
		
		// fill in color based on nightMode
		vis.theft_Pie_title.attr('fill', vis.config.nightMode ? 'white' : 'black');
		vis.mischief_Pie_title.attr('fill', vis.config.nightMode ? 'white' : 'black');
		vis.bae_Pie_title.attr('fill', vis.config.nightMode ? 'white' : 'black');
		vis.vc_Pie_title.attr('fill', vis.config.nightMode ? 'white' : 'black');
	}

	/**
	 * helper function: select crime and pass off
	 */
	selectCrime(id, name) {
		let vis = this

		let isSelected =
			d3.select('#' + id).classed('selected')

		// deselect all the selected crime
		d3.selectAll('.crime.selected').classed('selected', false)
		d3.selectAll('.crimePie.selected').classed('selected', false)
		d3.selectAll('.subcrime.selected').classed('selected', false)

		// reverse the selection for current target
		d3.selectAll('#' + id).classed('selected', !isSelected)

		// pass off crime type based on the status of current target
		if (!isSelected) {
			let crimeType = name
			vis.currCrimeName = crimeType
			vis.dispatcher.call('getCrime', null, crimeType);
		}
		else {
			vis.currCrimeName = null
			vis.dispatcher.call('getCrime', null, "");
		}
	}

	/**
	 * helper function: subcrime tooltip
	 */
	showTooltip(event, subCrimeName, numOfCases, gnrlType, pct) {
		let vis = this
		d3.select('#subcrime-tooltip')
			.style('display', 'block')
			.style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
			.style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
			.html(`
			<div class="tooltip-title">Crime: ${subCrimeName}</div>
			<text>Cases: ${numOfCases}</text>
			<br>
			<text>Pct. of ${gnrlType}: ${pct} %</text>
		`);
	}
	/**
	 * helper function: typer effect
	 */
	typerEffect(i, text, eleID) {
		let vis = this;

		// if any pie chart title is not empty, clear it first
		if (vis.theft_Pie_title.text() != "" ) {
			vis.theft_Pie_title.text("");
		}
		if (vis.mischief_Pie_title.text() != "" ) {
			vis.mischief_Pie_title.text("");
		}
		if (vis.bae_Pie_title.text() != "" ) {
			vis.bae_Pie_title.text("");
		}
		if (vis.vc_Pie_title.text() != "" ) {
			vis.vc_Pie_title.text("");
		}

		// select current pie chart
		let currElement;
		if (text.includes("Theft")) {
			currElement = vis.theft_Pie_title;
		}
		else if (text.includes("Mischief")) {
			currElement = vis.mischief_Pie_title;
		}
		else if (text.includes("Break and Enter")) {
			currElement = vis.bae_Pie_title;
		}
		else if (text.includes("Vehicle Collision")) {
			currElement = vis.vc_Pie_title;
		}

		// define the style of current title
		currElement
			.style('display', 'block')
			.attr('font-size', '11px')
			.attr('display', 'inline')
		
		// show the title based on the element's selection
		let isSelected = d3.select('#' + eleID).classed('selected')
		
		if (isSelected) {
			if (text.length <= 20) {
				this.simpleTyper(currElement, i, [text]);
			}
			else {
				let part1 = text.slice(0, 20);
				let part2 = text.slice(20);
				this.complexTyper(currElement, i, part1, part2);
			}
		}
		else {
			currElement.style('display', 'none');
		}
	}

	// helper function to typerEffection, do the actual animation
	simpleTyper(element, i, text) {
		element	
			.transition()
			.style("visibility", "visible")
			.duration(1000 * text.length)
			.tween("text", function () {
				let newText = text[i];
				let textLength = newText.length;
				return function (t) {
					if (t < 1) {
						this.textContent = newText.slice(0, Math.round(t * textLength)) + "|";
					} 
					else {
						this.textContent = newText;
					}	
				};
			});
		i = (i + 1) % text.length;	
	}
	
	// handle the case when the name is too long
	complexTyper(element, i, text1, text2) {
		let textPart1 = element
			.append("tspan")
			.attr("x", 0)
			.attr("dy", "0em")
			.text(text1)
		let textPart2 = element
			.append("tspan")
			.attr("x", 0)
			.attr("dy", "1em")
			.text(text2)
			.style("visibility", "hidden")
		this.simpleTyper(textPart1, i, [text1]);

		d3.timeout( () => {
			this.simpleTyper(textPart2, i, [text2]);
		}, 1000 * [text1].length)
	}
}