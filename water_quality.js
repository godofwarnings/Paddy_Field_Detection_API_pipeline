// districts is the name of the table imported
var district_interest = districts.filter(ee.Filter.eq('DISTRICT_N', 'Kamareddy'))
print(district_interest.geometry())
var geometry_roi = district_interest.geometry()

var roi=geometry_roi;


// var roi = ee.Geometry.Polygon(
//         [[[105.72, 21.12],
//           [105.72, 20.93],
//           [105.93, 20.93],
//           [105.93, 21.12]]]);


var IMG = ee.ImageCollection("COPERNICUS/S2_SR")
            .filterBounds(roi)
            .sort('CLOUDY_PIXEL_PERCENTAGE',true)
            .first()
            .clip(roi);

print(IMG)

var IMG_water = ndwi_f(IMG)
var IMG_NDCI = ndci_f(IMG_water)

// print(IMG.get('CLOUDY_PIXEL_PERCENTAGE'))

var viz = {min:0.1,max:0.4,palette:['cyan','orange','red']}

Map.addLayer(IMG,{bands:['B4','B3','B2'],min:0,max:3500},'IMG')
Map.addLayer(IMG_water.select('NDWI'),{palette:['cyan']},"IMG_water")
Map.addLayer(IMG_NDCI.select('NDCI'),viz,"IMG_NDCI")


function ndwi_f(img){
  //water mask
  var ndwi = img.normalizedDifference(['B3', 'B8']).rename('NDWI');
  return img.addBands(ndwi)
  .updateMask(ndwi.gt(0))
}


function ndci_f(img){
  //water mask
  var ndci = img.normalizedDifference(['B5', 'B4']).rename('NDCI');
  return img.addBands(ndci)
}




//
/////////////Legend///////////////

 

// set position of panel
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});
 
 
// Create legend title
var legendTitle = ui.Label({
  // value: 'chl-a \n (mg/m3)',
  value: 'water quality',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
    }
});

 // Add the title to the panel
legend.add(legendTitle); 

// create the legend image
var lon = ee.Image.pixelLonLat().select('latitude');
var gradient = lon.multiply((viz.max-viz.min)/100.0).add(viz.min);
var legendImage = gradient.visualize(viz);

// create text on top of legend
var panel = ui.Panel({
    widgets: [
      ui.Label('polluted')
    ],
  });

legend.add(panel);
  
// create thumbnail from the image
var thumbnail = ui.Thumbnail({
  image: legendImage, 
  params: {bbox:'0,0,10,100', dimensions:'10x200'},  
  style: {padding: '1px', position: 'bottom-center'}
});

// add the thumbnail to the legend
legend.add(thumbnail);

// create text on top of legend
var panel = ui.Panel({
    widgets: [
      ui.Label('normal')
    ],
  });

legend.add(panel);

Map.add(legend);
