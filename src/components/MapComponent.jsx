import React, { useEffect, useRef } from "react";
import "ol/ol.css"; // Essential for OpenLayers styles
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import CircleStyle from "ol/style/Circle";
import { fromLonLat, toLonLat, transform, METERS_PER_UNIT } from "ol/proj";
import { getCenter } from "ol/extent";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import Feature from "ol/Feature";
import Draw from "ol/interaction/Draw";
import { getLength, getArea } from "ol/sphere";
import Select from "ol/interaction/Select";
import Graticule from "ol/layer/Graticule";
import Text from "ol/style/Text";

// --- For UTM Conversion ---
import proj4 from "proj4";
import { register } from "ol/proj/proj4";

// --- Register UTM projections for Laos (Zones 47N and 48N) ---
proj4.defs("EPSG:32647", "+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs");
proj4.defs("EPSG:32648", "+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs");
register(proj4);
// --- End UTM Setup ---

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
  const graticuleLayer = useRef(null);
  const utmLabelSource = useRef(new VectorSource());
  const utmGridLineSource = useRef(new VectorSource()); // Source for custom grid lines

  // --- Initial Setup Effect ---
  useEffect(() => {
    // --- Base Map Layers ---
    const osmLayer = new TileLayer({
      source: new XYZ({
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      }),
      name: "osm",
      visible: true,
    });
    const esriSatelliteLayer = new TileLayer({
      source: new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      }),
      name: "satellite",
      visible: false,
    });
    const topoLayer = new TileLayer({
      source: new XYZ({
        url: "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
      }),
      name: "topo",
      visible: false,
    });
    const googleSatelliteLayer = new TileLayer({
      source: new XYZ({
        url: "https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}",
      }),
      name: "googleSatellite",
      visible: false,
    });
    const googleHybridLayer = new TileLayer({
      source: new XYZ({
        url: "https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}",
      }),
      name: "googleHybrid",
      visible: false,
    });
    const cartoLayer = new TileLayer({
      source: new XYZ({
        url: "https://{a-d}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
      }),
      name: "carto",
      visible: false,
    });

    // --- Vector & Label Layers ---
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
    const mainVectorLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
        stroke: new Stroke({ color: "#ffcc33", width: 2 }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: "#ffcc33" }),
        }),
      }),
      name: "vectorLayer",
    });
    const measureLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.5)",
          lineDash: [10, 10],
          width: 2,
        }),
      }),
      name: "measureLayer",
    });

    olMap.current = new Map({
      target: mapRef.current,
      layers: [
        // Base maps are at the bottom
        osmLayer,
        esriSatelliteLayer,
        topoLayer,
        googleSatelliteLayer,
        googleHybridLayer,
        cartoLayer,
        // Vector and label layers are on top
        mainVectorLayer,
        measureLayer,
        utmGridLineLayer,
        utmLabelLayer,
      ],
      view: new View({ center: fromLonLat([102.6, 17.97]), zoom: 7 }),
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

      // Northing (Y-axis) lines and labels
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

      // Easting (X-axis) lines and labels
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

  // --- Interactions (Draw, Select, Measure) Effect ---
  useEffect(() => {
    if (!olMap.current) return;
    const map = olMap.current;
    if (drawInteraction.current) map.removeInteraction(drawInteraction.current);
    if (selectInteraction.current)
      map.removeInteraction(selectInteraction.current);

    const formatLength = (line) =>
      getLength(line) > 100
        ? `${(getLength(line) / 1000).toFixed(2)} km`
        : `${getLength(line).toFixed(2)} m`;
    const formatArea = (polygon) =>
      getArea(polygon) > 10000
        ? `${(getArea(polygon) / 1000000).toFixed(2)} km²`
        : `${getArea(polygon).toFixed(2)} m²`;

    switch (activeTool) {
      case "select":
        selectInteraction.current = new Select({
          /* ... select config ... */
        });
        map.addInteraction(selectInteraction.current);
        break;
      case "draw-point":
      case "draw-line":
      case "draw-polygon":
      case "draw-circle":
        const type = {
          "draw-point": "Point",
          "draw-line": "LineString",
          "draw-polygon": "Polygon",
          "draw-circle": "Circle",
        }[activeTool];
        drawInteraction.current = new Draw({
          source: map
            .getLayers()
            .getArray()
            .find((l) => l.get("name") === "vectorLayer")
            .getSource(),
          type,
        });
        map.addInteraction(drawInteraction.current);
        drawInteraction.current.on("drawend", () => setActiveTool("select"));
        break;
    }
    return () => {
      if (drawInteraction.current)
        map.removeInteraction(drawInteraction.current);
      if (selectInteraction.current)
        map.removeInteraction(selectInteraction.current);
    };
  }, [activeTool, setActiveTool]);

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
