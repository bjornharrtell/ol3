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
    zoom: 16
  })
});

var topo = topolis.topo.create();

function nodeToFeature(node) {
  var feature = new ol.Feature({
    geometry: new ol.geom.Point(node.coordinate),
    node: node
  });
  feature.setId(node.id);
  nodes.addFeature(feature);
}

function edgeToFeature(edge) {
  var feature = new ol.Feature({
    geometry: new ol.geom.LineString(edge.coordinates),
    edge: edge
  });
  feature.setId(edge.id);
  edges.addFeature(feature);
}

function faceToFeature(face) {
  var coordinates = topolis.face.getFaceGeometry(topo, face);
  var feature = new ol.Feature({
    geometry: new ol.geom.Polygon(coordinates),
    face: face
  });
  feature.setId(face.id);
  faces.addFeature(feature);
}

function createNode(topo, coord) {
  var node, feature;
  var existingEdge = topolis.edge.getEdgeByPoint(topo, coord, 5);
  if (existingEdge) {
    node = topolis.edge.modEdgeSplit(topo, existingEdge, coord);
    coord[0] = node.coordinate[0];
    coord[1] = node.coordinate[1];
    feature = edges.getFeatureById(existingEdge.id);
    feature.setGeometry(new ol.geom.LineString(existingEdge.coordinates));
    edgeToFeature(existingEdge.nextLeft);
  } else {
    node = topolis.node.addIsoNode(topo, coord);
  }
  nodeToFeature(node);
  return node;
}


function onDrawend(e) {
  var feature;
  var edgeGeom = e.feature.getGeometry().getCoordinates();
  var startCoord = edgeGeom[0];
  var endCoord = edgeGeom[edgeGeom.length - 1];
  var start, end;
  var result, edge, removedFace;
  try {
    start = topolis.node.getNodeByPoint(topo, startCoord);
    if (start === 0) {
      start = createNode(topo, startCoord);
    }
    end = topolis.node.getNodeByPoint(topo, endCoord);
    if (end === 0) {
      end = createNode(topo, endCoord);
    }
    result = topolis.edge.addEdgeNewFaces(topo, start, end, edgeGeom);
    edge = result.edge;
    removedFace = result.removedFace;
    edgeToFeature(edge);
    if (edge.leftFace.id !== 0) {
      faceToFeature(edge.leftFace);
    }
    if (edge.rightFace.id !== 0) {
      faceToFeature(edge.rightFace);
    }
    if (removedFace) {
      feature = faces.getFeatureById(removedFace.id);
      faces.removeFeature(feature);
    }
  } catch (e) {
    toastr.warning(e.toString());
  }
}

var draw = new ol.interaction.Draw({
  type: 'LineString'
});
draw.on('drawend', onDrawend);
map.addInteraction(draw);
var snap = new ol.interaction.Snap({
  source: edges
});
map.addInteraction(snap);
map.addControl(new ol.control.MousePosition());
