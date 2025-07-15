import React, { useEffect, useRef, useState, useCallback } from "react";
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
import { fromLonLat, toLonLat, METERS_PER_UNIT } from "ol/proj";
import Draw from "ol/interaction/Draw";
import { getLength, getArea } from "ol/sphere";
import Overlay from "ol/Overlay";
import Select from "ol/interaction/Select";
import Polygon from "ol/geom/Polygon";
import Feature from "ol/Feature";
import CoordinateBar from "./ui/CoordinateBar";
import Sidebar from "./ui/Sidebar";
import Graticule from "ol/layer/Graticule"; // Import Graticule for grid layers

const MapComponent = ({
  activeTool,
  setActiveTool,
  setMapInstance,
  graticuleEnabled,
  graticuleType,
}) => {
  const mapRef = useRef();
  const olMap = useRef(null);
  const drawInteraction = useRef(null);
  const selectInteraction = useRef(null);
  const graticuleLayer = useRef(null); // Ref to hold the Graticule layer

  const vectorSource = useRef(new VectorSource());
  const measureSource = useRef(new VectorSource());

  const [openLayersLoaded, setOpenLayersLoaded] = useState(false);
  const [layerStates, setLayerStates] = useState({
    osm: { visible: true, opacity: 1 },
    satellite: { visible: false, opacity: 1 },
  });
  const [districts] = useState([]);
  const [selectedProvinceForDistricts] = useState(null);

  const onProvinceSelectForMap = useCallback((provinceId) => {
    console.log("Selected province for map:", provinceId);
  }, []);

  const onVisibilityChange = useCallback((layerName, visible) => {
    setLayerStates((prev) => {
      const newState = {
        ...prev,
        [layerName]: { ...prev[layerName], visible },
      };
      if (olMap.current) {
        olMap.current.getAllLayers().forEach((layer) => {
          if (layer.get("name") === layerName) {
            layer.setVisible(visible);
          }
        });
      }
      return newState;
    });
  }, []);

  const onOpacityChange = useCallback((layerName, opacity) => {
    setLayerStates((prev) => {
      const newState = {
        ...prev,
        [layerName]: { ...prev[layerName], opacity },
      };
      if (olMap.current) {
        olMap.current.getAllLayers().forEach((layer) => {
          if (layer.get("name") === layerName) {
            layer.setOpacity(opacity);
          }
        });
      }
      return newState;
    });
  }, []);

  const toggleDistrict = useCallback((districtId) => {
    console.log("Toggle district:", districtId);
  }, []);

  const handleLoadData = useCallback((dataType) => {
    console.log("Load data for type:", dataType);
  }, []);

  const handleDistrictOpacityChange = useCallback((districtId, opacity) => {
    console.log(`District ${districtId} opacity changed to ${opacity}`);
  }, []);

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
    const baseLayers = {
      osm: new TileLayer({
        source: new OSM(),
        name: "osm",
      }),
      satellite: new TileLayer({
        source: new XYZ({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        }),
        name: "satellite",
      }),
    };

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
      layers: [baseLayers.osm, baseLayers.satellite, vectorLayer, measureLayer],
      view: new View({
        center: fromLonLat([102.6, 17.97]),
        zoom: 7,
      }),
    });

    setMapInstance(olMap.current);
    setOpenLayersLoaded(true);

    olMap.current.getAllLayers().forEach((layer) => {
      const layerName = layer.get("name");
      if (layerStates[layerName]) {
        layer.setVisible(layerStates[layerName].visible);
        layer.setOpacity(layerStates[layerName].opacity);
      }
    });

    olMap.current.on("pointermove", function (evt) {
      if (evt.dragging) return;
      const coordinate = toLonLat(evt.coordinate);
      document.getElementById("coordinates").textContent =
        coordinate[0].toFixed(4) + ", " + coordinate[1].toFixed(4);
    });

    olMap.current.getView().on("change:resolution", function () {
      const resolution = olMap.current.getView().getResolution();
      const units = olMap.current.getView().getProjection().getUnits();
      const dpi = 25.4 / 0.28;
      const mpu = METERS_PER_UNIT[units];
      const scale = resolution * mpu * 39.37 * dpi;
      document.getElementById("scale").textContent =
        "1:" + Math.round(scale).toLocaleString();
    });

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
  }, [setMapInstance, layerStates]);

  useEffect(() => {
    if (!olMap.current) return;

    if (drawInteraction.current) {
      olMap.current.removeInteraction(drawInteraction.current);
      drawInteraction.current = null;
    }

    if (selectInteraction.current) {
      olMap.current.removeInteraction(selectInteraction.current);
    }

    let newInteraction = null;
    let isDrawingTool = false;

    const identifyHandler = (evt) => {
      if (activeTool !== "identify") {
        olMap.current.un("singleclick", identifyHandler);
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

    return () => {
      if (drawInteraction.current) {
        olMap.current.removeInteraction(drawInteraction.current);
        drawInteraction.current = null;
      }
      if (selectInteraction.current) {
        olMap.current.removeInteraction(selectInteraction.current);
      }
      olMap.current.un("singleclick", identifyHandler);
    };
  }, [activeTool, setActiveTool]);

  // useEffect for Graticule Layer
  useEffect(() => {
    if (!olMap.current) {
      console.log("Map not initialized, cannot add graticule.");
      return;
    }

    // Remove existing graticule layer if it exists
    if (graticuleLayer.current) {
      olMap.current.removeLayer(graticuleLayer.current);
      graticuleLayer.current = null;
      console.log("Removed existing graticule layer.");
    }

    if (graticuleEnabled) {
      console.log(
        `Attempting to add Graticule: Type=${graticuleType}, Enabled=${graticuleEnabled}`
      );

      // Temporarily simplified style and configuration for debugging
      let testStrokeStyle = new Stroke({
        color: "rgba(190, 26, 26, 0.7)",
        width: 1.5,
        lineDash: [2, 5],
      });

      graticuleLayer.current = new Graticule({
        strokeStyle: testStrokeStyle,
        showLabels: true, // Always show labels for debugging
        wrapX: true,
        // For initial test, keep intervals simple or omit for default behavior
        // intervals: [10], // Try a very small interval if you want to see many lines quickly (may be too dense)
        // For WGS84, the extent is usually fine. For UTM, intervals are more key.
      });

      if (graticuleLayer.current) {
        olMap.current.addLayer(graticuleLayer.current);
        graticuleLayer.current.setZIndex(999); // Set a very high Z-index to ensure visibility
        console.log("Graticule layer added to map with high Z-index.");
      }
    } else {
      console.log("Graticule disabled, not adding layer.");
    }

    return () => {
      if (graticuleLayer.current) {
        olMap.current.removeLayer(graticuleLayer.current);
        graticuleLayer.current = null;
        console.log("Cleanup: Removed graticule layer on unmount/re-render.");
      }
    };
  }, [graticuleEnabled, graticuleType]); // Dependencies

  return (
    <div className="map-container">
      <div ref={mapRef} id="map"></div>
      {olMap.current && <CoordinateBar map={olMap.current} />}
      {olMap.current && (
        <Sidebar
          openLayersLoaded={openLayersLoaded}
          onProvinceSelectForMap={onProvinceSelectForMap}
          layerStates={layerStates}
          onVisibilityChange={onVisibilityChange}
          onOpacityChange={onOpacityChange}
          districts={districts}
          toggleDistrict={toggleDistrict}
          handleLoadData={handleLoadData}
          handleDistrictOpacityChange={handleDistrictOpacityChange}
          selectedProvinceForDistricts={selectedProvinceForDistricts}
        />
      )}
    </div>
  );
};

export default MapComponent;
