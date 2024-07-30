
var geometry_roi = 
     ee.Geometry.Polygon(
         [[[101.00841298710328, 3.5840956245106925],
           [101.15672841679078, 3.3538056172134443],
           [101.30779042850953, 3.4442833673276585],
           [101.11003652225953, 3.655364290850406],
           [101.15672841679078, 3.710182494184478],
           [101.02763906132203, 3.8061061368075664],
           [100.87932363163453, 3.6992191239822603]]]);

//Rudiyanto
//Program of Crop Science
//Faculty of Fisheries and Food Science
//Universiti Malaysia Terengganu
//Email: rudiyanto@umt.edu.my


//Citation: 
//Fatchurrachman; Rudiyanto; Soh, N.C.; Shah, R.M.; Goh, E.G.; Setiawan, B.I.;Minasny, B. 
//High-Resolution Mapping of Paddy Rice Extent and Growth Stages across Peninsular Malaysia 
//Using a Fusion of Sentinel-1 and 2 Time Series Data in Google Earth Engine. 
//Remote Sens. 2022, 14, x. https://doi.org/10.3390/xxxxx


// Define ROI
var roi=geometry_roi;
Map.centerObject(roi,10);

//Date
var startDate = ee.Date('2021-09-01');
var endDate =  ee.Date('2023-08-31');

// Create image collection of S-2 imagery for the perdiod 2019-2020
var S2 = ee.ImageCollection('COPERNICUS/S2')
         //filter start and end date
         .filter(ee.Filter.date(startDate, endDate))
         .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than',100)
         //filter according to drawn boundary
         .filterBounds(roi)


print(S2.limit(10))
print(S2.aggregate_array('SPACECRAFT_NAME'))
// Function to calculate and add an NDVI band
var addNDVI = function(image) {
 return image.addBands(image.normalizedDifference(['B8', 'B4'] )); //'B8', 'B4'
};  
  
// Add NDVI band to image collection
var S2 = S2.map(addNDVI).select(['nd']);
print('S2',S2.limit(10)) ;
var NDVI=S2.select('nd');

// For month
var month = 1;

// Calculating number of intervals
var months = endDate.difference(startDate,'month').divide(month).toInt();
// Generating a sequence 
var sequence = ee.List.sequence(0, months); 
print(sequence)

var sequence_s1 = sequence.map(function(num){
    num = ee.Number(num);
    var Start_interval = startDate.advance(num.multiply(month), 'month');
  
    var End_interval = startDate.advance(num.add(1).multiply(month), 'month');
    var subset = NDVI.filterDate(Start_interval,End_interval);
    return subset.max().set('system:time_start', Start_interval);
});

print('sequence_s1',sequence_s1)
var byMonthYear = ee.ImageCollection.fromImages(sequence_s1);

print('byMonthYear',byMonthYear)
var multibandNDVI = byMonthYear.toBands().clip(roi);
print('multiband',multibandNDVI);



var bandsName=['2020-09','2020-10','2020-11','2020-12',
               '2021-01','2021-02','2021-03','2021-04',
               '2021-05','2021-06','2021-07','2021-08',
               '2021-09','2021-10','2021-11','2021-12', 
               '2022-01','2022-02','2022-03','2022-04',
               '2022-05','2022-06','2022-07','2022-08']
              // '2023-07','2023-08','2023-09','2023-10','2023-11','2023-12']

var multiband1_ndvi = multibandNDVI.rename(bandsName).clip(roi);//(monList)//
//

//s1
var sentinel1_vh = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  .select('VH')
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('resolution_meters', 10))
  .filter(ee.Filter.date(startDate, endDate))
  .filter(ee.Filter.bounds(roi))

print('s1',sentinel1_vh);

// For month
var month = 1;

// Calculating number of intervals
var months = endDate.difference(startDate,'month').divide(month).toInt();
// Generating a sequence 
var sequence = ee.List.sequence(0, months); 
print(sequence)

var sequence_s1 = sequence.map(function(num){
    num = ee.Number(num);
    var Start_interval = startDate.advance(num.multiply(month), 'month');
  
    var End_interval = startDate.advance(num.add(1).multiply(month), 'month');
    var subset = sentinel1_vh.filterDate(Start_interval,End_interval);
    return subset.median().set('system:time_start',Start_interval);
});

print('sequence_s1',sequence_s1)
var byMonthYearS1 = ee.ImageCollection.fromImages(sequence_s1);
var multibands1 = byMonthYearS1.toBands().clip(roi);



var multibands1 = multibands1.rename(bandsName).clip(roi);//.rename(monLists1).clip(roi);//


//combined s1 and s2
var combinedband=multiband1_ndvi.addBands(multibands1);
print('combinedband',combinedband);



var num_pixels = 30;

var training = combinedband.sample({
  region: roi,
  scale: 10,
  numPixels: num_pixels ,
  tileScale:8,
 // geometries:true
  
});

//Map.addLayer(training,{},'points')
var num_clusters = 5;
var clusterer = ee.Clusterer.wekaKMeans(num_clusters).train({
  features:training
  
});

// Cluster the input using the trained clusterer.
var result_cluster_wo_byte = combinedband.cluster(clusterer)
print("WO BYTE : ", result_cluster_wo_byte);
var result_cluster = result_cluster_wo_byte.byte();//combands
print('result_s2',result_cluster);

var randomPoints = ee.FeatureCollection.randomPoints({
  region: roi,
  points: num_pixels, // Number of random points to generate.
  seed: 123 // Optional seed for reproducibility.
});

print("Random Points : ", randomPoints);

// Sample the 'result_cluster' image to get cluster labels for the points, limiting the number of samples.
var clusterLabels = result_cluster.sample({
  region: randomPoints, // Use the feature collection of points as the region.
  scale: 10, // Adjust the scale as needed.
  numPixels: num_pixels // Limit the number of sampled elements.
});

// Print the cluster labels for the ROI.
print("Cluster Labels for ROI:", clusterLabels);



var clusters = ee.List.sequence(0, num_clusters);
var values0 = ee.List.sequence(0, num_clusters);

var remapped_cluster = result_cluster.rename('remapped');// .remap(clusters, values0).byte().clip(roi);//.updateMask(slope.lt(slope_th))
var remapped_cluster1=remapped_cluster
var remapped_cluster2=remapped_cluster

var comb_ndvi_cluster=multiband1_ndvi.addBands(remapped_cluster);
print("comb_ndvi_cluster",comb_ndvi_cluster);

// Sample the 'result_cluster' image to get cluster labels for the points, limiting the number of samples.
var ndviSeries = comb_ndvi_cluster.sample({
  region: randomPoints, // Use the feature collection of points as the region.
  scale: 10, // Adjust the scale as needed.
  numPixels: num_pixels // Limit the number of sampled elements.
});

// print("Download URL : ", ndviSeries.getDownloadURL());
Export.table.toDrive({collection: ndviSeries, fileFormat: 'GeoJSON', description: 'NDVI_at_sample'})
Export.table.toDrive({collection: randomPoints, fileFormat: 'GeoJSON', description: 'sampled_points'})

// var data = [];
var data = {};

// Iterate over each feature (point) in ndviSeries
ndviSeries = ndviSeries.toList(num_pixels);
print("list ndviseries : ", ndviSeries);
clusterLabels = clusterLabels.toList(num_pixels);

var options = {
  lineWidth: 1,
  pointSize: 2,
  hAxis: {title: 'Year-Month'},
  vAxis: {title: 'NDVI'},
  title: 'Sentinel-2 NDVI spectra in classified regions'
};

// Make the chart, set the options.
var chart_class_ndvi = ui.Chart.image.byClass(
    comb_ndvi_cluster, 'remapped', roi, ee.Reducer.median(), 500)//, classNames, wavelengths)
    .setOptions(options)
    .setChartType('ScatterChart');

// Print the chart.


//
var comb_vh_cluster=multibands1.addBands(remapped_cluster);
print("comb_vh_cluster",comb_vh_cluster);
// Define chart customization options.
var options = {
  lineWidth: 1,
  pointSize: 2,
  hAxis: {title: 'Year-Month'},
  vAxis: {title: 'VH'},
  title: 'Senetinel-1 VH spectra in classified regions'
};

// Make the chart, set the options.
var chart_class_vh = ui.Chart.image.byClass(
    comb_vh_cluster, 'remapped', roi, ee.Reducer.median(), 500)//, classNames, wavelengths)
    .setOptions(options)
    .setChartType('ScatterChart');


Map.addLayer(multiband1_ndvi ,  {min: 0.2, max: 0.8}, 'NDVI',0);
Map.addLayer(multibands1 ,  {min: -25, max: -10}, 'VH',0);

Map.addLayer(remapped_cluster.randomVisualizer(), {}, 're_groups_s2',0);
Map.addLayer(remapped_cluster1, {min:1,max:1,palette:['white','red']}, 'binary_rice',1);
Map.addLayer(remapped_cluster2.randomVisualizer(), {}, 'pattern_rice',1);  

// Create a panel next to the map
var panel = ui.Panel({style:{width: '550px'}});
ui.root.add(panel);

 // value: 'SENTINEL-2 NDVI & SENTINEL-1 VH Explorer',
 var label1 = ui.Label({
  value: 'SENTINEL-2 NDVI & SENTINEL-1 VH Explorer: Paddy Clustering',
   style: {
    //fontSize: '20px',
    color: 'white',
    backgroundColor :'blue',
    padding: '5px',
   margin: '12px 0px 0px 8px', fontWeight: 'bold', fontSize: '14px', border: '1px solid black', 
   padding: '5px 5px 5px 5px',
  }
});


 var label2 = ui.Label({
  value: 'Developed by Rudiyanto',
  style: {
    fontSize: '16px',
    color: 'red',
   // fontWeight: 'bold',
    padding: '5px',
  }
});


// var affiliationLabel= ui.Label('Instructions',{fontWeight: 'bold',padding: '3px',});
// var affiliation= ui.Label(
//   "Program of Crop Science\n"+
//   "Faculty of Fisheries and Food Science\n"+
//   "Universiti Malaysia Terengganu\n"+
//   "Email: rudiyanto@umt.edu.my\n"
//   , {whiteSpace:'pre',padding: '5px',fontSize: '16px',
//     color: 'red',
//   // fontWeight: 'bold',
//     }
  
// );


var affiliationPanel = ui.Panel([affiliationLabel,affiliation]);
var affiliationPanel = ui.Panel([affiliation]);


 
 panel.add(label1);
 panel.add(label2);
 panel.add(affiliationPanel);
 panel.add(chart_class_ndvi);
 panel.add(chart_class_vh);
