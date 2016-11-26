var raster = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var nodes = new ol.source.Vector({wrapX: false});
var nodesLayer = new ol.layer.Vector({
  source: nodes,
  style: function(f) {
    var style = new ol.style.Style({
      image: new ol.style.Circle({
        radius: 10,
        fill: new ol.style.Fill({color: 'rgba(255, 0, 0, 0.1)'}),
        stroke: new ol.style.Stroke({color: 'red', width: 1})
      }),
      text: new ol.style.Text({
        text: f.get('node').id.toString(),
        fill: new ol.style.Fill({color: 'red'}),
        stroke: new ol.style.Stroke({
          color: 'white',
          width: 3
        })
      })
    });
    return [style];
  }
});

var edges = new ol.source.Vector({wrapX: false});
var edgesLayer = new ol.layer.Vector({
  source: edges,
  style: function(f) {
    var style = new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'blue',
        width: 1
      }),
      text: new ol.style.Text({
        text: f.get('edge').id.toString(),
        fill: new ol.style.Fill({color: 'blue'}),
        stroke: new ol.style.Stroke({
          color: 'white',
          width: 2
        })
      })
    });
    return [style];
  }
});

var faces = new ol.source.Vector({wrapX: false});
var facesLayer = new ol.layer.Vector({
  source: faces,
  style: function(f) {
    var style = new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'black',
        width: 1
      }),
      fill: new ol.style.Fill({
        color: 'rgba(0, 255, 0, 0.5)'
      }),
      text: new ol.style.Text({
        font: 'bold 12px sans-serif',
        text: f.get('face').id.toString(),
        fill: new ol.style.Fill({color: 'green'}),
        stroke: new ol.style.Stroke({
          color: 'white',
          width: 2
        })
      })
    });
    return [style];
  }
});

var map = new ol.Map({
  layers: [raster, facesLayer, edgesLayer, nodesLayer],
  target: 'map',
  view: new ol.View({
    center: [-11000000, 4600000],
    zoom: 4
  })
});

var typeSelect = document.getElementById('type');

var topo = topolis.topo.create();

function onDrawend(e) {
  var feature = e.feature;
  var c = feature.getGeometry().getCoordinates();
  try {
    if (typeSelect.value === 'Point') {
      var node = topolis.node.addIsoNode(topo, c);
      feature.set('node', node);
      nodes.addFeature(feature);
    } else {
      var start = topolis.node.getNodeByPoint(topo, c[0]);
      if (start === 0) throw Error('Cannot find start node');
      var end = topolis.node.getNodeByPoint(topo, c[c.length-1]);
      if (end === 0) throw Error('Cannot find end node');
      var result = topolis.edge.addEdgeNewFaces(topo, start, end, c);
      var edge = result.edge;
      var removedFace = result.removedFace;
      feature.set('edge', edge);
      edges.addFeature(feature);
      var face = edge.leftFace;
      if (face.id !== 0) {
        var coordinates = topolis.face.getFaceGeometry(topo, face);
        var polygon = new ol.geom.Polygon(coordinates);
        var feature = new ol.Feature({
          geometry: polygon,
          face: face
        });
        feature.setId(face.id);
        faces.addFeature(feature);
      }
      face = edge.rightFace;
      if (face.id !== 0) {
        var coordinates = topolis.face.getFaceGeometry(topo, face);
        var polygon = new ol.geom.Polygon(coordinates);
        var feature = new ol.Feature({
          geometry: polygon,
          face: face
        });
        feature.setId(face.id);
        faces.addFeature(feature);
      }
      if (removedFace) {
        var feature = faces.getFeatureById(removedFace.id);
        faces.removeFeature(feature);
      }
    }
  } catch (e) {
    toastr.warning(e.toString());
  }
}

var draw; // global so we can remove it later
function addInteraction() {
  var value = typeSelect.value;
  if (value !== 'None') {
    draw = new ol.interaction.Draw({
      type: /** @type {ol.geom.GeometryType} */ (typeSelect.value)
    });
    draw.on('drawend', onDrawend);
    map.addInteraction(draw);
    var snap = new ol.interaction.Snap({
      source: nodes
    });
    map.addInteraction(snap);
  }
}


/**
 * Handle change event.
 */
typeSelect.onchange = function() {
  map.removeInteraction(draw);
  addInteraction();
};

addInteraction();
