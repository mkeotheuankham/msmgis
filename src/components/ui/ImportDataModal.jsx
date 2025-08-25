import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  FileJson,
  FileArchive,
  X as CloseIcon,
} from "lucide-react";

// 1. Import the context hook
import { useAppContext } from "../../hooks/useAppContext";

const ImportDataModal = () => {
  // 2. Get state and functions from the context
  const { isImportModalVisible, setIsImportModalVisible, handleFileImport } =
    useAppContext();

  const [isDragging, setIsDragging] = useState(false); // For file drag over
  const fileInputRef = useRef(null);

  // States for dragging the window
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  // Local onClose handler
  const onClose = () => setIsImportModalVisible(false);

  // Effect to center the modal when it first appears
  useEffect(() => {
    if (isImportModalVisible && modalRef.current) {
      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;
      setPosition({
        x: (window.innerWidth - modalWidth) / 2,
        y: (window.innerHeight - modalHeight) / 2,
      });
    }
  }, [isImportModalVisible]);

  // Reset state when the modal is closed
  useEffect(() => {
    if (!isImportModalVisible) {
      setIsDragging(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isImportModalVisible]);

  const processFile = (file) => {
    if (file) {
      handleFileImport(file); // Use handler from context
      onClose();
    }
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
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

  if (!isImportModalVisible) return null;

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
      width: 500px;
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
    .dropzone {
      border: 2px dashed rgba(255, 255, 255, 0.2); 
      border-radius: 8px;
      padding: 2.5rem; 
      text-align: center; 
      color: #a0a0a0;
      background-color: rgba(0, 0, 0, 0.2);
      cursor: pointer; 
      transition: all 0.2s ease;
    }
    .dropzone.dragging, .dropzone:hover {
        border-color: #00aaff; 
        background-color: rgba(0, 170, 255, 0.1); 
        color: #f0f0f0;
        box-shadow: 0 0 15px rgba(0, 170, 255, 0.2);
    }
    .dropzone p { margin: 0.5rem 0; font-size: 1rem; }
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
            <Upload size={16} /> Import Vector Data
          </div>
          <button onClick={onClose} className="close-button">
            <CloseIcon size={24} />
          </button>

          <div className="modal-body">
            <div
              className={`dropzone ${isDragging ? "dragging" : ""}`}
              onClick={() => document.getElementById("fileInput").click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              <p>Drag & Drop File Here or Click to Select</p>
              <input
                type="file"
                id="fileInput"
                style={{ display: "none" }}
                accept=".csv,.kml,.zip,.geojson,.json"
                onChange={handleFileChange}
                ref={fileInputRef}
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
          </div>
        </div>
      </div>
    </>
  );
};

export default ImportDataModal;
