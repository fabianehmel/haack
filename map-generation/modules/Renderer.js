const fs = require("fs");
const Canvas = require("canvas");
const cliSpinners = require("cli-spinners");
const ora = require("ora");
const { ColorGenerator } = require("./ColorGenerator");
const d3 = Object.assign(
  {},
  require("d3"),
  require("d3-scale"),
  require("d3-geo"),
  require("d3-geo-projection")
);

class Renderer {
  constructor(config) {
    this.canvas;
    this.context;
    this.path;
    this.scalevalue;
    this.scalefactor;
    this.projection;

    this.width = config.dimensions.width;
    this.height = config.dimensions.height;
    this.exportPath = config.filepaths.export;
    this.title = config.title;

    if ("projection" in config) {
      this.projection = d3[config.projection.name]();
      for (var setting in config.projection.settings) {
        if (config.projection.settings.hasOwnProperty(setting)) {
          this.projection[setting](config.projection.settings[setting]);
        }
      }
    } else {
      this.projection = d3
        .geoMercator()
        .scale(this.width / 2 / Math.PI)
        .translate([this.width / 2, this.height / 2]);
    }

    this.createCanvas();
    this.calculateGeometry();
    this.clipContextBySphere();
  }

  calculateGeometry() {
    this.scalefactor = 8037 / 1000;
    this.scalevalue = this.width / this.scalefactor;
    this.projection
      .scale(this.scalevalue)
      .translate([this.width / 2, this.height / 2]);
    this.path = d3.geoPath(this.projection, this.context);
  }

  setWidth(w) {
    this.width = w;
  }
  setHeight(h) {
    this.height = h;
  }
  setDimensions(w, h) {
    this.width = w;
    this.height = h;
  }
  setExportPath(p) {
    this.exportPath = `${p}maps/`;
  }

  clipContextBySphere() {
    this.context.beginPath();
    this.path({ type: "Sphere" });
    this.context.clip();
    this.context.closePath();
  }

  createCanvas() {
    this.canvas = new Canvas(this.width, this.height);
    this.context = this.canvas.getContext("2d");
    this.context.clearRect(0, 0, this.width, this.height);
  }

  exportPNG() {
    if (!fs.existsSync(this.exportPath)) {
      fs.mkdirSync(this.exportPath);
    }

    const file = `${this.exportPath}maps/${this.title}.png`;

    let out = fs.createWriteStream(file);
    let stream = this.canvas.pngStream();

    const exportSpinner = ora("Exporting PNG…").start();

    stream.on("data", function(chunk) {
      out.write(chunk);
    });

    stream.on("end", function() {
      exportSpinner.succeed(`Export done! Find the file at: ${file}`);
    });
  }

  renderFilledLayer(data, color) {
    this.context.beginPath();
    this.path(data);
    this.context.fillStyle = color;
    this.context.fill();
    this.context.closePath();
  }

  renderStrokedLayer(data, color, strokeWidth) {
    this.context.beginPath();
    this.path(data);
    this.context.strokeStyle = color;
    this.context.lineWidth = strokeWidth;
    this.context.stroke();
    this.context.closePath();
  }

  renderLevelLayer(item) {
    const layerList = item.getLayers();
    const colorScheme = item.getChroma();
    const path = item.getPath();
    const easing = item.getColorEasing();

    // const renderSpinner = ora({ text: `Rendering LayerList for path ${path}…`, spinner: cliSpinners.earth })
    // renderSpinner.start()

    const cG = new ColorGenerator();
    cG.setColorScheme(colorScheme);
    cG.setColorEasing(easing);
    cG.setInputScale(
      getMinOfLayerList(layerList),
      getMaxOfLayerList(layerList)
    );

    for (i = 0; i < layerList.length; i++) {
      // cache current Height
      const currentHeight = layerList[i];
      // retreive color
      const color = cG.getColor(currentHeight);
      // logging
      console.log(
        `    ${i + 1}/${
          layerList.length
        } — Rendering level ${currentHeight} — color ${color}`
      );
      // load the data
      const data = JSON.parse(
        fs.readFileSync(`${path}/${currentHeight}.geojson`, "utf8")
      );
      // render
      this.renderFilledLayer(data, color);
    }
  }
}

function getMaxOfLayerList(layer) {
  let max = 0;
  for (i = 0; i < layer.length; i++) {
    let currentInt = parseInt(layer[i]);
    if (currentInt > max) {
      max = currentInt;
    }
  }
  return max;
}

function getMinOfLayerList(layer) {
  let min = 0;
  for (i = 0; i < layer.length; i++) {
    let currentInt = parseInt(layer[i]);
    if (currentInt < min) {
      min = currentInt;
    }
  }
  return min;
}

exports.Renderer = Renderer;
