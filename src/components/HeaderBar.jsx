import React, { useState, useRef } from "react";
import {
  FaDrawPolygon,
  FaUndo,
  FaRedo,
  FaTrash,
  FaBezierCurve,
  FaSun,
  FaMoon,
  FaLayerGroup,
  FaFileImport,
  FaSave,
} from "react-icons/fa";

export default function HeaderBar({
  onTool,
  onImport,
  onExport,
  onClear,
  onToggleSnap,
  onZoomLayer,
  toggleTheme,
  theme,
  snapOn,
  importedFilename,
}) {
  const [tab, setTab] = useState("tools");
  const [exportFormat, setExportFormat] = useState("geojson");
  const fileInput = useRef(null);

  return (
    <div id="header">
      <div className="ribbon-tabs">
        {["tools", "layers", "import"].map((t) => (
          <div
            key={t}
            className={`ribbon-tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>
      <div className="ribbon-content">
        {tab === "tools" && (
          <>
            <div className="ribbon-group">
              <label>Draw</label>
              <button
                className="ribbon-button"
                onClick={() => onTool("LineString")}
              >
                <FaDrawPolygon /> Draw Line
              </button>
            </div>
            <div className="ribbon-group">
              <label>History</label>
              <button className="ribbon-button" onClick={() => onTool("undo")}>
                <FaUndo /> Undo
              </button>
              <button className="ribbon-button" onClick={() => onTool("redo")}>
                <FaRedo /> Redo
              </button>
            </div>
            <div className="ribbon-group">
              <label>Map</label>
              <button className="ribbon-button" onClick={onClear}>
                <FaTrash /> Clear
              </button>
              <button className="ribbon-button" onClick={onToggleSnap}>
                <FaBezierCurve /> Snap: {snapOn ? "On" : "Off"}
              </button>
              <button className="ribbon-button" onClick={toggleTheme}>
                {theme === "dark" ? <FaSun /> : <FaMoon />} Theme
              </button>
            </div>
            <div className="ribbon-group">
              <label>Export</label>
              <select
                className="export-select"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="geojson">GeoJSON</option>
                <option value="kml">KML</option>
                <option value="csv">CSV</option>
              </select>
              <button
                className="ribbon-button"
                onClick={() => onExport(exportFormat)}
              >
                <FaSave /> Save
              </button>
            </div>
          </>
        )}
        {tab === "layers" && (
          <div className="ribbon-group">
            <label>Layers</label>
            <button className="ribbon-button" onClick={onZoomLayer}>
              <FaLayerGroup /> Zoom Layer
            </button>
          </div>
        )}
        {tab === "import" && (
          <div className="ribbon-group">
            <label>Import</label>
            <button
              className="ribbon-button"
              onClick={() => fileInput.current.click()}
            >
              <FaFileImport /> Import File
            </button>
            <input
              type="file"
              ref={fileInput}
              accept=".geojson,.kml,.csv,.zip,.shp,.dxf"
              style={{ display: "none" }}
              onChange={(e) => onImport(e.target.files[0])}
            />
            {importedFilename && (
              <small className="imported-file">📄 {importedFilename}</small>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
