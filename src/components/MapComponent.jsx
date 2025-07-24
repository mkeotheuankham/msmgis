import React, { useEffect, useRef } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import ImageLayer from "ol/layer/Image";
import ImageStatic from "ol/source/ImageStatic";
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
import MultiPoint from "ol/geom/MultiPoint";
import Feature from "ol/Feature";
import { Draw, Modify, Select, Snap } from "ol/interaction";
import { click, pointerMove } from "ol/events/condition";
import Graticule from "ol/layer/Graticule";
import { Style, Fill, Stroke, Text, Circle as CircleStyle } from "ol/style";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { getArea, getLength } from "ol/sphere";
import { unByKey } from "ol/Observable";

import "./ui/MeasureTooltip.css";

// Register UTM projections for Laos
proj4.defs("EPSG:32647", "+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs");
proj4.defs("EPSG:32648", "+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs");
register(proj4);

const MapComponent = ({
  activeTool,
  setMapInstance,
  graticuleEnabled,
  graticuleType,
  importedLayers,
  baseLayerStates,
  onFeatureSelect,
  imageLayers,
}) => {
  const mapRef = useRef();
  const olMap = useRef(null);
  const drawInteractionRef = useRef(null);
  const modifyInteractionRef = useRef(null);
  const selectClickInteractionRef = useRef(null);
  const snapInteractionRef = useRef(null);
  const hoverInteractionRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const graticuleLayer = useRef(null);
  const utmLabelSource = useRef(new VectorSource());
  const utmGridLineSource = useRef(new VectorSource());
  const selectionMeasureLayerRef = useRef(null);
  const identifyListenerKey = useRef(null);
  const geometryListenerKeys = useRef({});

  const snapSourceRef = useRef(new VectorSource());

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
          url: "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.jpg",
          maxZoom: 20,
          attributions: [
            "© CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data)",
            '© <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>',
            '© <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>',
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          ].join(" | "),
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

    selectionMeasureLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      name: "selectionMeasureLayer",
      style: new Style({
        image: new CircleStyle({ radius: 0 }),
        stroke: new Stroke({ width: 0 }),
      }),
      zIndex: 1001,
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
        selectionMeasureLayerRef.current,
        utmGridLineLayer,
        utmLabelLayer,
      ],
      view: new View({ center: fromLonLat([102.6, 17.97]), zoom: 7 }),
      controls: [],
      contextOptions: { willReadFrequently: true },
    });

    setMapInstance(olMap.current);

    return () => {
      if (olMap.current) {
        olMap.current.setTarget(undefined);
        olMap.current.dispose();
      }
    };
  }, [setMapInstance]);

  // --- Layer Management Effect ---
  useEffect(() => {
    if (!olMap.current) return;

    // **ແກ້ໄຂ:** ນຳ logic ການຈັດການ basemap ແບບເດີມກັບຄືນມາ
    olMap.current.getLayers().forEach((layer) => {
      const layerName = layer.get("name");
      const state = baseLayerStates[layerName];
      // Check if it's a base layer (TileLayer with a name and state)
      if (layer instanceof TileLayer && layerName && state) {
        layer.setVisible(state.visible);
        layer.setOpacity(state.opacity);
      }
    });

    // Imported Vector Layers
    olMap.current
      .getLayers()
      .getArray()
      .filter((l) => l.get("isImportedLayer"))
      .forEach((l) => olMap.current.removeLayer(l));
    if (importedLayers) {
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
              fill: new Fill({
                color: layerData.style?.pointColor || "#ff00ff",
              }),
            }),
          }),
        });
        vectorLayer.set("isImportedLayer", true);
        vectorLayer.set("id", layerData.id);
        olMap.current.addLayer(vectorLayer);
      });
    }

    // Image Layers
    olMap.current
      .getLayers()
      .getArray()
      .filter((l) => l.get("isImageLayer"))
      .forEach((l) => olMap.current.removeLayer(l));
    if (imageLayers) {
      imageLayers.forEach((layerData) => {
        const imageLayer = new ImageLayer({
          source: new ImageStatic({
            url: layerData.url,
            imageExtent: layerData.extent,
            projection: "EPSG:3857",
          }),
          opacity: layerData.opacity,
          visible: layerData.visible,
        });
        imageLayer.set("isImageLayer", true);
        imageLayer.set("id", layerData.id);
        imageLayer.set("name", layerData.name);
        olMap.current.addLayer(imageLayer);
      });
    }
  }, [baseLayerStates, importedLayers, imageLayers]);

  // --- Other Effects (Coordinates, Graticule) ---
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
        const zone = Math.floor((lonLat[0] + 180) / 6) + 1;
        if (lonLat[1] >= 0 && (zone === 47 || zone === 48)) {
          const utmProjection = `EPSG:326${zone}`;
          const utmCoords = transform(
            evt.coordinate,
            "EPSG:3857",
            utmProjection
          );
          displayText = `Zone ${zone}N ${utmCoords[0].toFixed(
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
      );
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

  // --- Tool Activation Effect ---
  useEffect(() => {
    if (!olMap.current) return;
    const map = olMap.current;

    // --- Cleanup previous interactions, overlays, and cursor ---
    if (drawInteractionRef.current)
      map.removeInteraction(drawInteractionRef.current);
    if (modifyInteractionRef.current)
      map.removeInteraction(modifyInteractionRef.current);
    if (selectClickInteractionRef.current)
      map.removeInteraction(selectClickInteractionRef.current);
    if (hoverInteractionRef.current)
      map.removeInteraction(hoverInteractionRef.current);
    if (snapInteractionRef.current) {
      map.removeInteraction(snapInteractionRef.current);
      snapInteractionRef.current = null;
    }
    if (identifyListenerKey.current) {
      unByKey(identifyListenerKey.current);
      identifyListenerKey.current = null;
    }
    const mapElement = map.getTargetElement();
    if (mapElement) {
      mapElement.style.cursor = "";
    }
    if (selectionMeasureLayerRef.current) {
      selectionMeasureLayerRef.current.getSource().clear();
    }
    snapSourceRef.current.clear();

    // --- Helper Functions ---
    const formatLength = (line) => {
      const length = getLength(line, { projection: "EPSG:3857" });
      return length > 1000
        ? `${(length / 1000).toFixed(2)} km`
        : `${length.toFixed(2)} m`;
    };

    const formatArea = (polygon) => {
      const area = getArea(polygon, { projection: "EPSG:3857" });
      const areaInHa = area / 10000;
      const remainingM2 = area % 10000;
      return area >= 10000
        ? `${Math.floor(areaInHa)} ha ${remainingM2.toFixed(0)} m²`
        : `${area.toFixed(2)} m²`;
    };

    const createTextStyle = (text, placement = "point") => {
      const styleOptions = {
        text: text,
        font: 'bold 12px "Open Sans", sans-serif',
        fill: new Fill({ color: "#333" }),
        stroke: new Stroke({ color: "rgba(255, 255, 255, 0.9)", width: 4 }),
        overflow: true,
      };
      if (placement === "line") {
        styleOptions.placement = "line";
        styleOptions.textBaseline = "bottom";
        styleOptions.offsetY = -1;
      } else {
        styleOptions.placement = "point";
      }
      return new Style({ text: new Text(styleOptions) });
    };

    const identifyClickListener = (evt) => {
      const features = [];
      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (
          layer &&
          layer.get("name") !== "selectionMeasureLayer" &&
          !layer.get("isImageLayer")
        ) {
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

    const selectionStyle = [
      new Style({
        stroke: new Stroke({ color: "#0d6efd", width: 3 }),
        fill: new Fill({ color: "rgba(13, 110, 253, 0.1)" }),
      }),
      new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color: "white" }),
          stroke: new Stroke({ color: "#0d6efd", width: 2 }),
        }),
        geometry: (feature) => {
          const geom = feature.getGeometry();
          if (geom instanceof Polygon) {
            return new MultiPoint(geom.getCoordinates()[0]);
          } else if (geom instanceof LineString) {
            return new MultiPoint(geom.getCoordinates());
          }
          return null;
        },
      }),
    ];

    const setupSnap = () => {
      snapSourceRef.current.clear();
      const featuresToSnap = [];
      map
        .getLayers()
        .getArray()
        .forEach((layer) => {
          if (layer instanceof VectorLayer && layer.getSource()) {
            const isEditorLayer = layer.get("name") === "editorLayer";
            const isImportedLayer = layer.get("isImportedLayer");
            if ((isEditorLayer || isImportedLayer) && layer.getVisible()) {
              featuresToSnap.push(...layer.getSource().getFeatures());
            }
          }
        });
      snapSourceRef.current.addFeatures(featuresToSnap);

      if (!snapInteractionRef.current) {
        snapInteractionRef.current = new Snap({
          source: snapSourceRef.current,
          pixelTolerance: 15,
          vertex: true,
          edge: true,
        });
        map.addInteraction(snapInteractionRef.current);
      }
    };

    const updateDrawingMeasureLabels = (geometry) => {
      const measureSource = selectionMeasureLayerRef.current.getSource();
      const oldLabels = measureSource
        .getFeatures()
        .filter((f) => f.get("label_type") === "drawing");
      oldLabels.forEach((label) => measureSource.removeFeature(label));

      if (!geometry) return;

      const newLabelFeatures = [];
      if (geometry instanceof Polygon) {
        const areaText = formatArea(geometry);
        const areaPoint = new Feature(geometry.getInteriorPoint());
        areaPoint.setStyle(createTextStyle(areaText, "point"));
        areaPoint.set("label_type", "drawing");
        newLabelFeatures.push(areaPoint);

        const coords = geometry.getCoordinates()[0];
        for (let i = 0; i < coords.length - 1; i++) {
          const segment = new LineString([coords[i], coords[i + 1]]);
          const lengthText = formatLength(segment);
          const segmentFeature = new Feature(segment);
          segmentFeature.setStyle(createTextStyle(lengthText, "line"));
          segmentFeature.set("label_type", "drawing");
          newLabelFeatures.push(segmentFeature);
        }
      } else if (geometry instanceof LineString) {
        const lengthText = formatLength(geometry);
        const lineFeature = new Feature(geometry);
        lineFeature.setStyle(createTextStyle(lengthText, "line"));
        lineFeature.set("label_type", "drawing");
        newLabelFeatures.push(lineFeature);
      }
      measureSource.addFeatures(newLabelFeatures);
    };

    // --- Hover Interaction Setup ---
    if (activeTool === "pan" || activeTool === "identify") {
      const hoverStyle = new Style({
        fill: new Fill({ color: "rgba(0, 170, 255, 0.4)" }),
        stroke: new Stroke({ color: "#00aaff", width: 4 }),
        image: new CircleStyle({
          radius: 9,
          fill: new Fill({ color: "#00aaff" }),
          stroke: new Stroke({ color: "#ffffff", width: 2 }),
        }),
      });
      hoverInteractionRef.current = new Select({
        condition: pointerMove,
        style: hoverStyle,
        layers: (layer) =>
          layer.get("isImportedLayer") || layer.get("name") === "editorLayer",
      });
      map.addInteraction(hoverInteractionRef.current);
      const pointerMoveHandler = (e) => {
        if (e.dragging) return;
        const pixel = map.getEventPixel(e.originalEvent);
        const hit = map.hasFeatureAtPixel(pixel, {
          layerFilter: (layer) =>
            layer.get("isImportedLayer") || layer.get("name") === "editorLayer",
        });
        map.getTargetElement().style.cursor = hit ? "pointer" : "";
      };
      map.on("pointermove", pointerMoveHandler);
    }

    // --- Main Tool Switch ---
    switch (activeTool) {
      case "draw-point":
      case "draw-line":
      case "draw-polygon":
      case "draw-circle": {
        setupSnap();
        const drawType = {
          "draw-point": "Point",
          "draw-line": "LineString",
          "draw-polygon": "Polygon",
          "draw-circle": "Circle",
        }[activeTool];

        const sketchStyle = new Style({
          fill: new Fill({
            color: "rgba(0, 118, 255, 0.1)",
          }),
          stroke: new Stroke({
            color: "#007bff",
            width: 3,
          }),
        });

        const vertexStyle = new Style({
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({
              color: "white",
            }),
            stroke: new Stroke({
              color: "#007bff",
              width: 2,
            }),
          }),
          geometry: (feature) => {
            const geom = feature.getGeometry();
            let coordinates;
            if (geom instanceof Polygon) {
              coordinates = geom.getCoordinates()[0];
            } else if (geom instanceof LineString) {
              coordinates = geom.getCoordinates();
            } else {
              return null;
            }
            return new MultiPoint(coordinates);
          },
        });

        const drawStyleFunction = (feature) => {
          const geomType = feature.getGeometry().getType();
          if (geomType === "Point" || geomType === "Circle") {
            return sketchStyle;
          }
          return [sketchStyle, vertexStyle];
        };

        drawInteractionRef.current = new Draw({
          source: vectorLayerRef.current.getSource(),
          type: drawType,
          style: drawStyleFunction,
        });

        let drawingListenerKey = null;
        drawInteractionRef.current.on("drawstart", (evt) => {
          const sketchFeature = evt.feature;
          drawingListenerKey = sketchFeature
            .getGeometry()
            .on("change", (geomEvt) => {
              updateDrawingMeasureLabels(geomEvt.target);
            });
        });

        drawInteractionRef.current.on("drawend", (evt) => {
          evt.feature.setStyle(null);
          updateDrawingMeasureLabels(null);
          unByKey(drawingListenerKey);
          drawingListenerKey = null;
          snapSourceRef.current.addFeature(evt.feature);
        });

        drawInteractionRef.current.on("drawabort", () => {
          updateDrawingMeasureLabels(null);
          if (drawingListenerKey) {
            unByKey(drawingListenerKey);
          }
          drawingListenerKey = null;
        });

        map.addInteraction(drawInteractionRef.current);
        break;
      }
      case "edit": {
        setupSnap();
        const select = new Select({
          condition: click,
          style: selectionStyle,
          layers: (layer) =>
            layer.get("isImportedLayer") || layer.get("name") === "editorLayer",
        });
        map.addInteraction(select);
        selectClickInteractionRef.current = select;

        modifyInteractionRef.current = new Modify({
          features: select.getFeatures(),
        });

        modifyInteractionRef.current.on("modifyend", setupSnap);

        map.addInteraction(modifyInteractionRef.current);

        const measureSource = selectionMeasureLayerRef.current.getSource();

        const updateMeasureLabels = (feature) => {
          if (!feature) return;

          const oldLabels = measureSource
            .getFeatures()
            .filter((f) => f.get("parent_id") === feature.ol_uid);
          oldLabels.forEach((label) => measureSource.removeFeature(label));

          const geom = feature.getGeometry();
          const newLabelFeatures = [];

          if (geom instanceof Polygon) {
            const areaText = formatArea(geom);
            const areaPoint = new Feature(geom.getInteriorPoint());
            areaPoint.setStyle(createTextStyle(areaText, "point"));
            areaPoint.set("parent_id", feature.ol_uid);
            newLabelFeatures.push(areaPoint);

            const coords = geom.getCoordinates()[0];
            for (let i = 0; i < coords.length - 1; i++) {
              const segment = new LineString([coords[i], coords[i + 1]]);
              const lengthText = formatLength(segment);
              const segmentFeature = new Feature(segment);
              segmentFeature.setStyle(createTextStyle(lengthText, "line"));
              segmentFeature.set("parent_id", feature.ol_uid);
              newLabelFeatures.push(segmentFeature);
            }
          } else if (geom instanceof LineString) {
            const lengthText = formatLength(geom);
            const lineFeature = new Feature(geom);
            lineFeature.setStyle(createTextStyle(lengthText, "line"));
            lineFeature.set("parent_id", feature.ol_uid);
            newLabelFeatures.push(lineFeature);
          }
          measureSource.addFeatures(newLabelFeatures);
        };

        select.getFeatures().on("add", (event) => {
          const feature = event.element;
          updateMeasureLabels(feature);

          const listenerKey = feature.getGeometry().on("change", () => {
            updateMeasureLabels(feature);
          });
          geometryListenerKeys.current[feature.ol_uid] = listenerKey;
        });

        select.getFeatures().on("remove", (event) => {
          const feature = event.element;

          const labelsToRemove = measureSource
            .getFeatures()
            .filter((f) => f.get("parent_id") === feature.ol_uid);
          labelsToRemove.forEach((label) => measureSource.removeFeature(label));

          const listenerKey = geometryListenerKeys.current[feature.ol_uid];
          if (listenerKey) {
            unByKey(listenerKey);
            delete geometryListenerKeys.current[feature.ol_uid];
          }
        });
        break;
      }
      case "identify":
        if (mapElement) {
          mapElement.style.cursor = "help";
        }
        identifyListenerKey.current = map.on(
          "singleclick",
          identifyClickListener
        );
        break;
      default:
        break;
    }
  }, [activeTool, onFeatureSelect, importedLayers, baseLayerStates]); // **ເພີ່ມ:** baseLayerStates ເຂົ້າໄປໃນ dependency array

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
