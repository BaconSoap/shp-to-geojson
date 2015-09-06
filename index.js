var fs = require('fs');
var gdal = require('gdal');
var _ = require('lodash');

var projectName = 'trees';

processProject(projectName, projectName, false);
processProject(projectName, projectName + '.filtered', true);

function processProject(inName, outName, applyFilter) {
  try {
    var dataset = gdal.open('data/' + inName + '.shp');

    // setup coordinate projections
    var inputSpatialRef = dataset.layers.get(0).srs;
    var outputSpatialRef = gdal.SpatialReference.fromEPSG(4326);
    var transform = new gdal.CoordinateTransformation(inputSpatialRef, outputSpatialRef);

    if (applyFilter) {
      var reverseTransform = new gdal.CoordinateTransformation(outputSpatialRef, inputSpatialRef);
      setSpatialFilter(dataset, reverseTransform);
    }

    var layer = dataset.layers.get(0);

    // load features
    var layerFeatures = layer.features;
    var feat = null;
    var transformed = [];

    // transform features
    while (feat = layerFeatures.next()) {
      transformed.push(getGeoJsonFromGdalFeature(feat, transform, true));
    }

    writeJson(transformed, outName);
    writeSampleJson(transformed, outName);

    console.log('processed %s features', transformed.length);
  } catch (e) {
    console.log(gdal.lastError)
    console.log(e)
  }
}

/**
 * filter the first layer of a dataset to an area in Cambridge, MA
 */
function setSpatialFilter(dataset, reverseTransform) {
  var upperRight = reverseTransform.transformPoint(-71.09338760375977, 42.37591968756359);
  var lowerLeft = reverseTransform.transformPoint(-71.10793590545654, 42.367089718893396);
  dataset.layers.get(0).setSpatialFilter(lowerLeft.x, lowerLeft.y, upperRight.x, upperRight.y)
}

/**
 * create a GeoJSON feature out of a GDAL feature object
 */
function getGeoJsonFromGdalFeature(feature, coordTransform, includeProperties) {
  var geoJsonFeature = {
    type: 'Feature',
    properties: {}
  };
  var geo = feature.getGeometry().clone();
  geo.transform(coordTransform);
  geoJsonFeature.geometry = geo.toObject();
  if (includeProperties) {
    geoJsonFeature.properties = feature.fields.toObject();
  }
  return geoJsonFeature;
}

/**
 * wrap a collection of Features inside a GeoJSON FeatureCollection
 */
function getGeoJsonFeatureCollectionFromFeatures(features) {
  return {
    type: 'FeatureCollection',
    features: features
  };
}

function writeJson(transformed, outName) {
  var sampledFeatureCollection = getGeoJsonFeatureCollectionFromFeatures(_.sample(transformed, 500));
  var stringifiedSample = JSON.stringify(sampledFeatureCollection);
  fs.writeFileSync('output/' + outName + '.sample.json', stringifiedSample);
}

function writeSampleJson(transformed, outName) {
  var featureCollection = getGeoJsonFeatureCollectionFromFeatures(transformed);
  var stringified = JSON.stringify(featureCollection);
  fs.writeFileSync('output/' + outName + '.json', stringified);
}
