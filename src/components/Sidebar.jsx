import React, { useState, useRef } from "react";

const Sidebar = ({
  onTool,
  onImport,
  onExport,
  onClear,
  onToggleSnap,
  onZoomLayer,
  toggleTheme,
  theme,
  snapOn,
  layers,
  inspector,
  importedFilename,
}) => {
  const [tab, setTab] = useState("tools");
  const [exportFormat, setExportFormat] = useState("geojson");
  const fileInput = useRef(null);

  return (
    <div id="sidebar">
      <div id="tabs">
        <div
          className={`tab ${tab === "tools" ? "active" : ""}`}
          onClick={() => setTab("tools")}
        >
          Tools
        </div>
        <div
          className={`tab ${tab === "layers" ? "active" : ""}`}
          onClick={() => setTab("layers")}
        >
          Layers
        </div>
        <div
          className={`tab ${tab === "import" ? "active" : ""}`}
          onClick={() => setTab("import")}
        >
          Import
        </div>
      </div>
      <div id="content">
        {tab === "tools" && (
          <>
            <button onClick={() => onTool("LineString")}>✏️ Draw Line</button>
            <button onClick={() => onTool("undo")}>↩️ Undo</button>
            <button onClick={() => onTool("redo")}>↪️ Redo</button>
            <button onClick={onClear}>🗑️ Clear</button>
            <button onClick={onToggleSnap}>
              📍 Snap {snapOn ? "On" : "Off"}
            </button>
            <button onClick={toggleTheme}>🌓 Theme: {theme}</button>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <option value="geojson">GeoJSON</option>
              <option value="kml">KML</option>
              <option value="csv">CSV</option>
            </select>
            <button onClick={() => onExport(exportFormat)}>💾 Export</button>
          </>
        )}
        {tab === "layers" && (
          <>
            <button onClick={onZoomLayer}>🔍 Zoom to Layer</button>
            <ul>
              {layers.map((l) => (
                <li key={l.uid}>
                  <input
                    type="checkbox"
                    checked={l.visible}
                    onChange={() => l.toggle()}
                  />
                  {l.title}
                </li>
              ))}
            </ul>
            <div>
              <h4>Inspector</h4>
              {inspector
                ? Object.entries(inspector.getProperties()).map(([k, v]) => (
                    <div key={k}>
                      <b>{k}</b>: {String(v)}
                    </div>
                  ))
                : "No feature selected"}
            </div>
          </>
        )}
        {tab === "import" && (
          <>
            <button onClick={() => fileInput.current.click()}>
              📥 Upload File
            </button>
            <input
              type="file"
              ref={fileInput}
              accept=".geojson,.kml,.csv,.zip,.shp,.dxf"
              style={{ display: "none" }}
              onChange={(e) => onImport(e.target.files[0])}
            />
            {importedFilename && (
              <p>
                <b>📄 Imported:</b> {importedFilename}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
