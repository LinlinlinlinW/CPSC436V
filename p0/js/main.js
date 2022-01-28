/**
 * Load data from CSV file asynchronously and render scatter plot
 */
 d3.csv("data/experiment_data.csv")
 .then((data) => {
   
   // Convert strings to numbers
   data.forEach((d) => {
     d.accuracy = +d.accuracy;
     d.trial = +d.trial;
   });

   // Initialize chart
   const scatterplot = new Scatterplot(
     { parentElement: "#vis" },
     data
   );

   // Show chart
   scatterplot.updateVis();
 })
 .catch((error) => console.error(error));
