import { useEffect, useRef, useCallback } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Draw, Modify, Select, Snap } from "ol/interaction";
import { click, pointerMove } from "ol/events/condition";
import { Style, Fill, Stroke, Text, Circle as CircleStyle } from "ol/style";
import { getArea, getLength } from "ol/sphere";
import { unByKey } from "ol/Observable";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import Polygon from "ol/geom/Polygon";
import MultiPoint from "ol/geom/MultiPoint";

export const useMapInteractions = (
  olMap,
  activeTool,
  vectorLayerRef,
  selectionMeasureLayerRef,
  handleFeatureSelect,
  historyManagerRef,
  updateHistoryButtons,
  setActiveTool,
  importedLayers
) => {
  const drawInteractionRef = useRef(null);
  const modifyInteractionRef = useRef(null);
  const selectClickInteractionRef = useRef(null);
  const snapInteractionRef = useRef(null);
  const hoverInteractionRef = useRef(null);
  const identifyListenerKey = useRef(null);
  const geometryListenerKeys = useRef({});
  const snapSourceRef = useRef(null);
  const pointerMoveCursorListenerRef = useRef(null);
  const sketchFeatureRef = useRef(null);
  const drawingListenerKeyRef = useRef(null);

  const formatLength = useCallback((line) => {
    const length = getLength(line, { projection: "EPSG:3857" });
    return length > 1000
      ? `${(length / 1000).toFixed(2)} km`
      : `${length.toFixed(2)} m`;
  }, []);

  const formatArea = useCallback((polygon) => {
    const area = getArea(polygon, { projection: "EPSG:3857" });
    const areaInHa = area / 10000;
    const remainingM2 = area % 10000;
    return area >= 10000
      ? `${Math.floor(areaInHa)} ha ${remainingM2.toFixed(0)} m²`
      : `${area.toFixed(2)} m²`;
  }, []);

  const createTextStyle = useCallback((text, placement = "point") => {
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
  }, []);

  const updateDrawingMeasureLabels = useCallback(
    (geometry) => {
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
    },
    [formatArea, createTextStyle, formatLength, selectionMeasureLayerRef]
  );

  useEffect(() => {
    if (!olMap.current) return;
    const map = olMap.current;
    const mapElement = map.getTargetElement();

    const cleanup = () => {
      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current);
        drawInteractionRef.current = null;
      }
      if (modifyInteractionRef.current) {
        map.removeInteraction(modifyInteractionRef.current);
        modifyInteractionRef.current = null;
      }
      if (selectClickInteractionRef.current) {
        map.removeInteraction(selectClickInteractionRef.current);
        selectClickInteractionRef.current = null;
      }
      if (hoverInteractionRef.current) {
        map.removeInteraction(hoverInteractionRef.current);
        hoverInteractionRef.current = null;
      }
      if (snapInteractionRef.current) {
        map.removeInteraction(snapInteractionRef.current);
        snapInteractionRef.current = null;
      }
      if (identifyListenerKey.current) {
        unByKey(identifyListenerKey.current);
        identifyListenerKey.current = null;
      }
      if (pointerMoveCursorListenerRef.current) {
        unByKey(pointerMoveCursorListenerRef.current);
        pointerMoveCursorListenerRef.current = null;
      }
      if (drawingListenerKeyRef.current) {
        unByKey(drawingListenerKeyRef.current);
        drawingListenerKeyRef.current = null;
      }

      Object.keys(geometryListenerKeys.current).forEach((key) => {
        unByKey(geometryListenerKeys.current[key]);
      });
      geometryListenerKeys.current = {};

      selectionMeasureLayerRef.current.getSource().clear();
      sketchFeatureRef.current = null;
      if (mapElement) {
        mapElement.style.cursor = "";
      }

      document.removeEventListener("keydown", handleKeyDown);
    };

    const saveHistoryState = () => {
      if (historyManagerRef.current && vectorLayerRef.current) {
        const features = vectorLayerRef.current.getSource().getFeatures();
        historyManagerRef.current.addState(features);
        updateHistoryButtons();
      }
    };

    const setupSnap = () => {
      if (snapInteractionRef.current) {
        map.removeInteraction(snapInteractionRef.current);
      }

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

      // We don't need to create a new source every time, but for simplicity we follow original logic
      // Ideally we should have a dedicated snap source that updates.
      // Here we just use the features found.
      const newSnapSource = new VectorSource({ features: featuresToSnap });
      snapSourceRef.current = newSnapSource; // Keep ref if needed

      snapInteractionRef.current = new Snap({
        source: newSnapSource,
        pixelTolerance: 15,
        vertex: true,
        edge: true,
      });
      map.addInteraction(snapInteractionRef.current);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        const selectInteraction = selectClickInteractionRef.current;
        if (selectInteraction) {
          const selectedFeatures = selectInteraction.getFeatures();
          if (selectedFeatures.getLength() > 0) {
            const source = vectorLayerRef.current.getSource();
            selectedFeatures.forEach((feature) =>
              source.removeFeature(feature)
            );
            selectedFeatures.clear();
            saveHistoryState();
            setupSnap();
          }
        }
      }
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
      handleFeatureSelect(
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

        const source = vectorLayerRef.current.getSource();
        drawInteractionRef.current = new Draw({
          source: source,
          type: drawType,
          style: drawStyleFunction,
        });

        drawInteractionRef.current.on("drawstart", ({ feature }) => {
          source.clear();

          const sketchFeature = feature;
          drawingListenerKeyRef.current = sketchFeature
            .getGeometry()
            .on("change", (geomEvt) => {
              updateDrawingMeasureLabels(geomEvt.target);
            });
        });

        drawInteractionRef.current.on("drawend", () => {
          updateDrawingMeasureLabels(null);
          unByKey(drawingListenerKeyRef.current);
          drawingListenerKeyRef.current = null;
          setupSnap();
          saveHistoryState();
        });

        drawInteractionRef.current.on("drawabort", () => {
          updateDrawingMeasureLabels(null);
          if (drawingListenerKeyRef.current) {
            unByKey(drawingListenerKeyRef.current);
          }
          drawingListenerKeyRef.current = null;
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

        modifyInteractionRef.current.on("modifyend", () => {
          setupSnap();
          saveHistoryState();
        });

        map.addInteraction(modifyInteractionRef.current);

        document.addEventListener("keydown", handleKeyDown);

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
            const lineFeature = new Feature(geometry);
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
      case "identify": {
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
              layer.get("isImportedLayer") ||
              layer.get("name") === "editorLayer",
          });
          map.getTargetElement().style.cursor = hit ? "pointer" : "";
        };
        pointerMoveCursorListenerRef.current = map.on(
          "pointermove",
          pointerMoveHandler
        );

        identifyListenerKey.current = map.on(
          "singleclick",
          identifyClickListener
        );
        break;
      }
      case "pan": {
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
              layer.get("isImportedLayer") ||
              layer.get("name") === "editorLayer",
          });
          map.getTargetElement().style.cursor = hit ? "pointer" : "";
        };
        pointerMoveCursorListenerRef.current = map.on(
          "pointermove",
          pointerMoveHandler
        );
        break;
      }
      default:
        break;
    }

    return cleanup;
  }, [
    activeTool,
    handleFeatureSelect,
    importedLayers,
    historyManagerRef,
    updateHistoryButtons,
    setActiveTool,
    formatArea,
    formatLength,
    createTextStyle,
    updateDrawingMeasureLabels,
    olMap,
    vectorLayerRef,
    selectionMeasureLayerRef,
  ]);
};
