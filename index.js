var fs = require('fs');
var gdal = require('gdal');
var _ = require('lodash');

var projectName = 'trees';

try {
  var dataset = gdal.open('data/' + projectName + '.shp');

  // setup coordinate projections
  var inputSpatialRef = dataset.layers.get(0).srs;
  var outputSpatialRef = gdal.SpatialReference.fromEPSG(4326);
  var transform = new gdal.CoordinateTransformation(inputSpatialRef, outputSpatialRef);
  
  // load features
  var layerFeatures = dataset.layers.get(0).features;
  var feat = null;
  var transformed = [];

  // transform features
  while (feat = layerFeatures.next()) {
    transformed.push(getGeoJsonFromGdalFeature(feat, transform, true));
  }

  writeJson(transformed);
  writeSampleJson(transformed);

  console.log('processed %s features', transformed.length);
} catch (e) {
  console.log(gdal.lastError)
  console.log(e)
}

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

function getGeoJsonFeatureCollectionFromFeatures(features) {
  return {
    type: 'FeatureCollection',
    features: features
  };
}

function writeJson(transformed) {
  var sampledFeatureCollection = getGeoJsonFeatureCollectionFromFeatures(_.sample(transformed, 100));
  var stringifiedSample = JSON.stringify(sampledFeatureCollection);
  fs.writeFileSync('output/' + projectName + '.sample.json', stringifiedSample);
}

function writeSampleJson(transformed) {
  var featureCollection = getGeoJsonFeatureCollectionFromFeatures(transformed);
  var stringified = JSON.stringify(featureCollection);
  fs.writeFileSync('output/' + projectName + '.json', stringified);
}
