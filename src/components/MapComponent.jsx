import React, { useEffect, useRef } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import CircleStyle from "ol/style/Circle";
import { fromLonLat, toLonLat, METERS_PER_UNIT } from "ol/proj"; // Corrected import for METERS_PER_UNIT
import Draw from "ol/interaction/Draw";
import { getLength, getArea } from "ol/sphere";
import Overlay from "ol/Overlay";
import Select from "ol/interaction/Select";
import Polygon from "ol/geom/Polygon";
import Feature from "ol/Feature";
// import { Units } from 'ol/proj'; // This line is now removed or commented out

const MapComponent = ({ activeTool, setActiveTool, setMapInstance }) => {
  const mapRef = useRef();
  const olMap = useRef(null);
  const drawInteraction = useRef(null);
  const selectInteraction = useRef(null);

  const vectorSource = useRef(new VectorSource());
  const measureSource = useRef(new VectorSource());

  const formatLength = (line) => {
    const length = getLength(line);
    let output;
    if (length > 100) {
      output = Math.round((length / 1000) * 100) / 100 + " km";
    } else {
      output = Math.round(length * 100) / 100 + " m";
    }
    return output;
  };

  const formatArea = (polygon) => {
    const area = getArea(polygon);
    let output;
    if (area > 10000) {
      output = Math.round((area / 1000000) * 100) / 100 + " km²";
    } else {
      output = Math.round(area * 100) / 100 + " m²";
    }
    return output;
  };

  useEffect(() => {
    // Base map layers
    const baseLayers = {
      osm: new TileLayer({
        source: new OSM(),
        name: "osm", // Added name for easier access
      }),
      satellite: new TileLayer({
        source: new XYZ({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        }),
        name: "satellite", // Added name for easier access
      }),
    };

    // Vector layer for drawings
    const vectorLayer = new VectorLayer({
      source: vectorSource.current,
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.2)",
        }),
        stroke: new Stroke({
          color: "#ffcc33",
          width: 2,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: "#ffcc33",
          }),
        }),
      }),
      name: "vectorLayer",
    });

    // Measurement layer
    const measureLayer = new VectorLayer({
      source: measureSource.current,
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.2)",
        }),
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.5)",
          lineDash: [10, 10],
          width: 2,
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.7)",
          }),
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)",
          }),
        }),
      }),
      name: "measureLayer",
    });

    olMap.current = new Map({
      target: mapRef.current,
      layers: [baseLayers.osm, vectorLayer, measureLayer],
      view: new View({
        center: fromLonLat([102.6, 17.97]), // Center on Laos
        zoom: 7,
      }),
    });

    setMapInstance(olMap.current);

    // Mouse position tracking
    olMap.current.on("pointermove", function (evt) {
      if (evt.dragging) return;
      const coordinate = toLonLat(evt.coordinate);
      document.getElementById("coordinates").textContent =
        coordinate[0].toFixed(4) + ", " + coordinate[1].toFixed(4);
    });

    // Update scale display
    olMap.current.getView().on("change:resolution", function () {
      const resolution = olMap.current.getView().getResolution();
      const units = olMap.current.getView().getProjection().getUnits();
      const dpi = 25.4 / 0.28;
      const mpu = METERS_PER_UNIT[units]; // Corrected: Using imported METERS_PER_UNIT directly
      const scale = resolution * mpu * 39.37 * dpi;
      document.getElementById("scale").textContent =
        "1:" + Math.round(scale).toLocaleString();
    });

    // Selection interaction
    selectInteraction.current = new Select({
      layers: [vectorLayer],
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 0, 0, 0.3)",
        }),
        stroke: new Stroke({
          color: "#ff0000",
          width: 3,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: "#ff0000",
          }),
        }),
      }),
    });
    olMap.current.addInteraction(selectInteraction.current);

    return () => {
      olMap.current.setTarget(undefined);
      olMap.current.dispose();
    };
  }, [setMapInstance]);

  useEffect(() => {
    if (!olMap.current) return;

    // Remove existing draw interaction
    if (drawInteraction.current) {
      olMap.current.removeInteraction(drawInteraction.current);
      drawInteraction.current = null;
    }

    // Remove select interaction to re-add later if needed
    if (selectInteraction.current) {
      olMap.current.removeInteraction(selectInteraction.current);
    }

    // Set appropriate interactions based on activeTool
    let newInteraction = null;
    let isDrawingTool = false;

    // Handler for identify tool to be removed when tool changes
    const identifyHandler = (evt) => {
      if (activeTool !== "identify") {
        // Ensure this handler only runs if 'identify' is the activeTool
        olMap.current.un("singleclick", identifyHandler); // Remove itself if tool changes
        return;
      }
      const features = [];
      olMap.current.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
        if (
          layer ===
          olMap.current
            .getAllLayers()
            .find((l) => l.get("name") === "vectorLayer")
        ) {
          features.push(feature);
        }
      });

      if (features.length > 0) {
        const feature = features[0];
        const geometry = feature.getGeometry();
        const type = geometry.getType();

        let info = `Feature Type: ${type}\n`;

        if (type === "Point") {
          const coord = toLonLat(geometry.getCoordinates());
          info += `Coordinates: ${coord[0].toFixed(4)}, ${coord[1].toFixed(4)}`;
        } else if (type === "LineString") {
          info += `Length: ${formatLength(geometry)}`;
        } else if (type === "Polygon") {
          info += `Area: ${formatArea(geometry)}`;
        }
        alert(info);
      }
    };

    switch (activeTool) {
      case "pan":
        // Default navigation (Pan) is usually active when no other tool is.
        // OpenLayers handles pan by default unless other interactions take precedence.
        break;
      case "select":
        if (selectInteraction.current) {
          olMap.current.addInteraction(selectInteraction.current);
        }
        break;
      case "draw-point":
        newInteraction = new Draw({
          source: vectorSource.current,
          type: "Point",
        });
        isDrawingTool = true;
        break;
      case "draw-line":
        newInteraction = new Draw({
          source: vectorSource.current,
          type: "LineString",
        });
        isDrawingTool = true;
        break;
      case "draw-polygon":
        newInteraction = new Draw({
          source: vectorSource.current,
          type: "Polygon",
        });
        isDrawingTool = true;
        break;
      case "draw-circle":
        newInteraction = new Draw({
          source: vectorSource.current,
          type: "Circle",
        });
        isDrawingTool = true;
        break;
      case "measure-distance":
        newInteraction = new Draw({
          source: measureSource.current,
          type: "LineString",
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
              fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
            }),
          }),
        });
        newInteraction.on("drawend", function (event) {
          const geom = event.feature.getGeometry();
          const measurement = formatLength(geom);
          const tooltipCoord = geom.getLastCoordinate();
          const tooltipElement = document.createElement("div");
          tooltipElement.className = "tooltip";
          tooltipElement.innerHTML = measurement;
          const overlay = new Overlay({
            element: tooltipElement,
            offset: [0, -15],
            positioning: "bottom-center",
          });
          olMap.current.addOverlay(overlay);
          overlay.setPosition(tooltipCoord);
          setTimeout(() => setActiveTool("select"), 100);
        });
        break;
      case "measure-area":
        newInteraction = new Draw({
          source: measureSource.current,
          type: "Polygon",
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
              fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
            }),
          }),
        });
        newInteraction.on("drawend", function (event) {
          const geom = event.feature.getGeometry();
          const measurement = formatArea(geom);
          const tooltipCoord = geom.getInteriorPoint().getCoordinates();
          const tooltipElement = document.createElement("div");
          tooltipElement.className = "tooltip";
          tooltipElement.innerHTML = measurement;
          const overlay = new Overlay({
            element: tooltipElement,
            offset: [0, -15],
            positioning: "bottom-center",
          });
          olMap.current.addOverlay(overlay);
          overlay.setPosition(tooltipCoord);
          setTimeout(() => setActiveTool("select"), 100);
        });
        break;
      case "identify":
        olMap.current.on("singleclick", identifyHandler);
        break;
      case "select-features":
        if (selectInteraction.current) {
          olMap.current.addInteraction(selectInteraction.current);
        }
        break;
      default:
        break;
    }

    if (newInteraction) {
      olMap.current.addInteraction(newInteraction);
      drawInteraction.current = newInteraction;
      if (isDrawingTool) {
        newInteraction.on("drawend", () => {
          setTimeout(() => setActiveTool("select"), 100);
        });
      }
    }

    // Clean up function to remove interactions when tool changes or component unmounts
    return () => {
      if (drawInteraction.current) {
        olMap.current.removeInteraction(drawInteraction.current);
        drawInteraction.current = null;
      }
      if (selectInteraction.current) {
        olMap.current.removeInteraction(selectInteraction.current);
      }
      // Remove any identify handler if it was added
      olMap.current.un("singleclick", identifyHandler);
    };
  }, [activeTool, setActiveTool]);

  return (
    <div className="map-container">
      <div ref={mapRef} id="map"></div>
    </div>
  );
};

export default MapComponent;
