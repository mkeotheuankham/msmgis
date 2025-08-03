import React, { useEffect, useRef, useCallback } from "react";
import { Draw } from "ol/interaction";
import { Style, Stroke, Fill, Text, Circle as CircleStyle } from "ol/style";
import { unByKey } from "ol/Observable";
import { LineString, Point, Polygon } from "ol/geom";
import { getLength, getArea } from "ol/sphere";
import Feature from "ol/Feature";

const MeasureTool = ({ map, activeTool, selectionMeasureLayer }) => {
  // Refs to hold mutable objects without triggering re-renders
  const drawInteractionRef = useRef(null);
  const sketchFeatureRef = useRef(null);
  const drawingListenerKeyRef = useRef(null);

  // Get the source from the selection/measure layer
  const source = selectionMeasureLayer.getSource();

  // Helper function to format line length
  const formatLength = useCallback((line) => {
    const length = getLength(line, { projection: "EPSG:3857" });
    return length > 1000
      ? `${(length / 1000).toFixed(2)} km`
      : `${length.toFixed(2)} m`;
  }, []);

  // Helper function to format polygon area
  const formatArea = useCallback((polygon) => {
    const area = getArea(polygon, { projection: "EPSG:3857" });
    const areaInHa = area / 10000;
    const remainingM2 = area % 10000;
    return area >= 10000
      ? `Area: ${Math.floor(areaInHa)} ha ${remainingM2.toFixed(0)} m²`
      : `Area: ${area.toFixed(2)} m²`;
  }, []);

  // Updated helper function to create a text style for the measure labels (segments)
  // ປັບປຸງ: ເພື່ອໃຫ້ປ້າຍຊື່ສະແດງຢູ່ເທິງເສັ້ນ ພ້ອມພື້ນຫຼັງສີຂາວ
  const createMeasureStyle = useCallback((text) => {
    return new Style({
      text: new Text({
        text: text,
        font: 'bold 12px "Open Sans", sans-serif',
        fill: new Fill({ color: "black" }),
        stroke: new Stroke({ color: "white", width: 3 }), // ໃຊ້ stroke ສີຂາວເພື່ອເຮັດເປັນຂອບຂອງພື້ນຫຼັງ
        backgroundFill: new Fill({ color: "white" }), // ພື້ນຫຼັງສີຂາວ
        padding: [4, 8, 4, 8],
        overflow: true,
        placement: "line", // ປ້າຍຊື່ຈະຖືກວາງຕາມເສັ້ນ
        textBaseline: "bottom", // ວາງປ້າຍຊື່ໄວ້ເທິງເສັ້ນ
      }),
    });
  }, []);

  // Updated helper function to create a text style for the total length
  // ປັບປຸງ: ປ້າຍຊື່ໄລຍະທາງລວມເປັນຕົວໜັງສືສີແດງ ແລະ ບໍ່ມີພື້ນຫຼັງ
  const createTotalLengthStyle = useCallback((text) => {
    return new Style({
      text: new Text({
        text: text,
        font: 'bold 14px "Open Sans", sans-serif',
        fill: new Fill({ color: "red" }), // ປ່ຽນຕົວອັກສອນເປັນສີແດງ
        // ເອົາ backgroundFill ແລະ stroke ອອກ
        padding: [6, 12, 6, 12],
        overflow: true,
        textAlign: "center",
      }),
    });
  }, []);

  // Function to update the measure labels on the map
  const updateDrawingMeasureLabels = useCallback(
    (geometry) => {
      const measureSource = selectionMeasureLayer.getSource();
      // Remove old drawing labels to avoid duplicates
      const oldLabels = measureSource
        .getFeatures()
        .filter((f) => f.get("label_type") === "drawing");
      oldLabels.forEach((label) => measureSource.removeFeature(label));

      if (!geometry) return;

      if (geometry instanceof Polygon) {
        // Create label for the total area
        const areaText = formatArea(geometry);
        const areaPoint = new Feature(geometry.getInteriorPoint());
        areaPoint.setStyle(createMeasureStyle(areaText, "point"));
        areaPoint.set("label_type", "drawing");
        measureSource.addFeature(areaPoint);
      } else if (geometry instanceof LineString) {
        const coords = geometry.getCoordinates();
        if (coords.length > 1) {
          // Create label for the total length at the end point
          const totalLengthText = formatLength(geometry);
          const endPoint = new Point(coords[coords.length - 1]);
          const totalLengthFeature = new Feature(endPoint);
          totalLengthFeature.setStyle(createTotalLengthStyle(totalLengthText));
          totalLengthFeature.set("label_type", "drawing");
          measureSource.addFeature(totalLengthFeature);

          // Create segment length labels for each segment of the line
          for (let i = 0; i < coords.length - 1; i++) {
            const segment = new LineString([coords[i], coords[i + 1]]);
            const segmentLengthText = formatLength(segment);

            const segmentLabelFeature = new Feature(segment);
            segmentLabelFeature.setStyle(createMeasureStyle(segmentLengthText));
            segmentLabelFeature.set("label_type", "drawing");
            measureSource.addFeature(segmentLabelFeature);
          }
        }
      }
    },
    [
      selectionMeasureLayer,
      formatArea,
      formatLength,
      createMeasureStyle,
      createTotalLengthStyle,
    ]
  );

  // useEffect hook for managing the draw interaction
  useEffect(() => {
    // Determine the type of geometry to draw based on the active tool
    const measureType =
      activeTool === "measure-area" ? "Polygon" : "LineString";

    // Cleanup existing interactions and labels if the tool is not active
    if (
      !map ||
      (activeTool !== "measure-distance" && activeTool !== "measure-area")
    ) {
      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current);
      }
      source.clear();
      updateDrawingMeasureLabels(null);
      if (drawingListenerKeyRef.current) {
        unByKey(drawingListenerKeyRef.current);
      }
      return;
    }

    // Define the style for the drawing features
    // ແກ້ໄຂ: ປ່ຽນ stroke ເປັນເສັ້ນຂາດ
    const drawStyle = new Style({
      fill: new Fill({
        color: "rgba(0, 118, 255, 0.1)",
      }),
      stroke: new Stroke({
        color: "#007bff",
        width: 3,
        lineDash: [5, 5], // ເຮັດໃຫ້ເສັ້ນກາຍເປັນເສັ້ນຂາດ
      }),
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({ color: "#0d6efd" }),
        stroke: new Stroke({ color: "#ffffff", width: 2 }),
      }),
    });

    // Create the new Draw interaction
    drawInteractionRef.current = new Draw({
      source: source,
      type: measureType,
      style: drawStyle,
    });
    map.addInteraction(drawInteractionRef.current);

    // Event handler for when drawing starts
    drawInteractionRef.current.on("drawstart", ({ feature }) => {
      source.clear();
      sketchFeatureRef.current = feature;
      // Add a listener to update the labels as the geometry changes
      drawingListenerKeyRef.current = sketchFeatureRef.current
        .getGeometry()
        .on("change", (geomEvt) => {
          updateDrawingMeasureLabels(geomEvt.target);
        });
    });

    // Event handler for when drawing ends
    drawInteractionRef.current.on("drawend", () => {
      // Keep the final labels
      if (drawingListenerKeyRef.current) {
        unByKey(drawingListenerKeyRef.current);
      }
      sketchFeatureRef.current = null;
    });

    // Event handler for when drawing is aborted
    drawInteractionRef.current.on("drawabort", () => {
      source.clear();
      updateDrawingMeasureLabels(null); // Clear temporary labels
      if (drawingListenerKeyRef.current) {
        unByKey(drawingListenerKeyRef.current);
      }
      sketchFeatureRef.current = null;
    });

    // Cleanup function to remove the interaction and listeners when the component unmounts or dependencies change
    return () => {
      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current);
      }
      source.clear();
      updateDrawingMeasureLabels(null);
      if (drawingListenerKeyRef.current) {
        unByKey(drawingListenerKeyRef.current);
      }
    };
  }, [
    map,
    activeTool,
    selectionMeasureLayer,
    source,
    updateDrawingMeasureLabels,
  ]);

  return null;
};

export default MeasureTool;
