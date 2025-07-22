import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  FileJson,
  FileArchive,
  X as CloseIcon,
} from "lucide-react";

const ImportDataModal = ({ isVisible, onClose, onFileImport }) => {
  const [file, setFile] = useState(null);

  // Reset local state when the modal is closed
  useEffect(() => {
    if (!isVisible) {
      setFile(null);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      onFileImport(selectedFile);
      onClose();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      onFileImport(droppedFile);
      onClose();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // CSS Styles embedded within the component
  const styles = `
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background-color: rgba(0, 0, 0, 0.6); z-index: 1040;
      display: flex; justify-content: center; align-items: center;
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    }
    .modal-content {
      background: rgba(26, 29, 33, 0.8); /* Semi-transparent background */
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5); padding: 1.5rem;
      display: flex; flex-direction: column; color: #f0f0f0;
      position: relative; width: 500px; max-width: 90%;
      animation: modal-fade-in 0.3s ease-out;
    }
    @keyframes modal-fade-in {
      from { opacity: 0; transform: translateY(20px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .modal-title {
      margin: 0; padding-bottom: 1rem; margin-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-size: 1.25rem; font-weight: 600;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .close-button {
      background: transparent; border: none; color: #a0a0a0; cursor: pointer;
      position: absolute; top: 1rem; right: 1rem; padding: 0.25rem;
    }
    .close-button:hover { color: #ffffff; }
    .dropzone {
      border: 2px dashed rgba(255, 255, 255, 0.2); border-radius: 8px;
      padding: 2.5rem; text-align: center; color: #a0a0a0;
      background-color: rgba(0, 0, 0, 0.2);
      cursor: pointer; transition: border-color 0.3s, background-color 0.3s;
    }
    .dropzone:hover {
      border-color: #00aaff; background-color: rgba(0, 170, 255, 0.1);
    }
    .dropzone p { margin: 0.5rem 0; font-size: 1rem; color: #f0f0f0; }
    .instructions {
      margin-top: 1.5rem; font-size: 0.85rem; color: #a0a0a0;
    }
    .instructions > div {
      display: flex; justify-content: center; gap: 1.5rem;
      margin-top: 0.75rem; color: #f0f0f0;
    }
    .instructions span { display: flex; align-items: center; gap: 0.5rem; }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h2 className="modal-title">
            <Upload size={22} /> Import Vector Data
          </h2>
          <button onClick={onClose} className="close-button">
            <CloseIcon size={24} />
          </button>

          <div
            className="dropzone"
            onClick={() => document.getElementById("fileInput").click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <p>Drag & Drop File Here or Click to Select</p>
            <input
              type="file"
              id="fileInput"
              style={{ display: "none" }}
              accept=".csv,.kml,.zip,.geojson,.json"
              onChange={handleFileChange}
            />
            <div className="instructions">
              <p>Supported File Types:</p>
              <div>
                <span>
                  <FileText size={16} /> CSV
                </span>
                <span>
                  <FileArchive size={16} /> SHP (.zip)
                </span>
                <span>
                  <FileJson size={16} /> KML/GeoJSON
                </span>
              </div>
            </div>
          </div>

          {file && (
            <div
              style={{ marginTop: "1rem", color: "#ccc", textAlign: "center" }}
            >
              Selected: {file.name}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ImportDataModal;
