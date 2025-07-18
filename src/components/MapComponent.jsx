import React, { useEffect, useRef } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {
  fromLonLat,
  toLonLat,
  transform,
  METERS_PER_UNIT,
  get as getProjection,
} from "ol/proj";
import { getCenter } from "ol/extent";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import Feature from "ol/Feature";
import Draw from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Select from "ol/interaction/Select";
import { click } from "ol/events/condition";
import Graticule from "ol/layer/Graticule";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import CircleStyle from "ol/style/Circle";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import TileWMS from "ol/source/TileWMS";

// --- Register UTM projections for Laos (Zones 47N and 48N) ---
proj4.defs("EPSG:32647", "+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs");
proj4.defs("EPSG:32648", "+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs");
register(proj4);

const MapComponent = ({
  activeTool,
  setMapInstance,
  graticuleEnabled,
  graticuleType,
  isHistoricalLayerActive,
  selectedDate,
  importedLayers,
  baseLayerStates,
  onFeatureSelect,
}) => {
  const mapRef = useRef();
  const olMap = useRef(null);
  const drawInteractionRef = useRef(null);
  const modifyInteractionRef = useRef(null);
  const selectInteractionRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const graticuleLayer = useRef(null);
  const utmLabelSource = useRef(new VectorSource());
  const utmGridLineSource = useRef(new VectorSource());

  // --- Initial Map Setup ---
  useEffect(() => {
    const baseLayers = [
      new TileLayer({
        source: new XYZ({
          url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        }),
        name: "osm",
        visible: true,
      }),
      new TileLayer({
        source: new XYZ({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        }),
        name: "satellite",
        visible: false,
      }),
      new TileLayer({
        source: new XYZ({
          url: "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
        }),
        name: "topo",
        visible: false,
      }),
      new TileLayer({
        source: new XYZ({
          url: "https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}",
        }),
        name: "googleSatellite",
        visible: false,
      }),
      new TileLayer({
        source: new XYZ({
          url: "https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}",
        }),
        name: "googleHybrid",
        visible: false,
      }),
      new TileLayer({
        source: new XYZ({
          url: "https://{a-d}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
        }),
        name: "carto",
        visible: false,
      }),
    ];

    vectorLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      name: "editorLayer",
    });

    const utmLabelLayer = new VectorLayer({
      source: utmLabelSource.current,
      style: (feature) => feature.get("style"),
      name: "utmLabelLayer",
      zIndex: 1000,
    });
    const utmGridLineLayer = new VectorLayer({
      source: utmGridLineSource.current,
      style: new Style({
        stroke: new Stroke({
          color: "rgba(255, 120, 0, 0.8)",
          width: 2,
          lineDash: [4, 4],
        }),
      }),
      name: "utmGridLineLayer",
      zIndex: 998,
    });

    olMap.current = new Map({
      target: mapRef.current,
      layers: [
        ...baseLayers,
        vectorLayerRef.current,
        utmGridLineLayer,
        utmLabelLayer,
      ],
      view: new View({
        center: fromLonLat([102.6, 17.97]),
        zoom: 7,
      }),
      controls: [],
    });

    setMapInstance(olMap.current);

    return () => {
      if (olMap.current) {
        olMap.current.setTarget(undefined);
        olMap.current.dispose();
      }
    };
  }, [setMapInstance]);

  // --- Effect to manage Base Layer Visibility and Opacity ---
  useEffect(() => {
    if (!olMap.current || !baseLayerStates) return;

    olMap.current.getLayers().forEach((layer) => {
      const layerName = layer.get("name");
      const state = baseLayerStates[layerName];
      if (state) {
        layer.setVisible(state.visible);
        layer.setOpacity(state.opacity);
      }
    });
  }, [baseLayerStates]);

  // --- Effect to update historical layer date ---
  useEffect(() => {
    if (!olMap.current) return;

    const layers = olMap.current.getLayers().getArray();
    const existingHistoricalLayer = layers.find(
      (layer) => layer.get("name") === "historicalLayer"
    );
    if (existingHistoricalLayer) {
      olMap.current.removeLayer(existingHistoricalLayer);
    }

    if (isHistoricalLayerActive) {
      const date = new Date(selectedDate);
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split("T")[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split("T")[0];
      const timeRange = `${firstDay}/${lastDay}`;

      const newHistoricalLayer = new TileLayer({
        name: "historicalLayer",
        visible: true,
        source: new TileWMS({
          url: "https://services.sentinel-hub.com/ogc/wms/1474cead-771e-410a-8d9d-0376f0376fc9",
          params: {
            LAYERS: "1_TRUE_COLOR",
            TIME: timeRange,
            MAXCC: 80,
          },
          crossOrigin: "anonymous",
        }),
      });

      olMap.current.addLayer(newHistoricalLayer);
      newHistoricalLayer.setZIndex(0);
    }
  }, [selectedDate, isHistoricalLayerActive]);

  // --- Effect to handle imported features ---
  useEffect(() => {
    if (!olMap.current) return;

    olMap.current
      .getLayers()
      .getArray()
      .filter((layer) => layer.get("isImportedLayer"))
      .forEach((layer) => olMap.current.removeLayer(layer));

    importedLayers.forEach((layerData) => {
      const vectorSource = new VectorSource({
        features: layerData.features,
      });
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        name: layerData.name,
        visible: layerData.visible,
        opacity: layerData.opacity,
        style: new Style({
          fill: new Fill({
            color: layerData.style?.fillColor || "rgba(255, 0, 255, 0.4)",
          }),
          stroke: new Stroke({
            color: layerData.style?.strokeColor || "#ff00ff",
            width: layerData.style?.strokeWidth || 3,
          }),
          image: new CircleStyle({
            radius: layerData.style?.pointSize || 7,
            fill: new Fill({ color: layerData.style?.pointColor || "#ff00ff" }),
          }),
        }),
      });
      vectorLayer.set("isImportedLayer", true);
      vectorLayer.set("id", layerData.id);

      olMap.current.addLayer(vectorLayer);
    });

    // **FIX**: Removed automatic zoom after import
    /*
      if (importedLayers.length > 0) {
          const latestLayer = importedLayers[0];
          if (latestLayer.features.length > 0) {
              const source = new VectorSource({ features: latestLayer.features });
              const extent = source.getExtent();
              olMap.current.getView().fit(extent, {
                  padding: [100, 100, 100, 100],
                  duration: 1000,
              });
          }
      }
      */
  }, [importedLayers]);

  // --- Coordinate and Scale Display Effect ---
  useEffect(() => {
    if (!olMap.current) return;
    const map = olMap.current;
    const pointerMoveHandler = (evt) => {
      if (evt.dragging) return;
      const coordinatesElement = document.getElementById("coordinates");
      if (!coordinatesElement) return;
      let displayText = "";
      if (graticuleType === "UTM") {
        const lonLat = toLonLat(evt.coordinate);
        const longitude = lonLat[0];
        const latitude = lonLat[1];
        const zone = Math.floor((longitude + 180) / 6) + 1;
        const hemisphere = latitude >= 0 ? "N" : "S";
        if (hemisphere === "N" && (zone === 47 || zone === 48)) {
          const utmProjection = `EPSG:326${zone}`;
          const utmCoords = transform(
            evt.coordinate,
            "EPSG:3857",
            utmProjection
          );
          displayText = `Zone ${zone}${hemisphere} ${utmCoords[0].toFixed(
            0
          )}m E ${utmCoords[1].toFixed(0)}m N`;
        } else {
          displayText = "UTM Zone N/A";
        }
      } else {
        const coord = toLonLat(evt.coordinate);
        displayText = `${coord[1].toFixed(4)}°, ${coord[0].toFixed(4)}°`;
      }
      coordinatesElement.textContent = displayText;
    };
    const resolutionChangeHandler = () => {
      const scaleElement = document.getElementById("scale");
      if (!scaleElement) return;
      const resolution = map.getView().getResolution();
      const units = map.getView().getProjection().getUnits();
      const dpi = 25.4 / 0.28;
      const mpu = METERS_PER_UNIT[units];
      const scale = resolution * mpu * 39.37 * dpi;
      scaleElement.textContent = "1:" + Math.round(scale).toLocaleString();
    };
    map.on("pointermove", pointerMoveHandler);
    map.getView().on("change:resolution", resolutionChangeHandler);
    resolutionChangeHandler();
    return () => {
      map.un("pointermove", pointerMoveHandler);
      map.getView().un("change:resolution", resolutionChangeHandler);
    };
  }, [graticuleType]);

  // --- Graticule Layer and Custom UTM Grid Effect ---
  useEffect(() => {
    if (!olMap.current) return;
    const map = olMap.current;

    const updateUtmGrid = () => {
      utmLabelSource.current.clear();
      utmGridLineSource.current.clear();
      const view = map.getView();
      const projection = view.getProjection();
      const extent = view.calculateExtent(map.getSize());
      const centerLonLat = toLonLat(getCenter(extent));
      const zone = Math.floor((centerLonLat[0] + 180) / 6) + 1;
      if (centerLonLat[1] < 0 || (zone !== 47 && zone !== 48)) return;
      const utmProjection = `EPSG:326${zone}`;
      const utmExtent = transformExtent(extent, projection, utmProjection);
      const interval = 2000;
      const labelFeatures = [];
      const lineFeatures = [];
      const textStyle = {
        font: "11px Arial",
        fill: new Fill({ color: "#444" }),
        stroke: new Stroke({ color: "rgba(255,255,255,0.8)", width: 2 }),
      };
      for (
        let n = Math.ceil(utmExtent[1] / interval) * interval;
        n <= utmExtent[3];
        n += interval
      ) {
        const labelText = `${n.toLocaleString()} N`;
        const pointLeft = transform(
          [utmExtent[0], n],
          utmProjection,
          projection
        );
        labelFeatures.push(
          new Feature({
            style: new Style({
              text: new Text({
                ...textStyle,
                text: labelText,
                textAlign: "left",
                offsetX: 5,
              }),
            }),
            geometry: new Point(pointLeft),
          })
        );
        const lineGeom = new LineString([
          transform([utmExtent[0], n], utmProjection, projection),
          transform([utmExtent[2], n], utmProjection, projection),
        ]);
        lineFeatures.push(new Feature({ geometry: lineGeom }));
      }
      for (
        let e = Math.ceil(utmExtent[0] / interval) * interval;
        e <= utmExtent[2];
        e += interval
      ) {
        const labelText = `${e.toLocaleString()} E`;
        const pointBottom = transform(
          [e, utmExtent[1]],
          utmProjection,
          projection
        );
        labelFeatures.push(
          new Feature({
            style: new Style({
              text: new Text({
                ...textStyle,
                text: labelText,
                textBaseline: "bottom",
                offsetY: -5,
              }),
            }),
            geometry: new Point(pointBottom),
          })
        );
        const lineGeom = new LineString([
          transform([e, utmExtent[1]], utmProjection, projection),
          transform([e, utmExtent[3]], utmProjection, projection),
        ]);
        lineFeatures.push(new Feature({ geometry: lineGeom }));
      }
      utmLabelSource.current.addFeatures(labelFeatures);
      utmGridLineSource.current.addFeatures(lineFeatures);
    };

    const cleanup = () => {
      if (graticuleLayer.current) {
        map.removeLayer(graticuleLayer.current);
        graticuleLayer.current = null;
      }
      utmLabelSource.current.clear();
      utmGridLineSource.current.clear();
      map.un("moveend", updateUtmGrid);
    };

    cleanup();

    if (graticuleEnabled) {
      if (graticuleType === "UTM") {
        map.on("moveend", updateUtmGrid);
        updateUtmGrid();
      } else {
        // WGS84
        graticuleLayer.current = new Graticule({
          strokeStyle: new Stroke({
            color: "rgba(255, 120, 0, 0.9)",
            width: 2,
            lineDash: [4, 4],
          }),
          showLabels: true,
          wrapX: false,
          lonLabelStyle: new Text({
            font: '12px "Open Sans"',
            fill: new Fill({ color: "rgba(230,230,230,1)" }),
            stroke: new Stroke({ color: "rgba(0,0,0,1)", width: 2 }),
          }),
          latLabelStyle: new Text({
            font: '12px "Open Sans"',
            fill: new Fill({ color: "rgba(230,230,230,1)" }),
            stroke: new Stroke({ color: "rgba(0,0,0,1)", width: 2 }),
          }),
        });
        map.addLayer(graticuleLayer.current);
        graticuleLayer.current.setZIndex(999);
      }
    }

    return cleanup;
  }, [graticuleEnabled, graticuleType]);

  // --- Tool Activation Effect using native OpenLayers Interactions ---
  useEffect(() => {
    if (!olMap.current) return;

    if (drawInteractionRef.current)
      olMap.current.removeInteraction(drawInteractionRef.current);
    if (modifyInteractionRef.current)
      olMap.current.removeInteraction(modifyInteractionRef.current);
    if (selectInteractionRef.current)
      olMap.current.removeInteraction(selectInteractionRef.current);

    const identifyClickListener = (evt) => {
      if (activeTool !== "identify") return;
      const features = [];
      olMap.current.forEachFeatureAtPixel(evt.pixel, (feature) => {
        features.push(feature);
      });
      if (features.length > 0) {
        const topFeature = features[0];
        const properties = topFeature.getProperties();
        onFeatureSelect({ attributes: properties, coordinate: evt.coordinate });
      } else {
        onFeatureSelect(null);
      }
    };

    switch (activeTool) {
      case "draw-point":
      case "draw-line":
      case "draw-polygon":
      case "draw-circle":
        const drawType = {
          "draw-point": "Point",
          "draw-line": "LineString",
          "draw-polygon": "Polygon",
          "draw-circle": "Circle",
        }[activeTool];

        drawInteractionRef.current = new Draw({
          source: vectorLayerRef.current.getSource(),
          type: drawType,
        });
        olMap.current.addInteraction(drawInteractionRef.current);
        break;

      case "edit":
        selectInteractionRef.current = new Select({
          condition: click,
          layers: [vectorLayerRef.current],
        });
        olMap.current.addInteraction(selectInteractionRef.current);

        modifyInteractionRef.current = new Modify({
          features: selectInteractionRef.current.getFeatures(),
        });
        olMap.current.addInteraction(modifyInteractionRef.current);
        break;

      case "identify":
        olMap.current.on("singleclick", identifyClickListener);
        break;

      case "pan":
      default:
        break;
    }

    return () => {
      if (olMap.current) {
        olMap.current.un("singleclick", identifyClickListener);
      }
    };
  }, [activeTool, onFeatureSelect]);

  return (
    <div className="map-container">
      <div
        ref={mapRef}
        id="map"
        style={{ width: "100%", height: "100%" }}
      ></div>
    </div>
  );
};

function transformExtent(extent, source, destination) {
  const B = transform([extent[0], extent[1]], source, destination);
  const T = transform([extent[2], extent[3]], source, destination);
  return [B[0], B[1], T[0], T[1]];
}

export default MapComponent;
