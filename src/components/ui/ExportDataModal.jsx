import React, { useState, useEffect, useRef, useCallback } from "react";
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

  // States for dragging functionality
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  // Effect to center the modal when it first appears
  useEffect(() => {
    if (isVisible && modalRef.current) {
      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;
      setPosition({
        x: (window.innerWidth - modalWidth) / 2,
        y: (window.innerHeight - modalHeight) / 2,
      });
    }
  }, [isVisible]);

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

  const handleExportClick = () => {
    if (!selectedLayerId) {
      alert("Please select a layer to export.");
      return;
    }
    onExport(selectedLayerId, exportFormat);
    onClose();
  };

  // Handlers for dragging the window
  const handleMouseDown = useCallback((e) => {
    if (modalRef.current) {
      setIsWindowDragging(true);
      setOffset({
        x: e.clientX - modalRef.current.offsetLeft,
        y: e.clientY - modalRef.current.offsetTop,
      });
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (isWindowDragging) {
        setPosition({
          x: e.clientX - offset.x,
          y: e.clientY - offset.y,
        });
      }
    },
    [isWindowDragging, offset]
  );

  const handleMouseUp = useCallback(() => {
    setIsWindowDragging(false);
  }, []);

  useEffect(() => {
    if (isWindowDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isWindowDragging, handleMouseMove, handleMouseUp]);

  if (!isVisible) return null;

  const styles = `
    .modal-overlay-draggable {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      z-index: 1040;
      pointer-events: ${isWindowDragging ? "auto" : "none"};
    }
    .modal-content-draggable {
      position: absolute;
      background: rgba(26, 29, 33, 0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
      display: flex; flex-direction: column; color: #f0f0f0;
      width: 450px;
      max-width: 90%;
      animation: modal-fade-in 0.3s ease-out;
      pointer-events: auto;
      overflow: hidden;
    }
    @keyframes modal-fade-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-title-draggable {
      margin: 0; padding: 0.75rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-size: 1.1rem; font-weight: 600;
      cursor: move;
      display: flex; align-items: center; gap: 0.5rem;
      user-select: none;
    }
    .modal-body {
        padding: 1.5rem;
    }
    .close-button {
      background: transparent; border: none; color: #a0a0a0; cursor: pointer;
      position: absolute; top: 0.75rem; right: 1rem; padding: 0.25rem;
    }
    .close-button:hover { color: #ffffff; }
    .export-group { margin-bottom: 1.5rem; }
    .export-group h4 { font-size: 0.9rem; color: #00aaff; margin-bottom: 0.75rem; }
    .modal-input, .modal-content-draggable select {
      width: 100%; padding: 0.75rem; background-color: #1a1d21;
      border: 1px solid #4a4d52; border-radius: 6px; color: #f0f0f0;
      font-size: 1rem; transition: border-color 0.2s; box-sizing: border-box;
    }
    .modal-input:focus, .modal-content-draggable select:focus {
      outline: none; border-color: #00aaff;
    }
    .format-buttons {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 0.75rem;
    }
    .format-button {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 0.5rem; padding: 1rem 0.5rem;
      background-color: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);
      color: #a0a0a0; border-radius: 6px; cursor: pointer; transition: all 0.2s;
    }
    .format-button:hover { background-color: rgba(255,255,255,0.1); color: #f0f0f0; }
    .format-button.active {
      background-color: #007acc; border-color: #00aaff;
      color: white; font-weight: 600;
    }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 1rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background-color: rgba(0,0,0,0.2);
    }
    .modal-button, .modal-button-secondary {
      padding: 0.6rem 1.2rem; border: none; border-radius: 6px;
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
      <div
        className="modal-overlay-draggable"
        style={{ pointerEvents: isWindowDragging ? "auto" : "none" }}
      >
        <div
          className="modal-content-draggable"
          ref={modalRef}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            pointerEvents: "auto",
          }}
        >
          <div className="modal-title-draggable" onMouseDown={handleMouseDown}>
            <Download size={16} /> Export Data
          </div>
          <button onClick={onClose} className="close-button">
            <CloseIcon size={24} />
          </button>

          <div className="modal-body">
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
