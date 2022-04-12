// global variables
let data;
let allCrimes = [];
let selectedNeibourhoods = [];
let compositeMap,
  barChart,
  lineChart,
  choroplethMap,
  choroplethLegend,
  barChartGeneral;

const generalColorMap = {
  "Theft": "#6FA090",
  "Mischief": "#b15bd9",
  "Break and Enter": "#e86f6f",
  "Vehicle Collision or Pedestrian Struck": "#d70085",
};

const colorMap = {
  "Theft from Vehicle": "#6783a9",
  "Theft of Bicycle": "#d9270f",
  "Theft of Vehicle": "#ff988c",
  "Other Theft": "#5fa8d3",
  "Mischief": "#b15bd9",
  "Break and Enter Commercial": "#6844db",
  "Break and Enter Residential/Other": "#e69138",
  "Vehicle Collision or Pedestrian Struck (with Fatality)": "#8b7d9f",
  "Vehicle Collision or Pedestrian Struck (with Injury)": "#0f7185",
};

const indexMap = {
  "Theft from Vehicle": 0,
  "Theft of Bicycle": 1,
  "Theft of Vehicle": 2,
  "Other Theft": 3,
  "Mischief": 4,
  "Break and Enter Residential/Other": 5,
  "Break and Enter Commercial": 6,
  "Vehicle Collision or Pedestrian Struck (with Injury)": 7,
  "Vehicle Collision or Pedestrian Struck (with Fatality)": 8,
};

let data_day = [];
let data_night = [];
let data_used = data_day;
let filteredCrime = {
  "Theft": 0,
  "Mischief": 0,
  "Break and Enter": 0,
  "Vehicle Collision or Pedestrian Struck": 0,
};
let isSliderMoved = false;
let isToggleMoved = false;
let default_minYear = -1;
let default_maxYear = -1;

// configure day and night effect
let singleElement = [
  "body",
  "h1",
  "#intro",
  "#year-bar",
  "#legend",
  "p#value-range",
  "#slider-range",
  "#crime-title",
  ".linechart-title",
  "#intro_text",
  ".x-axis-label",
  ".y-axis-label",
  ".legend-title",
];
let multiElements = [
  ".crime",
  "text",
  "tick",
  ".bar",
  ".percentage",
  ".legend-label",
  ".barchart-title",
];

// initialize dispatcher that is used to orchestrate events
const dispatcher = d3.dispatch(
  "getYear",
  "getCrime",
  "filterByNeibourhood",
  "updateChoroplethLegend"
);

/**
 * Load GeoJSON data of the Vancouver area and the data of the crimes within each neibourhood
 * Load data from CSV file asynchronously and render charts
 */
Promise.all([
  d3.json("data/vancouver.json"),
  d3.csv("data/crime_2017_2021.csv"),
])
  .then((_data) => {
    data = _data;
    const geoData = data[0];
    const neibourhoodData = data[1];

    // Add the total # crime of each neibourhood to the JSON file
    geoData.features.forEach((d) => {
      for (let i = 0; i < neibourhoodData.length; i++) {
        if (d.properties.NAME == neibourhoodData[i].NEIGHBOURHOOD) {
          d.properties.NumPerNeighbourhood_all_yrs =
            +neibourhoodData[i].NumPerNeighbourhood_all_yrs;
          d.properties[2017] = +neibourhoodData[i].NumPerNeighbourhood_2017;
          d.properties[2018] = +neibourhoodData[i].NumPerNeighbourhood_2018;
          d.properties[2019] = +neibourhoodData[i].NumPerNeighbourhood_2019;
          d.properties[2020] = +neibourhoodData[i].NumPerNeighbourhood_2020;
          d.properties[2021] = +neibourhoodData[i].NumPerNeighbourhood_2021;
        }
      }
    });

    neibourhoodData.forEach((d) => {
      Object.keys(d).forEach((attr) => {
        d.DATE =
          d.YEAR +
          "-" +
          ("0" + d.MONTH).slice(-2) +
          "-" +
          ("0" + d.DAY).slice(-2);
        if (
          attr == "CASE_ID" ||
          attr == "YEAR" ||
          attr == "MONTH" ||
          attr == "DAY" ||
          attr == "HOUR" ||
          attr == "lat" ||
          attr == "long" ||
          attr == "NumPerNeighbourhood_all_yrs" ||
          attr == "NumPerNeighbourhood_2017" ||
          attr == "NumPerNeighbourhood_2018" ||
          attr == "NumPerNeighbourhood_2019" ||
          attr == "NumPerNeighbourhood_2020" ||
          attr == "NumPerNeighbourhood_2021"
        ) {
          d[attr] = +d[attr];
        }
      }
      );

      // filtered the data by daytime and nighttime
      if (d.TIME === "day") {
        data_day.push(d);
      } else if (d.TIME === "night") {
        data_night.push(d);
      }

      // collect unique value of crime types
      if (!allCrimes.includes(d.TYPE)) {
        allCrimes.push(d.TYPE);
      }
    });

    /* handle data */
    // extract min and max year
    default_minYear = d3.min(neibourhoodData.map((d) => d.YEAR));
    default_maxYear = d3.max(neibourhoodData.map((d) => d.YEAR));

    filterCrimes(data_used);

    // show the legend
    this.showLegend();

    choroplethLegend = new MapLegend(
      {
        parentElement: "#compositeMap",
      },
      colorMap,
      generalColorMap,
      indexMap
    );

    choroplethMap = new ChoroplethMap(
      {
        parentElement: "#compositeMap",
      },
      geoData,
      data_used,
      dispatcher,
      colorMap,
      generalColorMap,
      indexMap
    );

    compositeMap = new CompositeMap(
      {
        parentElement: "#compositeMap",
      },
      dispatcher,
      allCrimes,
      data_used,
      colorMap,
      filteredCrime,
      generalColorMap,
      indexMap
    );

    barChart = new Barchart(
      {
        parentElement: "#barchart-detail",
      },
      data_used,
      colorMap,
      indexMap,
      generalColorMap,
      true
    );

    barChartGeneral = new Barchart(
      {
        parentElement: "#barchart-general",
      },
      data_used,
      colorMap,
      indexMap,
      generalColorMap,
      false
    );

    lineChart = new Linechart(
      {
        parentElement: "#linechart",
      },
      data_used,
      colorMap,
      indexMap,
      generalColorMap
    );
  })
  .catch((error) => console.error(error));

function showLegend() {
  let dayNightSpan = `<span class="toggleWrapper"> 
        <input type="checkbox" class="dn" id="dn"/> 
        <label for="dn" class="toggle"> 
        <span class="toggle__handler"> 
          <span class="crater crater--1"></span> 
          <span class="crater crater--2"></span>
          <span class="crater crater--3"></span>
        </span>
        </label>
      </span>
      <script>
        $("#dn").prop("checked", isToggleMoved);
      </script>
    `;

  let yearBarText = `<p id="year-bar"> 
    Adjust the slider <span id="slider-range"></span>,<br>you are currently looking at the data
    <p id="value-range"></p>.
  </p>
  <script> 
    if (!isSliderMoved) {
      d3.select("#value-range").text("from " + default_minYear + " - " + default_maxYear);
    }

    if (isToggleMoved) {
      d3.select("#year-bar").classed("night", true)
    }

    this.sliderRange = d3
      .sliderBottom()
      .min(default_minYear)
      .max(default_maxYear)
      .tickFormat(d3.format("d"))
      .ticks(default_maxYear - default_minYear)
      .step(1)
      .default([default_minYear, default_maxYear])
      .fill("#8a89a6")
      .on("onchange", (val) => {
        // 1. update default_minYear and default_maxYear
        this.updateYearBar(val)

        // 2. reset filteredCrime and filter the general ones by year
        filteredCrime = {
          'Theft': 0,
          'Mischief': 0,
          'Break and Enter': 0,
          'Vehicle Collision or Pedestrian Struck': 0
        };
        this.filterCrimes(data_used);
        compositeMap.filteredCrime = filteredCrime;
        compositeMap.updateVis();
      })

    d3.select("span#slider-range")
      .append("svg")
      .attr('width', 150)
      .attr('height', 45)
      .append("g")
      .attr("transform", "translate(20, 10)")
      .call(this.sliderRange);
  </script>
  `;

  let text =
    "<p>Crime in Vancouver helps you to identify composition of crime in different neighbourhoods in Vancouver.</p>" +
    "<p>Currently you are seeing the cases happened in" + dayNightSpan + "</p>" +
    yearBarText +
    `<p id="nei_text">You can select <b>3</b> neighbourhoods at most.<br><br> Select a neighborhood in the map to see the details.</p>` +
    `<p>Zoom in the choropleth map to see the crime distribution.</p>` + 
    `<p id="crime_text">Select a crime type in the donut chart or pie chart to see the details.</p>`;

  $("#intro_text").html(`${text}`);

  $("#dn").bind("click", (event) => {
    this.updateDayNightEffect(event);
  });
}

function updateYearBar(value) {
  isSliderMoved = true;
  default_minYear = value["0"];
  default_maxYear = value["1"];
  let years = [];
  if (default_minYear === default_maxYear) {
    years = [default_minYear];
    // change the year range label
    d3.select("#value-range").text("in " + d3.format("d")(default_minYear));

    // change the first text label to be invisible
    d3.select("g.parameter-value").select("text").attr("visibility", "hidden");

    // change the second text label's position
    d3.selectAll("g.parameter-value")._groups[
      "0"
    ][1].childNodes[1].style.transform = "translate(0,0)";
  } else {
    years = [default_minYear, default_maxYear];
    d3.select("#value-range").text(
      "from " + value.map(d3.format("d")).join(" - ")
    );
    d3.select("g.parameter-value").select("text").attr("visibility", "");
  }

  dispatcher.call("getYear", null, years);
}

function updateDayNightEffect(event) {
  let checked = event.currentTarget.checked;
  if (checked) {
    data_used = data_night;
    isToggleMoved = true;
  } else {
    data_used = data_day;
    isToggleMoved = false;
  }

  /* linechart */
  lineChart.data = data_used;
  lineChart.config.nightMode = checked;
  lineChart.updateVis();

  /* barchart */
  barChart.data = data_used;
  barChartGeneral.data = data_used;
  barChart.config.nightMode = checked;
  barChart.updateVis();
  barChartGeneral.config.nightMode = checked;
  barChartGeneral.updateGeneralVis();

  /* choropleth */
  choroplethMap.neiData = data_used;
  choroplethMap.config.nightMode = checked;
  choroplethMap.updateVis();

  choroplethLegend.config.nightMode = checked;
  choroplethLegend.updateVis();

  /* composite map*/
  compositeMap.data = data_used;
  compositeMap.config.nightMode = checked;
  filteredCrime = {
    "Theft": 0,
    "Mischief": 0,
    "Break and Enter": 0,
    "Vehicle Collision or Pedestrian Struck": 0,
  };
  filterCrimes(data_used);

  compositeMap.filteredCrime = filteredCrime;
  compositeMap.updateVis();

  singleElement.forEach((element) =>
    d3.select(element).classed("night", checked)
  );
  multiElements.forEach((element) =>
    d3.selectAll(element).classed("night", checked)
  );
}

/* dispatchers */
dispatcher.on("getYear", (yearRange) => {
  if (yearRange !== undefined) {
    compositeMap.config.yearRange = yearRange;
    lineChart.config.yearRange = yearRange;
    barChart.config.yearRange = yearRange;
    choroplethMap.config.yearRange = yearRange;
  }
  compositeMap.updateVis();
  lineChart.updateVis();
  barChart.updateVis();
  choroplethMap.updateVis();
});

dispatcher.on("getCrime", (crime) => {
  let updatedCrimeText;
  if (crime !== "" && crime !== undefined) {
    lineChart.config.crime = crime;
    barChart.config.crime = crime;
    barChartGeneral.config.crime = crime;
    choroplethMap.config.crime = crime;
    choroplethLegend.config.crime = crime;

    updatedCrimeText = "The crime you are selecting is <b>" + crime + "</b>.";
  } else {
    let emptyCrime = "";
    lineChart.config.crime = null;
    barChart.config.crime = emptyCrime;
    barChartGeneral.config.crime = emptyCrime;
    choroplethMap.config.crime = null;
    choroplethLegend.config.crime = emptyCrime;
    updatedCrimeText =
      "You can select a crime type in the donut chart or pie chart to see the details.";
  }
  lineChart.updateVis();
  barChart.updateVis();
  barChartGeneral.updateGeneralVis();
  choroplethMap.updateVis();
  choroplethLegend.updateVis();

  $("#crime_text").html(updatedCrimeText);
});

dispatcher.on("updateChoroplethLegend", (range) => {
  let crimeColorScale = range[0];
  let crimeNumberExtent = range[1];
  choroplethLegend.config.crimeColorScale = crimeColorScale;
  choroplethLegend.config.crimeNumberExtent = crimeNumberExtent;
  choroplethLegend.updateVis();
});

dispatcher.on("filterByNeibourhood", (selections) => {
  let aNeibourhood = selections;
  if (!selectedNeibourhoods.includes(aNeibourhood))
    selectedNeibourhoods.push(aNeibourhood);
  else {
    const index = selectedNeibourhoods.indexOf(aNeibourhood);
    if (index > -1) selectedNeibourhoods.splice(index, 1);
  }
  choroplethMap.config.neibourhood = selectedNeibourhoods;
  barChart.config.neibourhood =
    selectedNeibourhoods.length > 0
      ? selectedNeibourhoods[selectedNeibourhoods.length - 1]
      : null;
  barChartGeneral.config.neibourhood =
    selectedNeibourhoods.length > 0
      ? selectedNeibourhoods[selectedNeibourhoods.length - 1]
      : null;
  // donutChart.config.neibourhoods = selectedNeibourhoods
  lineChart.config.neibourhood =
    selectedNeibourhoods.length > 0 ? selectedNeibourhoods : null;

  choroplethMap.updateVis();
  barChart.updateVis();
  barChartGeneral.updateGeneralVis();
  lineChart.updateVis();
  // donutChart.updateVis();

  let updatedNeiborText;
  if (selectedNeibourhoods.length !== 0) {
    updatedNeiborText =
      `The neighbourhoods you are selecting are <br><br> <b>` +
      selectedNeibourhoods +
      `</b>.
    You can select <b>` +
      (3 - selectedNeibourhoods.length) +
      `</b> more.`;
  } else {
    updatedNeiborText = `You can select <b>3</b> neighbourhoods at most.<br><br>
    Select a neighborhood in the map to see the details.`;
  }
  $("#nei_text").html(updatedNeiborText);
});

// get general crime types and construct filteredCrime
function filterCrimes(data) {
  // 1. filter crimes by year
  data.forEach((d) => {
    if (d.YEAR >= default_minYear && d.YEAR <= default_maxYear) {
      // 2. filter crimes into 4 general types
      if (d.TYPE.includes("Theft")) {
        let currVal = filteredCrime["Theft"];
        filteredCrime["Theft"] = currVal + 1;
      }
      if (d.TYPE.includes("Mischief")) {
        let currVal = filteredCrime["Mischief"];
        filteredCrime["Mischief"] = currVal + 1;
      }
      if (d.TYPE.includes("Break and Enter")) {
        let currVal = filteredCrime["Break and Enter"];
        filteredCrime["Break and Enter"] = currVal + 1;
      }
      if (d.TYPE.includes("Vehicle Collision or Pedestrian Struck")) {
        let currVal = filteredCrime["Vehicle Collision or Pedestrian Struck"];
        filteredCrime["Vehicle Collision or Pedestrian Struck"] = currVal + 1;
      }
    }
  });
}
