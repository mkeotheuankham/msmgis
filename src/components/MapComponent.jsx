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
  transformExtent,
} from "ol/proj";
import { getCenter } from "ol/extent";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import Polygon from "ol/geom/Polygon";
import Feature from "ol/Feature";
import { Draw, Modify, Select } from "ol/interaction";
import { click } from "ol/events/condition";
import Graticule from "ol/layer/Graticule";
import { Style, Fill, Stroke, Text, Circle as CircleStyle } from "ol/style";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import TileWMS from "ol/source/TileWMS";
import { getArea, getLength } from "ol/sphere";
import Overlay from "ol/Overlay";
import { unByKey } from "ol/Observable";

// Import custom styles for the measurement tool
import "./ui/MeasureTooltip.css";

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
  const vectorLayerRef = useRef(null); // For user drawings
  const measureLayerRef = useRef(null); // For measurement drawings
  const graticuleLayer = useRef(null);
  const utmLabelSource = useRef(new VectorSource());
  const utmGridLineSource = useRef(new VectorSource());
  const measureTooltipRef = useRef(null); // For measurement tooltips

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
    measureLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      name: "measureLayer",
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
        measureLayerRef.current,
        utmGridLineLayer,
        utmLabelLayer,
      ],
      view: new View({ center: fromLonLat([102.6, 17.97]), zoom: 7 }),
      controls: [],
      // **ການແກ້ໄຂ:** ເພີ່ມ option ນີ້ເພື່ອປັບປຸງປະສິດທິພາບ
      contextOptions: {
        willReadFrequently: true,
      },
    });

    setMapInstance(olMap.current);

    // Create the initial tooltip for measurements
    const tooltipElement = document.createElement("div");
    tooltipElement.className = "ol-tooltip ol-tooltip-measure";
    const tooltip = new Overlay({
      element: tooltipElement,
      offset: [0, -15],
      positioning: "bottom-center",
    });
    olMap.current.addOverlay(tooltip);
    measureTooltipRef.current = { overlay: tooltip, element: tooltipElement };

    return () => {
      if (olMap.current) {
        olMap.current.setTarget(undefined);
        olMap.current.dispose();
      }
    };
  }, [setMapInstance]);

  // --- Effect to manage Base, Historical, and Imported Layers ---
  useEffect(() => {
    if (!olMap.current) return;

    // Base Layers
    olMap.current.getLayers().forEach((layer) => {
      const layerName = layer.get("name");
      const state = baseLayerStates[layerName];
      if (state) {
        layer.setVisible(state.visible);
        layer.setOpacity(state.opacity);
      }
    });

    // Historical Layer
    const existingHistoricalLayer = olMap.current
      .getLayers()
      .getArray()
      .find((l) => l.get("name") === "historicalLayer");
    if (existingHistoricalLayer)
      olMap.current.removeLayer(existingHistoricalLayer);
    if (isHistoricalLayerActive) {
      const date = new Date(selectedDate);
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split("T")[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split("T")[0];
      const timeRange = `${firstDay}/${lastDay}`;
      const newHistoricalLayer = new TileLayer({
        name: "sentinel 2",
        visible: true,
        source: new TileWMS({
          url: "https://services.sentinel-hub.com/ogc/wms/5aadfeac-8c28-45a4-8f5e-d6341e60fab5", // Note: This is a public test ID
          params: {
            LAYERS: "2_TONEMAPPED_NATURAL_COLOR",
            TIME: timeRange,
            MAXCC: 80,
          },
          crossOrigin: "anonymous",
        }),
      });
      olMap.current.addLayer(newHistoricalLayer);
      newHistoricalLayer.setZIndex(0);
    }

    // Imported Layers
    olMap.current
      .getLayers()
      .getArray()
      .filter((l) => l.get("isImportedLayer"))
      .forEach((l) => olMap.current.removeLayer(l));
    importedLayers.forEach((layerData) => {
      const vectorLayer = new VectorLayer({
        source: new VectorSource({ features: layerData.features }),
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
  }, [baseLayerStates, selectedDate, isHistoricalLayerActive, importedLayers]);

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
      const interval = Math.pow(
        10,
        Math.floor(Math.log10(view.getResolution() * 500))
      ); // Dynamic interval
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
        labelFeatures.push(
          new Feature({
            style: new Style({
              text: new Text({
                ...textStyle,
                text: `${n.toLocaleString()} N`,
                textAlign: "left",
                offsetX: 5,
              }),
            }),
            geometry: new Point(
              transform([utmExtent[0], n], utmProjection, projection)
            ),
          })
        );
        lineFeatures.push(
          new Feature({
            geometry: new LineString([
              transform([utmExtent[0], n], utmProjection, projection),
              transform([utmExtent[2], n], utmProjection, projection),
            ]),
          })
        );
      }
      for (
        let e = Math.ceil(utmExtent[0] / interval) * interval;
        e <= utmExtent[2];
        e += interval
      ) {
        labelFeatures.push(
          new Feature({
            style: new Style({
              text: new Text({
                ...textStyle,
                text: `${e.toLocaleString()} E`,
                textBaseline: "bottom",
                offsetY: -5,
              }),
            }),
            geometry: new Point(
              transform([e, utmExtent[1]], utmProjection, projection)
            ),
          })
        );
        lineFeatures.push(
          new Feature({
            geometry: new LineString([
              transform([e, utmExtent[1]], utmProjection, projection),
              transform([e, utmExtent[3]], utmProjection, projection),
            ]),
          })
        );
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

  // --- Tool Activation Effect (MERGED) ---
  useEffect(() => {
    if (!olMap.current) return;
    const map = olMap.current;

    // --- 1. Cleanup previous interactions and listeners ---
    if (drawInteractionRef.current)
      map.removeInteraction(drawInteractionRef.current);
    if (modifyInteractionRef.current)
      map.removeInteraction(modifyInteractionRef.current);
    if (selectInteractionRef.current)
      map.removeInteraction(selectInteractionRef.current);
    const identifyListeners = map.getListeners("singleclick");
    if (identifyListeners) identifyListeners.length = 0;

    // --- 2. Cleanup measurement artifacts ---
    measureLayerRef.current.getSource().clear();
    const overlays = map.getOverlays();
    while (overlays.getLength() > 1) {
      overlays.removeAt(1);
    }
    const mainTooltipOverlay = overlays.item(0);
    if (mainTooltipOverlay) {
      const mainTooltipElement = mainTooltipOverlay.getElement();
      mainTooltipElement.className = "ol-tooltip ol-tooltip-measure";
      mainTooltipOverlay.setPosition(undefined);
    }

    // --- 3. Define tool logic ---
    let sketch;
    let listener;
    const formatLength = (line) => {
      const length = getLength(line, { projection: "EPSG:3857" });
      return length > 100
        ? `${(length / 1000).toFixed(2)} km`
        : `${length.toFixed(2)} m`;
    };
    const formatArea = (polygon) => {
      const area = getArea(polygon, { projection: "EPSG:3857" });
      return area > 10000
        ? `${(area / 1000000).toFixed(2)} km²`
        : `${area.toFixed(2)} m²`;
    };
    const addMeasureInteraction = (type) => {
      const draw = new Draw({
        source: measureLayerRef.current.getSource(),
        type: type,
        style: new Style({
          fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.5)",
            lineDash: [10, 10],
            width: 2,
          }),
          image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({ color: "rgba(0, 0, 0, 0.7)" }),
          }),
        }),
      });
      map.addInteraction(draw);
      drawInteractionRef.current = draw;

      draw.on("drawstart", (evt) => {
        sketch = evt.feature;
        listener = sketch.getGeometry().on("change", (e) => {
          const geom = e.target;
          const output =
            geom instanceof Polygon ? formatArea(geom) : formatLength(geom);
          const tooltipCoord =
            geom instanceof Polygon
              ? geom.getInteriorPoint().getCoordinates()
              : geom.getLastCoordinate();
          measureTooltipRef.current.element.innerHTML = output;
          measureTooltipRef.current.overlay.setPosition(tooltipCoord);
        });
      });

      draw.on("drawend", (evt) => {
        const staticTooltipElement = document.createElement("div");
        staticTooltipElement.className = "ol-tooltip ol-tooltip-static";
        staticTooltipElement.innerHTML =
          measureTooltipRef.current.element.innerHTML;
        const geom = evt.feature.getGeometry();
        const position =
          geom instanceof Polygon
            ? geom.getInteriorPoint().getCoordinates()
            : geom.getLastCoordinate();
        const staticTooltip = new Overlay({
          element: staticTooltipElement,
          offset: [0, -7],
          positioning: "bottom-center",
          position: position,
        });
        map.addOverlay(staticTooltip);
        unByKey(listener);
        sketch = null;
      });
    };
    const identifyClickListener = (evt) => {
      const features = [];
      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (layer !== measureLayerRef.current) {
          // Ignore measurement features
          features.push(feature);
        }
      });
      onFeatureSelect(
        features.length > 0
          ? {
              attributes: features[0].getProperties(),
              coordinate: evt.coordinate,
            }
          : null
      );
    };

    // --- 4. Activate new tool ---
    switch (activeTool) {
      case "draw-point":
      case "draw-line":
      case "draw-polygon":
      case "draw-circle": {
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
        map.addInteraction(drawInteractionRef.current);
        break;
      }
      case "edit": {
        selectInteractionRef.current = new Select({
          condition: click,
          layers: [vectorLayerRef.current],
        });
        map.addInteraction(selectInteractionRef.current);
        modifyInteractionRef.current = new Modify({
          features: selectInteractionRef.current.getFeatures(),
        });
        map.addInteraction(modifyInteractionRef.current);
        break;
      }
      case "measure-distance":
        addMeasureInteraction("LineString");
        break;
      case "measure-area":
        addMeasureInteraction("Polygon");
        break;
      case "identify":
        map.on("singleclick", identifyClickListener);
        break;
      case "pan":
      default:
        break;
    }
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

export default MapComponent;
