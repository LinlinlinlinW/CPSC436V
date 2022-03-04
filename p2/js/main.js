// global variables
let barChart, scatterPlot, lexisChart;
let ddata;
let currGender;
let selectedLeader = [];

// Initialize dispatcher that is used to orchestrate events
const dispatcher = d3.dispatch('filterGender', 'filterLeader');

/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/leaderlist.csv').then(data => {
	ddata = data;
	// Convert columns to numerical values
	ddata.forEach(d => {
	Object.keys(d).forEach(attr => {
		if (attr == 'pcgdp') {
			d[attr] = (d[attr] == 'NA') ? null : +d[attr];
		} else if (attr != 'country' && attr != 'leader' && attr != 'gender') {
			d[attr] = +d[attr];
		}
	});
});

ddata.sort((a,b) => a.label - b.label);

lexisChart = new LexisChart({
	parentElement: '#lexis-chart',
	}, dispatcher, ddata, currGender, selectedLeader)
lexisChart.updateVis();

barChart = new Barchart({
	parentElement: '#bar-chart',
	}, dispatcher, ddata);
barChart.updateVis();

scatterPlot = new Scatterplot({
	parentElement: '#scatter-plot',
	}, dispatcher, ddata, currGender, selectedLeader);
scatterPlot.updateVis(); 

});

/*
* Todo:
* - initialize views
* - filter data
* - listen to events and update views
*/

/**
 * Event listener: get country for barChart
 */
d3.select('#country-selector').on('change', function() {
	let currRegion = d3.select(this).property('value')

	barChart.config.region = currRegion
	barChart.updateVis();

	scatterPlot.config.region = currRegion
	scatterPlot.updateVis();

	lexisChart.config.region = currRegion
	lexisChart.updateVis();
});

// first function in dispatcher
dispatcher.on('filterGender', selectedGender => {
if (selectedGender.length === 0) {
	scatterPlot.data = ddata;
	scatterPlot.currGender = undefined;

	lexisChart.data = ddata;
	lexisChart.currGender = undefined;
} 
else {
	currGender = selectedGender[0];
	scatterPlot.currGender = currGender;
	lexisChart.currGender = currGender;
}
	scatterPlot.updateVis();
	lexisChart.updateVis();
});

// second function in dispatcher
dispatcher.on('filterLeader', selectedLeader => {
	if (selectedLeader !== undefined) {
		lexisChart.selectedLeader = selectedLeader;
		scatterPlot.selectedLeader = selectedLeader
	}
	lexisChart.updateVis();
	scatterPlot.updateVis();
})