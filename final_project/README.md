# Crime in Vancouver 
last updated on April 12, 2022

## Team members
Michaux Sun: [linkedin](https://www.linkedin.com/in/michaux-sun-1028/) ☀ 
Kerry Zhou: [linkedin](https://www.linkedin.com/in/hongkaiyuezhou/) ☀ 
Bolin Wang: [linkedin](https://www.linkedin.com/in/bolinwang227/)\
feel free to contact us 😀

## Overview
![overview](https://github.students.cs.ubc.ca/CPSC436V-2021W-T2/project_g11/blob/master/readmeImgs/overview.png?raw=true "Title")

Safety is one of the most important factors to consider when moving into a new place. If we can understand the composition of crime in different areas, it is possible to respond to crime in a more targeted manner, thus enhancing security. To achieve this, we propose building a data visualisation that visually allows relevant government officials (i.e., police) and ordinary people to explore crime datasets. Our app will show the overall distribution of crime in Vancouver and enable users to analyse and compare the trend among several neighbourhoods by filtering the crime type, year, and neighbourhood, as well as daytime and nighttime.

## Goals and Tasks
- **Discover overview**\
A police officer wants to discover overall crimes across neighborhoods in all years ( ordered attribute [YEAR: 2017, 2021]) to write a report of the security situation in Vancouver.
- **Lookup values**\
A police officer also wants to lookup the severe level (quantitative attribute [NumPerNeighbourhood_all_yrs: 1583, 48677]) of a specific crime type (categorical attribute [TYPE: 9]) across all neighborhoods to make detailed analysis in the report.
- **Discover trend**\
A journalist wants to discover the trend of each crime type across certain year ranges (ordered attribute [YEAR: 2017, 2021]).
- **Discover distribution**\
Since there are 9 crime types (categorical attribute [TYPE: 9]), which counts for 4 general crime types (categorical attribute [GENERAL_TYPE: 4]) in total, the journalist also wants to discover the distribution of each subcrime types within the corresponding general crime type.\
The new immigrant owns a luxury car and have children. Therefore, they would like to discover crime distribution (geographical data of quantitative[ lat: 49.201201, 49.294553] and [long: -123.224021, -123.023393]) within a specific neighborhood (categorical attribute [NEIGHBOURHOOD: 22]) for finding a parking lot nearby, and the playground for children. This is helpful for their specific needs.
- **Compare groups**\
A new immigrant has several neighborhoods in mind that wants to live in. They want to compare the total number of crimes (quantitative attribute [NumPerNeighbourhood_all_yrs: 1583, 48677]) within these neighborhoods (categorical attribute [NEIGHBOURHOOD: 22]) to help them make the final decision. 

## Dataset  

### Link
[link for source from 2015 - 2020](https://www.kaggle.com/emilyb123/vancouver-crime-data?select=crimedata_csv_all_years.csv) + [link for source in 2021](https://geodash.vpd.ca/opendata/) -> [final dataset link](https://docs.google.com/spreadsheets/d/1gRalBJugEXgEvUBeWQzdq2xlqZJdkjveN2PEOOEKF8E/edit?usp=sharing)\
[link for geodata](https://www.sfu.ca/~lyn/data/Urban/VancouverAreaSize.json)

### Description
We will be visualising a dataset of `161532` crimes. Each crime has `10` native attributes that include information about the `crime id(CASE_ID)`, `crime types (TYPE)`, the specific date and time the crime occurred `(YEAR, MONTH, DAY, HOUR, TIME)`, name of the `neighbourhood (NEIGHBOURHOOD)` and their `latitude (lat)` and `longitude (long)`. We also have transformed attributes, a derived attribute and aggregated attributes. The details are in the below, highlighted by **[Transform]**, **[Derived]**, and **[Aggregation]**.

### Data Preprocessing
1. Shrink the size of dataset from 2015 - 2020 to 2017 - 2020
2. Combine the dataset of 2021 with the one above, rename the index of the combined one as CASE_ID
3. Removed rows whose NEIGHBORHOOD, and X and Y is 0.0 is missing values (NaN)
4. Removed rows whose NEIGHBORHOOD is Stanley Park and Musqueam, since these two neighborhoods are not in the geo dataset.
5. [**Transform**: lat, long]\
Convert X and Y, which are UTM value to lat(latitude) and long (longitude)
6. Removed the useless columns HUNDRED_BLOCK, X, Y, MINUTE
7. [**Derived**: TIME (day/night)] Generate column TIME by the daytime (6:00-18:00, value: ‘day’) and nighttime (18:00-next day 6:00, value: night)
8. [**Aggregation**: NumPerNeighbourhood_[2017, 2021]] \
A grouping by neighborhood and a certain year will be generated to calculate the total number of crimes within each neighborhood and in that particular year.
9. [**Aggregation**: NumPerNeighbourhood_all_yrs] \
A grouping by neighborhoods across 5 years will be generated to calculate the total number of crimes within each neighborhood.
10. [**Aggregation**: newYearCount, Theft, Mischief, Break and Enter, Vehicle Collision or Pedestrian Struck, Theft from Vehicle, ..., Vehicle Collision or Pedestrian Struck (with Fatality)] \
We also do data aggregation in the `code`. Since we have a **year slider** and a **day & night toggle**, we filter the data based on user selections. The combination of the filtered data is much complexer than the listed ones above.

### Attributes table

|  Attr |  Type | Cardinality  |  Range |
|---|---|---|---|
| CASE_ID | categorical | 161532  |   |
| TYPE | categorical  | 9   |   |
| GENERAL_TYPE | categorical | 4  |   |
| YEAR  | ordered |  |  [2017, 2021] |
| MONTH | ordered  |  | [1, 12] |
| DAY | ordered  |  | [1, 31] |
| HOUR | ordered  |  | [0, 23] |
| TIME | categorical | 2 |  |
| NEIGHBOURHOOD | categorical  | 22 |  |
| Latitude | quantitative  |  | [49.201201, 49.294553]|
| Longitude | quantitative  |  |  [-123.224021, -123.023393] |
| NumPerNeighbourhood_all_yrs | quantitative  |  | [1583, 48677]  |
| NumPerNeighbourhood_2017 | quantitative  |  |  [347, 9950] |
| NumPerNeighbourhood_2018 | quantitative  |  |  [292, 10839] |
| NumPerNeighbourhood_2019 | quantitative  |  |  [295, 12362] |
| NumPerNeighbourhood_2020 | quantitative  |  |  [316, 7690] |
| NumPerNeighbourhood_2021 | quantitative  |  |  [273, 7836] |
| newYearCount | quantitative  |  |  [12, 48677] |
| Theft | quantitative  |  |  [49, 22503]  |
| Mischief | quantitative  |  |  [16, 4628] |
| Break and Enter | quantitative  |  |  [12, 1702]  |
| Vehicle Collision or Pedestrian Struck | quantitative  |  |  [5, 623] |
| Theft from Vehicle | quantitative  |  |  [25, 12051]  |
| Other Theft | quantitative  |  |  [1, 8397] |
| Theft of Bicycle | quantitative  |  |  [2, 1693]  |
| Theft of Vehicle | quantitative  |  |  [1, 362] |
| Break and Enter Residential/Other | quantitative | |  [10, 398]  |
| Break and Enter Commercial | quantitative  |  |  [2, 1304] |
| Vehicle Collision or Pedestrian Struck (with Injury) | quantitative  |  |  [5, 616]  |
| Vehicle Collision or Pedestrian Struck (with Fatality) | quantitative  |  |  [1, 7]|

## Appendix (Subjective to change)

### Filterable data

- year (horizontal slider)
- neighbourhood (selected by clicking on the choropleth map)
- crime type (filtered by double-ring donut chart)
- day and night (filtered by the toggle)


### Widgets

- **horizontal slider: year slider**
  - Default year will be set to “all year”
  - Users move the widgets along the slider to select different years, and the corresponding data for the selected year will reflect on the choropleth map, line chart and bar chart.
- **toggle** 
  - switching between daytime and nighttime mode
  - filter data by daytime and nighttime (attr. TIME)
- **pie chart** 
  - select subcrime type
- **double-ring donut chart**
  - outer donut chart select general crime type
  - inner donut chart select subcrime type


### Views

- **Interactive legend**\
![legend](https://github.students.cs.ubc.ca/CPSC436V-2021W-T2/project_g11/blob/master/readmeImgs/legend.png?raw=true)
- **Choropleth map, Double-ring donut chart, Pie chart**\
![composite](https://github.students.cs.ubc.ca/CPSC436V-2021W-T2/project_g11/blob/master/readmeImgs/composite.png?raw=true)
- **Line chart**\
![linechart](https://github.students.cs.ubc.ca/CPSC436V-2021W-T2/project_g11/blob/master/readmeImgs/linechart.png?raw=true)
- **Bar chart**\
![barchart](https://github.students.cs.ubc.ca/CPSC436V-2021W-T2/project_g11/blob/master/readmeImgs/barchart.png?raw=true)

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
- Outer donutchart
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
