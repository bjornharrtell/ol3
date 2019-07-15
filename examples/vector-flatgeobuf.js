import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import {Fill, Stroke, Style, Text} from '../src/ol/style.js';

import Feature from '../src/ol/Feature.js';
import Point from '../src/ol/geom/Point.js';
import MultiPoint from '../src/ol/geom/MultiPoint.js';
import LineString from '../src/ol/geom/LineString.js';
import MultiLineString from '../src/ol/geom/MultiLineString.js';
import Polygon from '../src/ol/geom/Polygon.js';
import MultiPolygon from '../src/ol/geom/MultiPolygon.js';
import GeometryLayout from '../src/ol/geom/GeometryLayout.js';

import {all as allStrategy, bbox as bboxStrategy} from '../src/ol/loadingstrategy.js';

import MousePosition from '../src/ol/control/MousePosition'

const style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new Stroke({
    color: '#319FD3',
    width: 1
  }),
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: '#000'
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 3
    })
  })
});

const ol = {
  geom: {
    Point,
    MultiPoint,
    LineString,
    MultiLineString,
    Polygon,
    MultiPolygon,
    GeometryLayout
  },
  Feature
};

const vectorSource = new VectorSource({
  //strategy: allStrategy,
  strategy: bboxStrategy,
  loader: async function(extent) {
    const baseUrl = 'http://localhost:8080/geoserver/topp/ows'
    const baseParams = 'service=WFS&version=1.0.0&request=GetFeature'
    const typeNameParam = 'typeName=' + 'gis_osm_roads_free_1'
    const bboxParam = 'bbox=' + extent.join(',')
    const outputFormatParam = 'outputFormat=application/flatgeobuf'
    const url = `${baseUrl}?${baseParams}&${typeNameParam}&${bboxParam}&${outputFormatParam}`
    const response = await fetch(url)
    //const response = await fetch('http://localhost:8080/geoserver/topp/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=topp%3Astates&outputFormat=application%2Fflatgeobuf')
    let asyncIterator = flatgeobuf.deserializeStream(response.body, ol)
    this.clear()
    for await (let feature of asyncIterator)
      this.addFeature(feature)
  }
});

const vectorLayer = new VectorLayer({
  source: vectorSource
});

const map = new Map({
  layers: [vectorLayer],
  controls: [new MousePosition()],
  target: 'map',
  view: new View({
    center: [11, 55.5],
    zoom: 12,
    projection: 'EPSG:4326'
  })
});

const highlightStyle = new Style({
  stroke: new Stroke({
    color: '#f00',
    width: 1
  }),
  fill: new Fill({
    color: 'rgba(255,0,0,0.1)'
  }),
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: '#000'
    }),
    stroke: new Stroke({
      color: '#f00',
      width: 3
    })
  })
});
