//require modules
let d3 = Object.assign(
  {},
  require("d3"),
  require("d3-scale"),
  require("d3-geo"),
  require("d3-geo-projection")
);

let fs = require("fs");

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

let svg = d3
  .select(document.body)
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("xmlns", "http://www.w3.org/2000/svg");

svg
  .append("path")
  .attr("d", path({ type: "Sphere" }))

const outfile = `../data/outline/outline.svg`;

let outdata = document.body.firstChild.outerHTML;

fs.writeFile(outfile, outdata, function (err) {
  if (err) { return console.log(err); }
  console.log("The file was saved!");
});