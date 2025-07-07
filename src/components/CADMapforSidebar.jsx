import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import { Map, View } from "ol";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { OSM } from "ol/source";
import { Draw, Modify, Snap, Select } from "ol/interaction";
import { Style, Stroke } from "ol/style";
import { fromLonLat } from "ol/proj";
import GeoJSON from "ol/format/GeoJSON";
import KML from "ol/format/KML";
import shp from "shpjs";
import DxfParser from "dxf-parser";
import Sidebar from "./Sidebar";
import { saveAs } from "file-saver";

const CADMap = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const vectorSource = useRef(new VectorSource());
  const drawRef = useRef(null);
  const snapRef = useRef(null);

  const [snapOn, setSnapOn] = useState(false);
  const [inspector, setInspector] = useState(null);
  const [layers, setLayers] = useState([]);
  const [theme, setTheme] = useState("dark");
  const [importedFilename, setImportedFilename] = useState(null);

  const history = useRef({ undo: [], redo: [] });

  const snapshot = () =>
    JSON.stringify(
      new GeoJSON().writeFeatures(vectorSource.current.getFeatures())
    );
  const applySnapshot = (json) => {
    vectorSource.current.clear();
    const features = new GeoJSON().readFeatures(json, {
      featureProjection: "EPSG:3857",
    });
    vectorSource.current.addFeatures(features);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.body.classList.toggle("light", savedTheme === "light");

    const osm = new TileLayer({ source: new OSM(), title: "OSM Base" });
    const vectorLayer = new VectorLayer({
      source: vectorSource.current,
      title: "Draw Layer",
      style: new Style({
        stroke: new Stroke({ color: "#00ffff", width: 2 }),
      }),
    });

    const map = new Map({
      target: mapRef.current,
      layers: [osm, vectorLayer],
      view: new View({
        center: fromLonLat([100.5, 13.75]),
        zoom: 14,
      }),
    });

    mapInstance.current = map;

    setLayers([
      {
        uid: "osm",
        title: "OSM Base",
        visible: osm.getVisible(),
        toggle: () => {
          osm.setVisible(!osm.getVisible());
          refreshLayers();
        },
        layer: osm,
      },
      {
        uid: "draw",
        title: "Draw Layer",
        visible: vectorLayer.getVisible(),
        toggle: () => {
          vectorLayer.setVisible(!vectorLayer.getVisible());
          refreshLayers();
        },
        layer: vectorLayer,
      },
    ]);

    const select = new Select();
    map.addInteraction(select);
    select.on("select", (e) => {
      const feat = e.selected[0];
      setInspector(feat || null);
    });

    return () => map.setTarget(null);
  }, []);

  const refreshLayers = () => {
    setLayers((prev) =>
      prev.map((l) => ({ ...l, visible: l.layer.getVisible() }))
    );
  };

  const handleTool = (tool) => {
    const map = mapInstance.current;
    if (drawRef.current) map.removeInteraction(drawRef.current);

    if (tool === "LineString") {
      history.current.undo.push(snapshot());
      history.current.redo = [];

      const draw = new Draw({
        source: vectorSource.current,
        type: "LineString",
      });
      map.addInteraction(draw);
      drawRef.current = draw;
    }

    if (tool === "undo") {
      const prev = history.current.undo.pop();
      if (prev) {
        const curr = snapshot();
        history.current.redo.push(curr);
        applySnapshot(prev);
      }
    }

    if (tool === "redo") {
      const next = history.current.redo.pop();
      if (next) {
        const curr = snapshot();
        history.current.undo.push(curr);
        applySnapshot(next);
      }
    }
  };

  const handleImport = async (file) => {
    setImportedFilename(file.name);
    history.current.undo.push(snapshot());
    history.current.redo = [];

    const name = file.name.toLowerCase();

    if (name.endsWith(".geojson")) {
      const text = await file.text();
      const format = new GeoJSON();
      const features = format.readFeatures(text, {
        featureProjection: "EPSG:3857",
      });
      vectorSource.current.addFeatures(features);
    } else if (name.endsWith(".kml")) {
      const text = await file.text();
      const format = new KML();
      const features = format.readFeatures(text, {
        featureProjection: "EPSG:3857",
      });
      vectorSource.current.addFeatures(features);
    } else if (name.endsWith(".csv")) {
      const text = await file.text();
      const lines = text.split("\n");
      const headers = lines.shift().split(",");
      lines.forEach((line) => {
        const values = line.split(",");
        const lon = parseFloat(values[0]);
        const lat = parseFloat(values[1]);
        const props = headers.reduce((acc, key, idx) => {
          acc[key] = values[idx];
          return acc;
        }, {});
        const geojson = {
          type: "Feature",
          geometry: { type: "Point", coordinates: [lon, lat] },
          properties: props,
        };
        const feat = new GeoJSON().readFeature(geojson, {
          featureProjection: "EPSG:3857",
        });
        vectorSource.current.addFeature(feat);
      });
    } else if (name.endsWith(".zip")) {
      const geojson = await shp(await file.arrayBuffer());
      const features = new GeoJSON().readFeatures(JSON.stringify(geojson), {
        featureProjection: "EPSG:3857",
      });
      vectorSource.current.addFeatures(features);
    } else if (name.endsWith(".dxf")) {
      const text = await file.text();
      const parser = new DxfParser();
      const dxf = parser.parseSync(text);
      dxf.entities.forEach((ent) => {
        if (ent.type === "LINE") {
          const coords = [
            [ent.start.x, ent.start.y],
            [ent.end.x, ent.end.y],
          ];
          const feat = new GeoJSON().readFeature(
            {
              type: "Feature",
              geometry: { type: "LineString", coordinates: coords },
              properties: {},
            },
            { featureProjection: "EPSG:3857", dataProjection: "EPSG:4326" }
          );
          vectorSource.current.addFeature(feat);
        }
      });
    }
  };

  const handleExport = (format) => {
    const features = vectorSource.current.getFeatures();
    let output = "";
    let filename = "";

    if (format === "geojson") {
      output = new GeoJSON().writeFeatures(features);
      filename = "export.geojson";
    } else if (format === "kml") {
      output = new KML().writeFeatures(features);
      filename = "export.kml";
    } else if (format === "csv") {
      output = "lon,lat\n";
      features.forEach((f) => {
        const [x, y] = f.getGeometry().getCoordinates();
        output += `${x},${y}\n`;
      });
      filename = "export.csv";
    }

    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    saveAs(blob, filename);
  };

  const handleClear = () => {
    history.current.undo.push(snapshot());
    vectorSource.current.clear();
  };

  const handleToggleSnap = () => {
    const map = mapInstance.current;
    if (!snapOn) {
      snapRef.current = new Snap({ source: vectorSource.current });
      map.addInteraction(snapRef.current);
    } else {
      map.removeInteraction(snapRef.current);
    }
    setSnapOn(!snapOn);
  };

  const handleZoomLayer = () => {
    const extent = vectorSource.current.getExtent();
    mapInstance.current.getView().fit(extent, { padding: [50, 50, 50, 50] });
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.body.classList.toggle("light", newTheme === "light");
  };

  return (
    <div id="container">
      <Sidebar
        onTool={handleTool}
        onImport={handleImport}
        onExport={handleExport}
        onClear={handleClear}
        onToggleSnap={handleToggleSnap}
        onZoomLayer={handleZoomLayer}
        toggleTheme={toggleTheme}
        theme={theme}
        snapOn={snapOn}
        layers={layers}
        inspector={inspector}
        importedFilename={importedFilename}
      />
      <div id="map" ref={mapRef}></div>
    </div>
  );
};

export default CADMap;
