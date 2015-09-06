var fs = require('fs');
var _ = require('lodash');

var projectName = 'trees.filtered.sample.json';

var output = "id,lat,lng\r\n";
var linebreak = "\r\n";

var geoJson = JSON.parse(fs.readFileSync(projectName).toString());
var lines = _.uniq(geoJson.features, function(feature) {
  return feature.properties.TreeID;
}).map(function(feature) {
  var geo = feature.geometry.coordinates;
  return feature.properties.TreeID + "," + geo[1] + "," + geo[0];
});

output += lines.join(linebreak);
fs.writeFileSync('trees.filtered.sample.csv', output);
