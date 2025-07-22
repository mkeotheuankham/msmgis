import React, { useState, useRef, useEffect } from "react";
import { X as CloseIcon, UploadCloud } from "lucide-react";

const ImageLayerModal = ({ isVisible, onClose, onAddImage, projections }) => {
  const [imageFile, setImageFile] = useState(null);
  const [xmlFile, setXmlFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [extent, setExtent] = useState({ x1: "", y1: "", x2: "", y2: "" });
  const [selectedProj, setSelectedProj] = useState("WGS84_UTM48N");
  const fileInputRef = useRef(null);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isVisible) {
      setImageFile(null);
      setXmlFile(null);
      setImageUrl(null);
      setExtent({ x1: "", y1: "", x2: "", y2: "" });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isVisible]);

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length === 0) return;

    let img, xml;
    for (const file of files) {
      if (file.name.toLowerCase().endsWith(".xml")) {
        xml = file;
      } else if (
        [".jpg", ".jpeg", ".png", ".gif"].some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        )
      ) {
        img = file;
      }
    }

    if (img) {
      setImageFile(img);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(URL.createObjectURL(img));
    }
    if (xml) {
      setXmlFile(xml);
    }

    if (img && xml) {
      processGeoreferencedImage(img, xml);
    }
  };

  const processGeoreferencedImage = (imageFile, xmlFile) => {
    const xmlReader = new FileReader();
    xmlReader.onload = (e) => {
      try {
        const xmlText = e.target.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");

        const srsNode = xmlDoc.querySelector("SRS");
        const geoTransformNode = xmlDoc.querySelector("GeoTransform");

        if (!srsNode || !geoTransformNode) {
          throw new Error(
            "The provided XML file does not contain valid SRS or GeoTransform data."
          );
        }

        const srsText = srsNode.textContent;
        const geoTransformText = geoTransformNode.textContent;

        const projMatch = srsText.match(/PROJCS\["([^"]+)"/);
        if (!projMatch) {
          throw new Error(
            "Could not parse projection name from XML's SRS tag."
          );
        }
        const projNameFromXml = projMatch[1];

        const projectionMapping = {
          Lao97_UTM48: "LAO1997_UTM48N",
          Lao97_UTM47: "LAO1997_UTM47N",
        };
        const projectionKey = projectionMapping[projNameFromXml];
        if (!projectionKey) {
          throw new Error(
            `Projection "${projNameFromXml}" from XML is not supported yet.`
          );
        }

        const gt = geoTransformText.split(",").map(Number);

        const img = new Image();
        img.onload = () => {
          const width = img.width;
          const height = img.height;

          const minX = gt[0];
          const maxY = gt[3];
          const maxX = gt[0] + width * gt[1] + height * gt[2];
          const minY = gt[3] + width * gt[4] + height * gt[5];

          const calculatedExtent = [minX, minY, maxX, maxY];

          onAddImage(imageFile, calculatedExtent, projectionKey);
          onClose();
        };
        img.onerror = () => {
          throw new Error("Could not load image to determine its dimensions.");
        };
        img.src = URL.createObjectURL(imageFile);
      } catch (error) {
        alert(`Error processing XML file: ${error.message}`);
        // Reset files if processing fails to allow manual input
        setImageFile(null);
        setXmlFile(null);
        setImageUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    xmlReader.readAsText(xmlFile);
  };

  // **ແກ້ໄຂ:** ເພີ່ມ function handleExtentChange ກັບຄືນມາ
  const handleExtentChange = (e) => {
    const { name, value } = e.target;
    setExtent((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualAddClick = () => {
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
    onClose();
  };

  if (!isVisible) return null;

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
    .file-input-label {
        border: 2px dashed #4a4d52; border-radius: 8px;
        padding: 2rem; text-align: center; color: #a0a0a0;
        cursor: pointer; transition: all 0.2s ease;
    }
    .file-input-label:hover {
        border-color: #00aaff; background-color: #3a3d42; color: #f0f0f0;
    }
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
            <label>Select Image File (and optional .xml)</label>
            <label htmlFor="image-input" className="file-input-label">
              <UploadCloud size={24} style={{ margin: "0 auto 0.5rem auto" }} />
              {imageFile
                ? `Selected: ${imageFile.name}${xmlFile ? " (+ XML)" : ""}`
                : "Click to select files"}
            </label>
            <input
              id="image-input"
              type="file"
              accept="image/png, image/jpeg, image/gif, .xml"
              onChange={handleFileChange}
              ref={fileInputRef}
              multiple
              style={{ display: "none" }}
            />
          </div>

          {imageUrl && !xmlFile && (
            <div className="image-preview">
              <img src={imageUrl} alt="Preview" />
            </div>
          )}

          {imageFile && !xmlFile && (
            <>
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
                <button className="modal-button" onClick={handleManualAddClick}>
                  Add to Map
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ImageLayerModal;
