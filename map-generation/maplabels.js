//require modules
let d3 = Object.assign(
  {},
  require("d3"),
  require("d3-scale"),
  require("d3-geo"),
  require("d3-geo-projection")
);

let topojson = require("topojson-client");
let fs = require("fs");

const BASE_FILEPATH = "data/json/";

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { document } = new JSDOM("<!doctype html>").window;

//SVG dimensions
const width = 30000;
const height = 17000;

const scalefactor = 8037 / 1000;
const scalevalue = width / scalefactor;

const projection = d3
  .geoPolyhedralWaterman()
  .rotate([20, 0])
  .scale(scalevalue)
  .translate([width / 2, height / 2])
  .precision(0.1);
const path = d3.geoPath(projection);

const ne_10m_geography_regions_polys = JSON.parse(
  fs.readFileSync(
    "ne_10m_geography_marine_polys_4.0.0_centerlines.geojson",
    "utf8"
  )
);

let features = [];
ne_10m_geography_regions_polys.features.forEach(function(item) {
  item.properties.featurecla = item.properties.featurecla.replace("/", "_");
  features[item.properties.featurecla] =
    features[item.properties.featurecla] || [];
  features[item.properties.featurecla]["s" + item.properties.scalerank] =
    features[item.properties.featurecla]["s" + item.properties.scalerank] || [];
  features[item.properties.featurecla]["s" + item.properties.scalerank].push(
    item
  );
});

generateLabels();

function createForArray(arr, featurecla, scalerank) {
  let { document } = new JSDOM("<!doctype html>").window;

  let svg = d3
    .select(document.body)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("xmlns", "http://www.w3.org/2000/svg");
  // .attr("xmlns:xlink", "http://www.w3.org/1999/xlink");

  // let defs = svg.append("defs");

  const outname = featurecla + "_" + scalerank;
  let container = svg.append("g").attr("id", outname);

  for (i = 0; i < features[featurecla][scalerank].length; i++) {
    const item = features[featurecla][scalerank][i];

    //Create an SVG path
    container
      .append("path")
      .attr("id", function() {
        return item.properties.name;
      }) //very important to give the path element a unique ID to reference later
      .attr("d", function() {
        return path(item);
      })
      .style("fill", "none")
      .style("stroke", "#AAAAAA");

    container
      .append("text")
      .attr("id", function() {
        return item.properties.name;
      }) //very important to give the path element a unique ID to reference later
      .attr("x", function() {
        return path.centroid(item)[0];
      })
      .attr("y", function() {
        return path.centroid(item)[1];
      })
      .attr("text-anchor", "middle")
      .text(function() {
        return item.properties.name;
      });
  }

  const outfile = `out_marine/${outname}.svg`;

  let outdata = document.body.firstChild.outerHTML;
  let outdata_fixed = outdata.replace(/textpath/gi, "textPath");

  fs.writeFile(outfile, outdata_fixed, function(err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });
}

function generateLabels() {
  for (let featurecla in features) {
    if (features.hasOwnProperty(featurecla)) {
      for (let scalerank in features[featurecla]) {
        if (features[featurecla].hasOwnProperty(scalerank)) {
          createForArray(
            features[featurecla][scalerank],
            featurecla,
            scalerank
          );
        }
      }
    }
  }
}
