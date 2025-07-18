import React, { useState } from "react";
import "./Modals.css";
import { Upload, FileText, FileJson, FileArchive, X } from "lucide-react";

const ImportDataModal = ({ isVisible, onClose, onFileImport }) => {
  const [file, setFile] = useState(null);

  if (!isVisible) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      onFileImport(selectedFile);
      onClose(); // Close modal after file is selected
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      onFileImport(droppedFile);
      onClose();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="floating-panel-backdrop" onClick={onClose}>
      <div
        className="floating-panel import-data-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <h3>
            <Upload size={22} /> ນຳເຂົ້າຂໍ້ມູນ (Import Data)
          </h3>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>
        <div
          className="dropzone"
          onClick={() => document.getElementById("fileInput").click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <p>ລາກໄຟລ໌ມາທີ່ນີ້ ຫຼື ຄລິກເພື່ອເລືອກ</p>
          <p>(Drag & Drop or Click to Upload)</p>
          <input
            type="file"
            id="fileInput"
            style={{ display: "none" }}
            accept=".csv,.kml,.zip,.geojson,.json"
            onChange={handleFileChange}
          />
          <div className="instructions">
            <p>ຮອງຮັບໄຟລ໌ປະເພດ:</p>
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
          <div style={{ marginTop: "1rem", color: "#ccc" }}>
            Selected: {file.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportDataModal;
