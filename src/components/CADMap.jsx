import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import { Style, Stroke, Fill } from "ol/style";
import { fromLonLat } from "ol/proj";
import GeoJSON from "ol/format/GeoJSON";
import KML from "ol/format/KML";
import { saveAs } from "file-saver";
import LineString from "ol/geom/LineString";
import Polygon from "ol/geom/Polygon";
import Point from "ol/geom/Point";
import Feature from "ol/Feature";
import HeaderBar from "./HeaderBar";

export default function CADMap() {
  const mapRef = useRef();
  const map = useRef();
  const vectorSource = useRef(new VectorSource());
  const tempSource = useRef(new VectorSource());

  const [theme, setTheme] = useState("dark");
  const [drawLength, setDrawLength] = useState("");
  const [drawAngle, setDrawAngle] = useState("0");
  const [hvMode, setHvMode] = useState("H");
  const [polyCoords, setPolyCoords] = useState([]);
  const [polyMode, setPolyMode] = useState(null);
  const [importedFilename, setImportedFilename] = useState(null);

  const history = useRef({ undo: [], redo: [] });

  const snapshot = () =>
    JSON.stringify(
      new GeoJSON().writeFeatures(vectorSource.current.getFeatures())
    );

  const applySnapshot = (json) => {
    vectorSource.current.clear();
    const feats = new GeoJSON().readFeatures(json, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857",
    });
    vectorSource.current.addFeatures(feats);
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    setTheme(saved);
    document.body.classList.toggle("light", saved === "light");

    const base = new TileLayer({ source: new OSM() });
    const drawLayer = new VectorLayer({
      source: vectorSource.current,
      style: new Style({ stroke: new Stroke({ color: "#00ffff", width: 2 }) }),
    });
    const previewLayer = new VectorLayer({
      source: tempSource.current,
      style: new Style({
        stroke: new Stroke({ color: "yellow", width: 2, lineDash: [8, 4] }),
        fill: new Fill({ color: "rgba(255,255,0,0.2)" }),
      }),
    });

    map.current = new Map({
      target: mapRef.current,
      layers: [base, drawLayer, previewLayer],
      view: new View({ center: fromLonLat([100.5, 13.75]), zoom: 14 }),
    });
  }, []);

  const toggleTheme = () => {
    const n = theme === "dark" ? "light" : "dark";
    setTheme(n);
    localStorage.setItem("theme", n);
    document.body.classList.toggle("light", n === "light");
  };

  const handleImport = async (file) => {
    setImportedFilename(file.name);
    history.current.undo.push(snapshot());
    const text = await file.text();
    let feats = [];

    if (file.name.toLowerCase().endsWith(".geojson")) {
      feats = new GeoJSON().readFeatures(text, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });
    } else if (file.name.toLowerCase().endsWith(".kml")) {
      feats = new KML().readFeatures(text, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });
    } else if (file.name.toLowerCase().endsWith(".csv")) {
      const rows = text.trim().split("\n");
      rows.forEach((line) => {
        const [x, y] = line.split(",").map(parseFloat);
        if (!isNaN(x) && !isNaN(y)) {
          feats.push(new Feature({ geometry: new Point(fromLonLat([x, y])) }));
        }
      });
    }

    vectorSource.current.addFeatures(feats);
  };

  const handleExport = (fmt) => {
    const feats = vectorSource.current.getFeatures();
    let output = "",
      filename = "";
    if (fmt === "geojson") {
      output = new GeoJSON().writeFeatures(feats);
      filename = "export.geojson";
    } else if (fmt === "kml") {
      output = new KML().writeFeatures(feats);
      filename = "export.kml";
    } else if (fmt === "csv") {
      const lines = feats.map((f) => {
        const c = f.getGeometry().getFirstCoordinate();
        return `${c[0]},${c[1]}`;
      });
      output = "lon,lat\n" + lines.join("\n");
      filename = "export.csv";
    }
    saveAs(new Blob([output], { type: "text/plain" }), filename);
  };

  const handleClear = () => {
    history.current.undo.push(snapshot());
    vectorSource.current.clear();
  };

  const handleUndo = () => {
    const prev = history.current.undo.pop();
    if (prev) {
      history.current.redo.push(snapshot());
      applySnapshot(prev);
    }
  };

  const handleRedo = () => {
    const next = history.current.redo.pop();
    if (next) {
      history.current.undo.push(snapshot());
      applySnapshot(next);
    }
  };

  const startLine = () => {
    setPolyMode("line");
    setPolyCoords([]);
    tempSource.current.clear();
  };

  const startPolygon = () => {
    setPolyMode("polygon");
    setPolyCoords([]);
    tempSource.current.clear();
  };

  const nextSegment = () => {
    if (!polyMode) return;
    const len = parseFloat(drawLength);
    if (isNaN(len)) return alert("กรุณากรอกระยะ");

    const base =
      polyCoords[polyCoords.length - 1] || map.current.getView().getCenter();
    let angle =
      hvMode === "V"
        ? Math.PI / 2
        : hvMode === "A"
        ? (parseFloat(drawAngle) * Math.PI) / 180
        : 0;

    const nxt = [
      base[0] + Math.cos(angle) * len,
      base[1] + Math.sin(angle) * len,
    ];
    const updated = [...polyCoords, nxt];
    setPolyCoords(updated);

    const geom =
      polyMode === "line" ? new LineString(updated) : new Polygon([updated]);
    tempSource.current.clear();
    tempSource.current.addFeature(new Feature({ geometry: geom }));
  };

  const finishDraw = () => {
    if (!polyMode || polyCoords.length < 2) return;
    const geom =
      polyMode === "line"
        ? new LineString(polyCoords)
        : new Polygon([polyCoords]);
    vectorSource.current.addFeature(new Feature({ geometry: geom }));
    history.current.undo.push(snapshot());
    setPolyCoords([]);
    setPolyMode(null);
    tempSource.current.clear();
  };

  const toggleHvMode = () => {
    setHvMode((prev) => (prev === "H" ? "V" : prev === "V" ? "A" : "H"));
  };

  return (
    <div id="container">
      <HeaderBar
        onTool={(tool) => {
          if (tool === "undo") handleUndo();
          if (tool === "redo") handleRedo();
        }}
        onImport={handleImport}
        onExport={handleExport}
        onClear={handleClear}
        onToggleSnap={() => {}}
        onZoomLayer={() => {}}
        toggleTheme={toggleTheme}
        theme={theme}
        snapOn={false}
        drawLength={drawLength}
        setDrawLength={setDrawLength}
        drawAngle={drawAngle}
        setDrawAngle={setDrawAngle}
        hvMode={hvMode}
        onModeHV={toggleHvMode}
        onStartPolyline={startLine}
        onNextSegment={nextSegment}
        onFinishPolyline={finishDraw}
        onStartPolygon={startPolygon}
        onFinishPolygon={finishDraw}
        importedFilename={importedFilename}
      />
      <div id="map" ref={mapRef}></div>
    </div>
  );
}
