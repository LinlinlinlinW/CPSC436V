# Crime in Vancouver 
last updated on April 10, 2022

## Team members
Michaux Sun: [linkedin](https://www.linkedin.com/in/michaux-sun-1028/) ☀ 
Kerry Zhou: [linkedin](https://www.linkedin.com/in/hongkaiyuezhou/) ☀ 
Bolin Wang: [linkedin](https://www.linkedin.com/in/bolinwang227/)\
feel free to contact us 😀

## Overview
![overview](https://github.com/LinlinlinlinW/CPSC436V/blob/main/final_project/overview.png?raw=true "Title")

Safety is one of the most important factors to consider when moving into a new place. If we can understand the composition of crime in different areas, it is possible to respond to crime in a more targeted manner, thus enhancing security. To achieve this, we propose building a data visualisation that visually allows relevant government officials (i.e., police) and ordinary people to explore crime datasets. Our app will show the overall distribution of crime in Vancouver and enable users to analyse and compare the trend among several neighbourhoods by filtering the crime type, year, and neighbourhood, as well as daytime and nighttime.

## Goals and Tasks
- **Discover overview**\
A police officer wants to discover overall crimes across neighborhoods in all years ( ordered attribute [YEAR: 2017, 2021]) to write a report of the security situation in Vancouver.
- **Lookup values**\
A police officer also wants to lookup the severe level (quantitative attribute [NumPerNeighbourhood_all_yrs: 147, 67975]) of a specific crime type (categorical attribute [TYPE: 9]) across all neighborhoods to make detailed analysis in the report.
- **Discover trend**\
A journalist wants to discover the trend of each crime type across certain year ranges (ordered attribute [YEAR: 2017, 2021]).
- **Discover distribution**\
Since there are 9 crime types (categorical attribute [TYPE: 9]), which counts for 4 general crime types (categorical attribute [GENERAL_TYPE: 4]) in total, the journalist also wants to discover the distribution of each subcrime types within the corresponding general crime type.
The new immigrant drives a luxury car. Therefor, they would like to discover crime distribution (geographcal data of quantitative[ lat: 49.201201, 49.313349] and [long: -123.224021, -123.023393]) within a specific neighborhood (categorical attribute [NEIGHBOURHOOD: 24]) especially whether there is a parking lot nearby. If a clear pattern can be seen, it will also be great because they have two kids so the detailed crime case distribution on a playground will be useful.
- **Compare groups**\
A new immigrant has several neighborhoods in mind that wants to live in. They want to compare the total number of crimes (quantitative attribute [NumPerNeighbourhood_all_yrs: 147, 67975]) within these neighborhoods (categorical attribute [NEIGHBOURHOOD: 24]) to help them make the final decision. 

## Dataset  
- Link:\
[link for source from 2015 - 2020](https://www.kaggle.com/emilyb123/vancouver-crime-data?select=crimedata_csv_all_years.csv) + [link for source in 2021](https://geodash.vpd.ca/opendata/) -> [final dataset link](https://docs.google.com/spreadsheets/d/1gRalBJugEXgEvUBeWQzdq2xlqZJdkjveN2PEOOEKF8E/edit?usp=sharing)

- Description:\
We will be visualising a dataset of `163178` crimes. Each crime has `10` native attributes that include information about the `crime id(CASE_ID)`, `crime types (TYPE)`, the specific date and time the crime occurred `(YEAR, MONTH, DAY, HOUR, TIME)`, name of the `neighbourhood (NEIGHBOURHOOD)` and their `latitude (lat)` and `longitude (long)`. We also have transformed attributes, a derived attribute and aggregated attributes. The details are in the below, highlighted by **[Aggregation]** and **[derived]**.

|  Attr |  Type | Cardinality  |  Range |
|---|---|---|---|
| CASE_ID | categorical | 163178  |   |
| TYPE | categorical  | 9   |   |
| GENERAL_TYPE | categorical | 4  |   |
| YEAR  | ordered |  |  [2017, 2021] |
| MONTH | ordered  |  | [1, 12] |
| DAY | ordered  |  | [1, 31] |
| HOUR | ordered  |  | [0, 23] |
| TIME | categorical | 2 |  |
| NEIGHBOURHOOD | categorical  | 24 |  |
| Latitude | quantitative  |  | [49.201201, 49.313349]|
| Longitude | quantitative  |  |  [-123.224021, -123.023393] |
| NumPerNeighbourhood_all_yrs | quantitative  |  | [84, 48725]  |
| NumPerNeighbourhood_2017 | quantitative  |  |  [16, 9962] |
| NumPerNeighbourhood_2018 | quantitative  |  |  [17, 10852] |
| NumPerNeighbourhood_2019 | quantitative  |  |  [12, 12368] |
| NumPerNeighbourhood_2020 | quantitative  |  |  [23, 7707] |
| NumPerNeighbourhood_2021 | quantitative  |  |  [16, 7836] |
| newYearCount | quantitative  |  |  [12, 48725] |
| Theft | quantitative  |  |  [9571, 61839]  |
| Mischief | quantitative  |  |  [2651, 14299] |
| Break and Enter | quantitative  |  |  [1523, 10755]  |
| Vehicle Collision or Pedestrian Struck | quantitative  |  |  [632, 4329] |
| Theft from Vehicle | quantitative  |  |  [5019, 31410]  |
| Other Theft | quantitative  |  |  [2963, 21462] |
| Theft of Bicycle | quantitative  |  |  [1150, 6092]  |
| Theft of Vehicle | quantitative  |  |  [413, 2875] |
| Mischief | quantitative  |  |  [2651, 14299] |
| Break and Enter Residential/Other | quantitative | |  [837, 5931]  |
| Break and Enter Commercial | quantitative  |  |  [686, 4824] |
| Vehicle Collision or Pedestrian Struck (with Injury) | quantitative  |  |  [821, 4289]  |
| Vehicle Collision or Pedestrian Struck (with Fatality) | quantitative  |  |  [6, 40] |

## Data Preprocessing

- Combine two datasets, shrink the size of dataset from 2015 - 2021 to 2017 - 2021
- Removed rows whose NEIGHBORHOOD is missing values (NaN)
- Removed rows whose X and Y is 0.0 (which is obviously out of Vancouver region)
- Removed the useless columns HUNDRED_BLOCK, X, Y, MINUTE
- [**Transform**: lat, long]\
Convert X and Y, which are UTM value to lat(latitude) and long (longitude)
- [**Derived**: TIME (day/night)] Generate column TIME by the daytime (6:00-18:00, value: ‘day’) and nighttime (18:00-next day 6:00, value: night)
- [**Aggregation**: NumPerNeighbourhood_all_yrs] \
A grouping by neighborhoods across 5 years will be generated to calculate the total number of crimes within each neighborhood.
- [**Aggregation**: NumPerNeighbourhood_[2017, 2021]] \
A grouping by neighborhood and a certain year will be generated to calculate the total number of crimes within each neighborhood and in that particular year.
- [**Aggregation**: newYearCount, Theft, Mischief, Break and Enter, Vehicle Collision or Pedestrian Struck, Theft from Vehicle, ..., Vehicle Collision or Pedestrian Struck (with Fatality)] \
We also do data aggregation in the code. Since we have a **year slider** and a **day & night toggle**, we filter the data based on user selections. The combination of the filtered data is much complexer than the listed ones above.

## Appendix (Subjective to change)

### Filterable data

- year (horizontal slider)
- neighbourhood (selected by clicking on the choropleth map)
- crime type (filtered by the segmented semicircle embraced the choropleth map)
- day and night (filtered by the toggle)


### Widgets

- **horizontal slider: year slider**
  - default year will be set to “all year”
  - user scrolls along the horizontal direction to select different years, the corresponding data for the selected year will reflect on the choropleth map
- **toggle** 
  - switching between day and night mode
  - filter data by daytime and nighttime (attr. TIME)
- **pie chart** 
  - select subcrime type
- **donut chart**
  - outer donut chart select general crime type
  - inner donut chart select subcrime type


### Views

- **Interactive legend**\
![legend](https://github.com/LinlinlinlinW/CPSC436V/blob/main/final_project/legend.png?raw=true)
- **Choropleth map, Donut chart, Pie chart**\
![composite](https://github.com/LinlinlinlinW/CPSC436V/blob/main/final_project/composite.png?raw=true)
- **Line chart**\
![linechart](https://github.com/LinlinlinlinW/CPSC436V/blob/main/final_project/linechart.png?raw=true)
- **Bar chart**\
![barchart](https://github.com/LinlinlinlinW/CPSC436V/blob/main/final_project/barchart.png?raw=true)

## Other link

### M1
[Google Doc](https://docs.google.com/document/d/1UnlkxzrZ1cPf0fUjIM90AV88Eg7nWFOxa5IyQBA1Ijc/edit?usp=sharing)

### M2
[Googld Doc](https://docs.google.com/document/d/1fti9RcgSs-0gND_9P6_M0gwIBIH0y4cD2rdTn0Te5ms/edit?usp=sharing)

### M3
[Googld Doc](https://docs.google.com/document/d/1z5tQsw_0SFYAq8MBX6jCyS7ETBdjB0wcE0tiXOViExk/edit?usp=sharing)


## Citation

- Interactive legend
  - [slider](https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518)
  - [Day-night-switch](https://codemyui.com/pure-css-ampm-toggle-switch/)
- Donutchart
  - [static view](https://d3-graph-gallery.com/graph/donut_basic.html)
- Inner donutchart
  - [static view](https://codepen.io/meditatingdragon/pen/QWjNYaX)
- Pie chart
  - [static view](https://d3-graph-gallery.com/graph/pie_basic.html)
  - [typer effect](http://jsfiddle.net/QbysN/3/)
- Choropleth map
  - [geographic view](https://codesandbox.io/s/github/UBC-InfoVis/2021-436V-examples/tree/master/d3-choropleth-map?file=/css/style.css:70-104)
  - [zoom in/out](https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2)
  - [choropleth data](https://www.sfu.ca/~lyn/data/Urban/VancouverAreaSize.json)
- Line chart
  - [tooltip](https://bl.ocks.org/LemoNode/a9dc1a454fdc80ff2a738a9990935e9d)