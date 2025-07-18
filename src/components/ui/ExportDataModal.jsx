import React, { useState, useEffect } from "react";
import { Download, X, FileJson, FileArchive, FileText } from "lucide-react";

const ExportDataModal = ({
  isVisible,
  onClose,
  onExport,
  mapInstance,
  importedLayers,
}) => {
  const [selectedLayerId, setSelectedLayerId] = useState("editorLayer");
  const [exportFormat, setExportFormat] = useState("geojson");
  const [exportableLayers, setExportableLayers] = useState([]);

  useEffect(() => {
    if (isVisible) {
      const editorLayer = mapInstance
        .getLayers()
        .getArray()
        .find((l) => l.get("name") === "editorLayer");
      const editorFeatures = editorLayer
        ? editorLayer.getSource().getFeatures()
        : [];

      let layers = [];
      if (editorFeatures.length > 0) {
        layers.push({
          id: "editorLayer",
          name: "Drawn Features (Editor Layer)",
        });
      }

      const imported = importedLayers.map((l) => ({ id: l.id, name: l.name }));
      setExportableLayers([...layers, ...imported]);

      // Set default selection
      if (layers.length > 0) {
        setSelectedLayerId("editorLayer");
      } else if (imported.length > 0) {
        setSelectedLayerId(imported[0].id);
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

  return (
    <div className="floating-panel-backdrop" onClick={onClose}>
      <div
        className="floating-panel export-data-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <h3>
            <Download size={18} /> Export Data
          </h3>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>
        <div className="panel-content">
          <div className="export-group">
            <h4>1. Select Layer to Export</h4>
            <select
              value={selectedLayerId}
              onChange={(e) => setSelectedLayerId(e.target.value)}
              className="export-select"
            >
              {exportableLayers.length > 0 ? (
                exportableLayers.map((layer) => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name}
                  </option>
                ))
              ) : (
                <option disabled>No exportable layers found</option>
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
                <FileText size={16} /> CSV (Points Only)
              </button>
            </div>
          </div>
          <button
            className="export-action-button"
            onClick={handleExportClick}
            disabled={exportableLayers.length === 0}
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDataModal;
