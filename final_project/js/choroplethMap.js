class ChoroplethMap {
    /**
     * Class constructor with basic configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _geoData, _neiData, _dispatcher, _colorMap, _generalColorMap, _indexMap) {
      this.config = {
        parentElement: _config.parentElement,
        choroplethWidth: _config.choroplethWidth || 400,
        choroplethHeight: _config.choroplethHeight || 400,
        margin: _config.margin || {top: 30, right: 10, bottom: 20, left: 10},
        tooltipPadding: 10,
        crime: _config.crime || "",
        neibourhood: _config.neibourhood || null,
        nightMode: _config.nightMode || false,
        crimeColorScale: _config.crimeColor || ['#E4E2E2', '#1B1B1B'],
        diplayDataByYear: 'NumPerNeighbourhood_all_yrs' || null,
        yearRange: _config.yearRange || [2017, 2021]
      }
      this.geoData= _geoData;
      this.neiData = _neiData;
      this.dispatcher = _dispatcher;
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
     * We initialize scales/axes and append static elements, such as axis titles.
     */
    initVis() {
      let vis = this;

      // Calculate inner chart size. Margin specifies the space around the actual chart.
      vis.width = vis.config.choroplethWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.choroplethHeight - vis.config.margin.top - vis.config.margin.bottom;
      vis.zoomedin = false
      vis.selectedNeibourhood = ""
      vis.zoomByNeibourhood = ""
      vis.countNeibour = 0

      // Define size of SVG drawing area
      vis.svg = d3.select(vis.config.parentElement).append('svg')
          .attr('id', 'choroplethmap')
          .attr('width', vis.config.choroplethWidth)
          .attr('height', vis.config.choroplethHeight)
          .attr('x', '28%')
          .attr('y', '17%')

      // Initialize projection and path generator
      vis.projection = d3.geoMercator()
      .translate([vis.width/2, vis.height/2]);
      vis.geoPath = d3.geoPath().projection(vis.projection);

      // Initialize clipping mask that covers the whole map
      vis.svg.append('defs')
        .append('clipPath')
          .attr('id', 'map-mask')
        .append('circle')
          .attr('r', 220)
          .attr("cy", 200)
          .attr("cx", 225)
    
      // Apply clipping mask to map to create a circle
      vis.chart = vis.svg.append('g')
          .attr('clip-path', 'url(#map-mask)')
        .append('g').attr('class', 'map')
      
      vis.updateVis();
    }
  
    updateVis() {
      let vis = this;
      vis.fromYear = vis.config.yearRange[0]
      vis.toYear = vis.config.yearRange[1]

      vis.crimeColor

      if(vis.config.nightMode) {
        if(vis.config.crime) {
          let colorVariable = vis.indexMap[vis.config.crime] === undefined ? `--crime-${vis.generalCirmeMap[vis.config.crime]}` : `--crime-${vis.indexMap[vis.config.crime]}`
          let colorCSS = getComputedStyle(document.documentElement).getPropertyValue(colorVariable)
          vis.crimeColor = colorCSS
        } else vis.crimeColor = 'grey'
      } else vis.crimeColor = vis.config.crime ? vis.generalColorMap[vis.config.crime] : '#1B1B1B'

      let crimeColorRange = ['#ffffff00', vis.crimeColor]

      // color should be updated according to the crime type, grey by default
      vis.colorScale = d3.scaleLog()
          .range(crimeColorRange)
          .interpolate(d3.interpolateHcl);
      
      // filter neiData by year range
      let crimeNumberExtent
      if (vis.config.yearRange.length === 1) {
        crimeNumberExtent = d3.extent(vis.geoData.features, d => d.properties[vis.config.yearRange[0]]);
        vis.neighborData = vis.neiData
        this.dispatcher.call('updateChoroplethLegend', null, [crimeColorRange, crimeNumberExtent]);

      } else if (vis.fromYear === 2017 && vis.toYear === 2021) {
        crimeNumberExtent = d3.extent(vis.geoData.features, d => d.properties[vis.config.diplayDataByYear]);
        vis.neighborData = vis.neiData
      } 
      else {
        vis.filterValue = (d) => d.YEAR >= vis.fromYear && d.YEAR <= vis.toYear
        vis.neighborData = vis.neiData.filter(vis.filterValue)

        //add new total year counts to geoData
        vis.geoData.features.filter((neighbour) => {
          let newYearCount = 0
          Object.keys(neighbour.properties).forEach((keyYear) => {
            if(+keyYear>=vis.fromYear && +keyYear <= vis.toYear) newYearCount += neighbour.properties[keyYear]
          })
          return neighbour.properties.newYearCount = newYearCount
        })
        crimeNumberExtent = d3.extent(vis.geoData.features, d => d.properties.newYearCount);
        this.dispatcher.call('updateChoroplethLegend', null, [crimeColorRange, crimeNumberExtent]);
      }
      vis.colorScale.domain(crimeNumberExtent);
      vis.renderVis();
    }  
  
    renderVis() {
      let vis = this;

      // Defines the scale of the projection so that the geometry fits within the SVG area
      vis.projection.fitSize([vis.config.choroplethWidth, vis.config.choroplethHeight], vis.geoData);
      
      // Append Vancouver map
      const neibourhoodPath = vis.chart.selectAll('.neibourhood')
          .data(vis.geoData.features)
        .join('path')
          .attr('class','neibourhood')
          .classed('selected', d => {
            if(vis.config.neibourhood && vis.config.neibourhood.includes(d.properties.NAME)) return true
            return false
          })
          .attr('id', d => d.properties.NAME)
          .attr('stroke', '#fff')
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .attr('d', vis.geoPath)
          .attr('fill', d => {
            if (vis.config.yearRange.length === 1){
              return vis.colorScale(+d.properties[vis.config.yearRange[0]])
            } 
            else if(vis.fromYear === 2017 && vis.toYear === 2021) {
              return vis.colorScale(+d.properties[vis.config.diplayDataByYear])
            } 
            else {
              return vis.colorScale(+d.properties.newYearCount)
            }
          });
  
      neibourhoodPath
          .on('mousemove', (event,d) => {
            const popTotalCrime = d.properties.newYearCount ? `<strong>${d.properties.newYearCount}</strong> Total Number of Cirmes` : `<strong>${d.properties[vis.config.diplayDataByYear]}</strong> Total Number of Cirmes` 
            d3.select('#tooltip-map')
              .style('display', 'block')
              .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
              .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
              .html(`
                <div class="tooltip-title">${d.properties.NAME}</div>
                <div>${popTotalCrime}</div>
              `);
            vis.chart.selectAll("path").sort(function (a, b) {
                if (a != d) return -1;
                else return 1;
            });
          })
          .on('mouseleave', () => {
            d3.select('#tooltip-map').style('display', 'none');
          })
          .on("click", (event, d) => {
            if(!vis.zoomedin) {
              vis.selectedNeibourhood = d.properties.NAME
              
              if (d3.select(event.currentTarget).classed('selected') === true){ // if already clicked, deselect it
                d3.select(event.currentTarget).classed("selected", false)
                vis.countNeibour--
                vis.dispatcher.call('filterByNeibourhood', event, vis.selectedNeibourhood);
              } else { // select this neiborhood
                if(vis.countNeibour<3) {
                  vis.countNeibour++
                  d3.select(event.currentTarget).classed("selected", true)
                  vis.dispatcher.call('filterByNeibourhood', event, vis.selectedNeibourhood);
                }  
              }
            }
          })

      let crimeInNeibourhood;

      // Zoom in/out by mouse
      vis.zoom = d3.zoom()
          .scaleExtent([1, 3.3])
          .on("zoom", zoomed);

      let transformk;

      function zoomed(event) {
        // if user is zooming in, transformk(origin scale) < event.transform.k(current)
        if(transformk < event.transform.k) {
          vis.zoomedin = true
          d3.select(".map")
            .transition()
            .duration(750)
            .style("stroke-width", 1.5 / d3.zoomTransform(this).k + "px")
            .style("transform", "translate(" + d3.zoomTransform(this).x + "px," + d3.zoomTransform(this).y + "px) scale(" + d3.zoomTransform(this).k + ")")

          if(event.transform.k > 2) {
              vis.zoomedin = true
              let neibourhoodID = event.sourceEvent.path[0].id
              if(neibourhoodID) 
                vis.zoomByNeibourhood = neibourhoodID
              if(event.sourceEvent.path[0].__data__.properties)
                vis.zoomByNeibourhood = event.sourceEvent.path[0].__data__.properties.NAME
              
              filterCrimeCases(vis.zoomByNeibourhood)
              showCrimeCases(crimeInNeibourhood)
          }
          transformk = event.transform.k
        } else {
          if(event.transform.k <= 2) {
            vis.zoomedin = false
            vis.zoomByNeibourhood = ""
            vis.chart.selectAll('.crimePoint').remove()
            if(transformk > event.transform.k){
              d3.select(".map")
                  .transition()
                  .duration(750)
                  .style("stroke-width", "1.5px")
                  .style("transform", "translate(0,0)")
            }
          } else {
            d3.select(".map")
            .transition()
            .duration(750)
            .style("stroke-width", 1.5 / d3.zoomTransform(this).k + "px")
            .style("transform", "translate(" + d3.zoomTransform(this).x + "px," + d3.zoomTransform(this).y + "px) scale(" + d3.zoomTransform(this).k + ")")
          }
          transformk = event.transform.k
        }
      }
      d3.select(".map").call(vis.zoom);
      
      // show crime cases
      function showCrimeCases(crimeInNeibourhood) {
        vis.chart.selectAll('.crimePoint')
          .data(crimeInNeibourhood)
        .join('circle')
          .attr('class', 'crimePoint')
          .attr("cy", (d) => vis.projection([d.long,d.lat])[1])
          .attr("cx", (d) => vis.projection([d.long,d.lat])[0])
          .attr("r", "1")
          .attr("fill", vis.config.nightMode ? "white" : "#5b91de")
          .attr("fill-opacity", 0.3)
      }

      function filterCrimeCases(zoomByNeibourhood){
        if (vis.config.crime != "")
            crimeInNeibourhood = vis.neighborData.filter(c => c.NEIGHBOURHOOD === zoomByNeibourhood && (c.TYPE.includes(vis.config.crime) || c.TYPE === vis.config.crime))
        else
            crimeInNeibourhood = vis.neighborData.filter(c => c.NEIGHBOURHOOD === zoomByNeibourhood)
      }

      if(vis.zoomedin) {
        filterCrimeCases(vis.zoomByNeibourhood)
        showCrimeCases(crimeInNeibourhood)
      } 
    }
  }