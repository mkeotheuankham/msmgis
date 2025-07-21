import React, { useState, useEffect } from "react";
import {
  Download,
  X as CloseIcon,
  FileJson,
  FileArchive,
  FileText,
} from "lucide-react";

const ExportDataModal = ({
  isVisible,
  onClose,
  onExport,
  mapInstance,
  importedLayers,
}) => {
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [exportFormat, setExportFormat] = useState("geojson");
  const [exportableLayers, setExportableLayers] = useState([]);

  useEffect(() => {
    if (isVisible) {
      const editorLayer = mapInstance
        .getLayers()
        .getArray()
        .find((l) => l.get("name") === "editorLayer");

      const editorFeatures = editorLayer?.getSource().getFeatures() || [];

      let layers = [];
      if (editorFeatures.length > 0) {
        layers.push({
          id: "editorLayer",
          name: "Drawn Features (Editor Layer)",
        });
      }

      const imported = importedLayers.map((l) => ({ id: l.id, name: l.name }));
      const allLayers = [...layers, ...imported];
      setExportableLayers(allLayers);

      if (allLayers.length > 0) {
        setSelectedLayerId(allLayers[0].id);
      } else {
        setSelectedLayerId("");
      }
    }
  }, [isVisible, mapInstance, importedLayers]);

  if (!isVisible) return null;

  const handleExportClick = () => {
    if (!selectedLayerId) {
      alert("Please select a layer to export.");
      return;
    }
    onExport(selectedLayerId, exportFormat);
    onClose();
  };

  const styles = `
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background-color: rgba(0, 0, 0, 0.7); z-index: 1040;
      display: flex; justify-content: center; align-items: center;
      backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
    }
    .modal-content {
      background: #2a2d32; border: 1px solid #4a4d52; border-radius: 8px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5); padding: 1.5rem;
      display: flex; flex-direction: column; color: #f0f0f0;
      position: relative; width: 450px; max-width: 90%;
      animation: modal-fade-in 0.3s ease-out;
    }
    @keyframes modal-fade-in {
      from { opacity: 0; transform: translateY(20px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .modal-title {
      margin: 0; padding-bottom: 1rem; margin-bottom: 1rem;
      border-bottom: 1px solid #4a4d52; font-size: 1.25rem; font-weight: 600;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .close-button {
      background: transparent; border: none; color: #a0a0a0; cursor: pointer;
      position: absolute; top: 1rem; right: 1rem; padding: 0.25rem;
    }
    .close-button:hover { color: #ffffff; }
    .export-group { margin-bottom: 1.5rem; }
    .export-group h4 { font-size: 0.9rem; color: #00aaff; margin-bottom: 0.75rem; }
    .modal-input, .modal-content select {
      width: 100%; padding: 0.75rem; background-color: #1a1d21;
      border: 1px solid #4a4d52; border-radius: 6px; color: #f0f0f0;
      font-size: 1rem; transition: border-color 0.2s; box-sizing: border-box;
    }
    .modal-input:focus, .modal-content select:focus {
      outline: none; border-color: #00aaff;
    }
    .format-buttons {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 0.75rem;
    }
    .format-button {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 0.5rem; padding: 1rem 0.5rem;
      background-color: #3a3d42; border: 1px solid #4a4d52;
      color: #a0a0a0; border-radius: 6px; cursor: pointer; transition: all 0.2s;
    }
    .format-button:hover { background-color: #4a4d52; color: #f0f0f0; }
    .format-button.active {
      background-color: #007acc; border-color: #00aaff;
      color: white; font-weight: 600;
    }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;
      padding-top: 1rem; border-top: 1px solid #4a4d52;
    }
    .modal-button, .modal-button-secondary {
      padding: 0.75rem 1.5rem; border: none; border-radius: 6px;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .modal-button { background-color: #007acc; color: white; }
    .modal-button:hover { background-color: #00aaff; }
    .modal-button:disabled { background-color: #555; cursor: not-allowed; }
    .modal-button-secondary { background-color: #4a4d52; color: #f0f0f0; }
    .modal-button-secondary:hover { background-color: #5a5d62; }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h2 className="modal-title">
            <Download size={18} /> Export Data
          </h2>
          <button onClick={onClose} className="close-button">
            <CloseIcon size={24} />
          </button>

          <div className="export-group">
            <h4>1. Select Layer to Export</h4>
            <select
              value={selectedLayerId}
              onChange={(e) => setSelectedLayerId(e.target.value)}
            >
              {exportableLayers.length > 0 ? (
                exportableLayers.map((layer) => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name}
                  </option>
                ))
              ) : (
                <option disabled value="">
                  No exportable layers found
                </option>
              )}
            </select>
          </div>

          <div className="export-group">
            <h4>2. Select Export Format</h4>
            <div className="format-buttons">
              <button
                className={`format-button ${
                  exportFormat === "geojson" ? "active" : ""
                }`}
                onClick={() => setExportFormat("geojson")}
              >
                <FileJson size={16} /> GeoJSON
              </button>
              <button
                className={`format-button ${
                  exportFormat === "kml" ? "active" : ""
                }`}
                onClick={() => setExportFormat("kml")}
              >
                <FileArchive size={16} /> KML
              </button>
              <button
                className={`format-button ${
                  exportFormat === "csv" ? "active" : ""
                }`}
                onClick={() => setExportFormat("csv")}
              >
                <FileText size={16} /> CSV (Points)
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="modal-button"
              onClick={handleExportClick}
              disabled={exportableLayers.length === 0}
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExportDataModal;
