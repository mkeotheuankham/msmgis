import React, { useState, useRef, useEffect } from "react";
import { X as CloseIcon } from "lucide-react";

// Component ທີ່ລວມ CSS ໄວ້ໃນຕົວ
const ImageLayerModal = ({ isVisible, onClose, onAddImage, projections }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [extent, setExtent] = useState({ x1: "", y1: "", x2: "", y2: "" });
  const [selectedProj, setSelectedProj] = useState("WGS84_UTM48N");
  const fileInputRef = useRef(null);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isVisible) {
      setImageFile(null);
      setImageUrl(null);
      setExtent({ x1: "", y1: "", x2: "", y2: "" });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isVisible]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Revoke previous object URL to prevent memory leaks
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const handleExtentChange = (e) => {
    const { name, value } = e.target;
    setExtent((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClick = () => {
    if (!imageFile || !extent.x1 || !extent.y1 || !extent.x2 || !extent.y2) {
      alert("Please select an image and fill in all coordinate fields.");
      return;
    }
    const numericExtent = [
      parseFloat(extent.x1),
      parseFloat(extent.y1),
      parseFloat(extent.x2),
      parseFloat(extent.y2),
    ];
    onAddImage(imageFile, numericExtent, selectedProj);
    onClose(); // Close after adding
  };

  if (!isVisible) return null;

  // CSS Styles embedded within the component
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
      position: relative; width: 600px; max-width: 95%;
      animation: modal-fade-in 0.3s ease-out;
    }
    @keyframes modal-fade-in {
      from { opacity: 0; transform: translateY(20px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .modal-title {
      margin: 0; padding-bottom: 1rem; margin-bottom: 1rem;
      border-bottom: 1px solid #4a4d52; font-size: 1.25rem; font-weight: 600;
    }
    .close-button {
      background: transparent; border: none; color: #a0a0a0; cursor: pointer;
      position: absolute; top: 1rem; right: 1rem; padding: 0.25rem;
    }
    .close-button:hover { color: #ffffff; }
    .form-group {
      display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;
    }
    .form-group label { font-size: 0.9rem; color: #a0a0a0; }
    .modal-input, .modal-content select {
      width: 100%; padding: 0.75rem; background-color: #1a1d21;
      border: 1px solid #4a4d52; border-radius: 6px; color: #f0f0f0;
      font-size: 1rem; transition: border-color 0.2s; box-sizing: border-box;
    }
    .modal-input:focus, .modal-content select:focus {
      outline: none; border-color: #00aaff;
    }
    .image-preview {
      text-align: center; margin: 1rem 0; padding: 0.5rem;
      background-color: #1a1d21; border-radius: 6px; border: 1px solid #4a4d52;
    }
    .image-preview img { max-width: 100%; max-height: 200px; border-radius: 4px; }
    .coordinate-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
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
    .modal-button-secondary { background-color: #4a4d52; color: #f0f0f0; }
    .modal-button-secondary:hover { background-color: #5a5d62; }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="close-button" onClick={onClose}>
            <CloseIcon size={24} />
          </button>
          <h2 className="modal-title">Import Cadastral Map Image</h2>

          <div className="form-group">
            <label>Select Image File</label>
            <input
              type="file"
              accept="image/png, image/jpeg, image/gif"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="modal-input"
            />
          </div>

          {imageUrl && (
            <div className="image-preview">
              <img src={imageUrl} alt="Preview" />
            </div>
          )}

          <div className="form-group">
            <label>Coordinate System of Input</label>
            <select
              value={selectedProj}
              onChange={(e) => setSelectedProj(e.target.value)}
            >
              {projections.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <p style={{ marginTop: "1rem", color: "#a0a0a0" }}>
            Enter the map coordinates for the corners of the image:
          </p>
          <div className="coordinate-grid">
            <div className="form-group">
              <label>Bottom-Left X (Easting)</label>
              <input
                type="number"
                name="x1"
                value={extent.x1}
                onChange={handleExtentChange}
                placeholder="e.g., 482855"
                className="modal-input"
              />
            </div>
            <div className="form-group">
              <label>Bottom-Left Y (Northing)</label>
              <input
                type="number"
                name="y1"
                value={extent.y1}
                onChange={handleExtentChange}
                placeholder="e.g., 1986445"
                className="modal-input"
              />
            </div>
            <div className="form-group">
              <label>Top-Right X (Easting)</label>
              <input
                type="number"
                name="x2"
                value={extent.x2}
                onChange={handleExtentChange}
                placeholder="e.g., 482955"
                className="modal-input"
              />
            </div>
            <div className="form-group">
              <label>Top-Right Y (Northing)</label>
              <input
                type="number"
                name="y2"
                value={extent.y2}
                onChange={handleExtentChange}
                placeholder="e.g., 1986545"
                className="modal-input"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="modal-button" onClick={handleAddClick}>
              Add to Map
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImageLayerModal;
