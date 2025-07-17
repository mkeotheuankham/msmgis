import React, { useState } from "react";
import { Upload, FileText, FileJson, FileArchive, X } from "lucide-react";

const styles = {
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: 1040,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#252526",
    padding: "2rem",
    borderRadius: "8px",
    width: "500px",
    maxWidth: "90%",
    boxShadow: "0 5px 15px rgba(0,0,0,0.5)",
    position: "relative",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  closeButton: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    background: "transparent",
    border: "none",
    color: "#aaa",
    cursor: "pointer",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1.5rem",
    color: "#e0e0e0",
  },
  dropzone: {
    border: "2px dashed #444",
    borderRadius: "8px",
    padding: "2rem",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.3s",
  },
  instructions: {
    marginTop: "1rem",
    fontSize: "0.85rem",
    color: "#aaa",
  },
  fileList: {
    marginTop: "1rem",
    color: "#ccc",
  },
};

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
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>
          <X size={24} />
        </button>
        <div style={styles.header}>
          <Upload size={28} />
          <h2>ນຳເຂົ້າຂໍ້ມູນ (Import Data)</h2>
        </div>
        <div
          style={styles.dropzone}
          onClick={() => document.getElementById("fileInput").click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <p>ລາກໄຟລ໌ມາທີ່ນີ້ ຫຼື ຄລິກເພື່ອເລືອກไฟล์</p>
          <p>(Drag & Drop or Click to Upload)</p>
          <input
            type="file"
            id="fileInput"
            style={{ display: "none" }}
            accept=".csv, .kml, .zip, .geojson, .json" // Added geojson and json
            onChange={handleFileChange}
          />
          <div style={styles.instructions}>
            <p>ຮອງຮັບໄຟລ໌ປະເພດ:</p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
                marginTop: "0.5rem",
              }}
            >
              <span>
                <FileText size={16} /> CSV
              </span>
              <span>
                <FileArchive size={16} /> SHP (.zip)
              </span>
              <span>
                <FileJson size={16} /> KML / GeoJSON
              </span>
            </div>
          </div>
        </div>
        {file && <div style={styles.fileList}>Selected: {file.name}</div>}
      </div>
    </div>
  );
};

export default ImportDataModal;
