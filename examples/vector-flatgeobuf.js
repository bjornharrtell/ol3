import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import FlatGeobuf from '../src/ol/format/FlatGeobuf.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import {Fill, Stroke, Style, Text} from '../src/ol/style.js';

import {bbox as bboxStrategy} from '../src/ol/loadingstrategy.js';

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

const vectorSource = new VectorSource({
  //url: 'data/flatgeobuf/countries.fgb',
  url: function(extent) {
    return 'http://localhost:8080/geoserver/wfs?service=WFS&' +
        'version=1.1.0&request=GetFeature&typename=topp:states&' +
        'outputFormat=application/flatgeobuf&srsname=EPSG:4326&' +
        'bbox=' + extent.join(',') + ',EPSG:4326';
  },
  strategy: bboxStrategy,
  format: new FlatGeobuf()
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: function(feature) {
    style.getText().setText(feature.get('name'));
    return style;
  }
});

const map = new Map({
  layers: [vectorLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1
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

const featureOverlay = new VectorLayer({
  source: new VectorSource(),
  map: map,
  style: function(feature) {
    highlightStyle.getText().setText(feature.get('name'));
    return highlightStyle;
  }
});

let highlight;
const displayFeatureInfo = function(pixel) {

  const feature = map.forEachFeatureAtPixel(pixel, function(feature) {
    return feature;
  });

  const info = document.getElementById('info');
  if (feature) {
    info.innerHTML = feature.getId() + ': ' + feature.get('name');
  } else {
    info.innerHTML = '&nbsp;';
  }

  if (feature !== highlight) {
    if (highlight) {
      featureOverlay.getSource().removeFeature(highlight);
    }
    if (feature) {
      featureOverlay.getSource().addFeature(feature);
    }
    highlight = feature;
  }

};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('click', function(evt) {
  displayFeatureInfo(evt.pixel);
});
