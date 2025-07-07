import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import { Draw, Snap, Select } from "ol/interaction";
import { Style, Stroke } from "ol/style";
import { fromLonLat } from "ol/proj";
import GeoJSON from "ol/format/GeoJSON";
import KML from "ol/format/KML";
import shp from "shpjs";
import DxfParser from "dxf-parser";
import HeaderBar from "./HeaderBar.jsx";
import { saveAs } from "file-saver";

export default function CADMap() {
  const mapRef = useRef();
  const mapInstance = useRef();
  const vectorSource = useRef(new VectorSource());
  const drawRef = useRef();
  const snapRef = useRef();

  const [snapOn, setSnapOn] = useState(false);
  const [layers, setLayers] = useState([]);
  const [theme, setTheme] = useState("dark");
  const [importedFilename, setImportedFilename] = useState(null);

  const history = useRef({ undo: [], redo: [] });
  const snapshot = () =>
    JSON.stringify(
      new GeoJSON().writeFeatures(vectorSource.current.getFeatures())
    );
  const apply = (j) => {
    vectorSource.current.clear();
    vectorSource.current.addFeatures(
      new GeoJSON().readFeatures(j, { featureProjection: "EPSG:3857" })
    );
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    setTheme(saved);
    document.body.classList.toggle("light", saved === "light");

    const osm = new TileLayer({ source: new OSM(), title: "OSM Base" });
    const vectorLayer = new VectorLayer({
      source: vectorSource.current,
      title: "Draw Layer",
      style: new Style({ stroke: new Stroke({ color: "#00ffff", width: 2 }) }),
    });
    const map = new Map({
      target: mapRef.current,
      layers: [osm, vectorLayer],
      view: new View({ center: fromLonLat([100.5, 13.75]), zoom: 14 }),
    });
    mapInstance.current = map;

    setLayers([
      {
        uid: "osm",
        title: "OSM Base",
        visible: osm.getVisible(),
        toggle: () => {
          osm.setVisible(!osm.getVisible());
          setLayers((ls) =>
            ls.map((l) =>
              l.uid === "osm" ? { ...l, visible: osm.getVisible() } : l
            )
          );
        },
      },
      {
        uid: "draw",
        title: "Draw Layer",
        visible: vectorLayer.getVisible(),
        toggle: () => {
          vectorLayer.setVisible(!vectorLayer.getVisible());
          setLayers((ls) =>
            ls.map((l) =>
              l.uid === "draw" ? { ...l, visible: vectorLayer.getVisible() } : l
            )
          );
        },
      },
    ]);

    const select = new Select();
    map.addInteraction(select);
    select.on("select", (e) => {}); // inspector can be added

    return () => map.setTarget(null);
  }, []);

  const handleTool = (t) => {
    const map = mapInstance.current;
    if (drawRef.current) map.removeInteraction(drawRef.current);
    if (t === "LineString") {
      history.current.undo.push(snapshot());
      history.current.redo = [];
      const d = new Draw({ source: vectorSource.current, type: "LineString" });
      map.addInteraction(d);
      drawRef.current = d;
    }
    if (t === "undo") {
      const prev = history.current.undo.pop();
      if (prev) {
        history.current.redo.push(snapshot());
        apply(prev);
      }
    }
    if (t === "redo") {
      const next = history.current.redo.pop();
      if (next) {
        history.current.undo.push(snapshot());
        apply(next);
      }
    }
  };

  const handleImport = async (f) => {
    setImportedFilename(f.name);
    history.current.undo.push(snapshot());
    history.current.redo = [];
    const name = f.name.toLowerCase();
    if (name.endsWith(".geojson"))
      vectorSource.current.addFeatures(
        new GeoJSON().readFeatures(await f.text(), {
          featureProjection: "EPSG:3857",
        })
      );
    else if (name.endsWith(".kml"))
      vectorSource.current.addFeatures(
        new KML().readFeatures(await f.text(), {
          featureProjection: "EPSG:3857",
        })
      );
    else if (name.endsWith(".zip"))
      vectorSource.current.addFeatures(
        new GeoJSON().readFeatures(
          JSON.stringify(await shp(await f.arrayBuffer())),
          { featureProjection: "EPSG:3857" }
        )
      );
    else if (name.endsWith(".dxf")) {
      const d = new DxfParser().parseSync(await f.text());
      d.entities.forEach((ent) => {
        if (ent.type === "LINE") {
          const feat = new GeoJSON().readFeature(
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [
                  [ent.start.x, ent.start.y],
                  [ent.end.x, ent.end.y],
                ],
              },
              properties: {},
            },
            { featureProjection: "EPSG:3857", dataProjection: "EPSG:4326" }
          );
          vectorSource.current.addFeature(feat);
        }
      });
    }
  };

  const handleExport = (fmt) => {
    const feats = vectorSource.current.getFeatures();
    let out = "",
      fname = "";
    if (fmt === "geojson") {
      out = new GeoJSON().writeFeatures(feats);
      fname = "export.geojson";
    }
    if (fmt === "kml") {
      out = new KML().writeFeatures(feats);
      fname = "export.kml";
    }
    if (fmt === "csv") {
      out =
        "lon,lat\n" +
        feats.map((f) => f.getGeometry().getCoordinates().join(",")).join("\n");
      fname = "export.csv";
    }
    saveAs(new Blob([out], { type: "text/plain" }), fname);
  };
  const handleClear = () => {
    history.current.undo.push(snapshot());
    vectorSource.current.clear();
  };
  const handleToggleSnap = () => {
    const m = mapInstance.current;
    if (!snapOn) {
      snapRef.current = new Snap({ source: vectorSource.current });
      m.addInteraction(snapRef.current);
    } else m.removeInteraction(snapRef.current);
    setSnapOn(!snapOn);
  };
  const handleZoom = () =>
    mapInstance.current
      .getView()
      .fit(vectorSource.current.getExtent(), { padding: [50, 50, 50, 50] });
  const toggle = () => {
    const n = theme === "dark" ? "light" : "dark";
    setTheme(n);
    localStorage.setItem("theme", n);
    document.body.classList.toggle("light", n === "light");
  };

  return (
    <div id="container">
      <HeaderBar
        onTool={handleTool}
        onImport={handleImport}
        onExport={handleExport}
        onClear={handleClear}
        onToggleSnap={handleToggleSnap}
        onZoomLayer={handleZoom}
        toggleTheme={toggle}
        theme={theme}
        snapOn={snapOn}
        importedFilename={importedFilename}
      />
      <div id="map" ref={mapRef}></div>
    </div>
  );
}
