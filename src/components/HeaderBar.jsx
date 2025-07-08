import React, { useState, useRef } from "react";
import {
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
  drawLength,
  setDrawLength,
  drawAngle,
  setDrawAngle,
  hvMode,
  onModeHV,
  onStartPolyline,
  onNextSegment,
  onFinishPolyline,
  onStartPolygon,
  onFinishPolygon,
  importedFilename,
}) {
  const fileInput = useRef(null);
  const [exportFmt, setExportFmt] = useState("geojson");

  return (
    <div id="header">
      <div className="ribbon-tabs">
        {["Tools", "Layers", "Import"].map((tab) => (
          <div key={tab} className="ribbon-tab active">
            {tab}
          </div>
        ))}
      </div>
      <div className="ribbon-content">
        <div className="ribbon-group">
          <label>Draw</label>
          <input
            type="number"
            placeholder="Length (m)"
            value={drawLength}
            onChange={(e) => setDrawLength(e.target.value)}
            style={{ padding: "4px", width: "80px", marginBottom: "4px" }}
          />
          <input
            type="number"
            placeholder="Angle (°)"
            value={drawAngle}
            onChange={(e) => setDrawAngle(e.target.value)}
            disabled={hvMode !== "A"}
            style={{ padding: "4px", width: "80px", marginBottom: "4px" }}
          />
          <button className="ribbon-button" onClick={onModeHV}>
            Mode: {hvMode}
          </button>
          <button className="ribbon-button" onClick={onStartPolyline}>
            ↔ Start Line
          </button>
          <button className="ribbon-button" onClick={onNextSegment}>
            ➕ Next
          </button>
          <button className="ribbon-button" onClick={onFinishPolyline}>
            🏁 Finish Line
          </button>
          <button className="ribbon-button" onClick={onStartPolygon}>
            ⬠ Start Polygon
          </button>
          <button className="ribbon-button" onClick={onFinishPolygon}>
            ✅ Finish Polygon
          </button>
        </div>
        <div className="ribbon-group">
          <label>Actions</label>
          <button className="ribbon-button" onClick={() => onTool("undo")}>
            <FaUndo /> Undo
          </button>
          <button className="ribbon-button" onClick={() => onTool("redo")}>
            <FaRedo /> Redo
          </button>
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
          <label>Export / Import</label>
          <select
            className="export-select"
            value={exportFmt}
            onChange={(e) => setExportFmt(e.target.value)}
          >
            <option value="geojson">GeoJSON</option>
            <option value="kml">KML</option>
            <option value="csv">CSV</option>
          </select>
          <button className="ribbon-button" onClick={() => onExport(exportFmt)}>
            <FaSave /> Export
          </button>
          <button
            className="ribbon-button"
            onClick={() => fileInput.current.click()}
          >
            <FaFileImport /> Import
          </button>
          <input
            type="file"
            ref={fileInput}
            accept=".geojson,.kml,.csv,.zip,.shp,.dxf"
            style={{ display: "none" }}
            onChange={(e) => onImport(e.target.files[0])}
          />
          {importedFilename && <small>📄 {importedFilename}</small>}
        </div>
        <div className="ribbon-group">
          <label>Layers</label>
          <button className="ribbon-button" onClick={onZoomLayer}>
            <FaLayerGroup /> Zoom to Layer
          </button>
        </div>
      </div>
    </div>
  );
}
