import React, { useState, useRef, useEffect, useCallback } from "react";
import { X as CloseIcon, UploadCloud } from "lucide-react";

// 1. Import the context hook
import { useAppContext } from "../../hooks/useAppContext";

const ImageLayerModal = () => {
  // 2. Get state and functions from the context
  const { isImageModalVisible, setIsImageModalVisible, handleAddImageLayer } =
    useAppContext();

  const [selectedFileText, setSelectedFileText] = useState(
    "Click or Drag & Drop Files Here"
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // States for dragging functionality
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  // Local onClose handler that uses the setter from context
  const onClose = () => setIsImageModalVisible(false);

  // Effect to center the modal when it first appears
  useEffect(() => {
    if (isImageModalVisible && modalRef.current) {
      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;
      setPosition({
        x: (window.innerWidth - modalWidth) / 2,
        y: (window.innerHeight - modalHeight) / 2,
      });
    }
  }, [isImageModalVisible]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isImageModalVisible) {
      setSelectedFileText("Click or Drag & Drop Files Here");
      setIsDragging(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isImageModalVisible]);

  const processFiles = (files) => {
    if (!files || files.length === 0) return;

    let img, xml;
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".tif", ".tiff"];

    for (const file of files) {
      if (file.name.toLowerCase().endsWith(".xml")) {
        xml = file;
      } else if (
        imageExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
      ) {
        img = file;
      }
    }

    if (img && xml) {
      setSelectedFileText(`Processing: ${img.name} + XML`);
      processGeoreferencedImage(img, xml);
    } else if (img) {
      setSelectedFileText(`Selected: ${img.name} (Missing .xml file)`);
      alert(
        "Please select both the image file and its corresponding .xml file at the same time for automatic import."
      );
    } else {
      alert(
        "Please select a valid image file (.jpg, .png, .tif) and its .xml file."
      );
    }
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
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

          // Use the handler from the context
          handleAddImageLayer(imageFile, calculatedExtent, projectionKey);
          onClose();
        };
        img.onerror = () => {
          throw new Error("Could not load image to determine its dimensions.");
        };
        img.src = URL.createObjectURL(imageFile);
      } catch (error) {
        alert(`Error processing XML file: ${error.message}`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSelectedFileText("Click or Drag & Drop Files Here");
      }
    };
    xmlReader.readAsText(xmlFile);
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

  // Handlers for Drag & Drop files
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
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

  if (!isImageModalVisible) return null;

  const styles = `
  .modal-overlay-draggable {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background-color: rgba(0, 0, 0, 0.25);
    z-index: 1040;
    pointer-events: ${isWindowDragging ? "auto" : "none"};
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-content-draggable {
    position: absolute;
    background: rgba(30, 32, 36, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    color: #f0f0f0;
    width: 90%;
    max-width: 480px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    pointer-events: auto;
    overflow: hidden;
    animation: fade-in 0.25s ease-out;
  }

  @keyframes fade-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .modal-title-draggable {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    user-select: none;
    cursor: move;
    background: rgba(255, 255, 255, 0.02);
  }

  .modal-body {
    padding: 1.25rem;
    overflow-y: auto;
    flex: 1;
  }

  .close-button {
    background: transparent;
    border: none;
    color: #ccc;
    cursor: pointer;
    position: absolute;
    top: 0.75rem;
    right: 1rem;
    padding: 0.25rem;
    transition: color 0.2s ease;
  }

  .close-button:hover {
    color: #fff;
  }

  .file-input-label {
    border: 2px dashed rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 2rem 1rem;
    text-align: center;
    color: #a0a0a0;
    background-color: rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: all 0.25s ease;
    display: block;
  }

  .file-input-label.dragging,
  .file-input-label:hover {
    border-color: #00aaff;
    background-color: rgba(0, 170, 255, 0.1);
    color: #f0f0f0;
    box-shadow: 0 0 10px rgba(0, 170, 255, 0.2);
  }

  .file-input-instructions {
    font-size: 0.85rem;
    color: #aaa;
    margin-top: 0.75rem;
  }
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
            <UploadCloud size={16} /> Import Georeferenced Image
          </div>
          <button className="close-button" onClick={onClose}>
            <CloseIcon size={24} />
          </button>

          <div className="modal-body">
            <label
              htmlFor="image-input"
              className={`file-input-label ${isDragging ? "dragging" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              <UploadCloud
                size={32}
                style={{ margin: "0 auto 0.75rem auto" }}
              />
              {isDragging ? "Release to import" : selectedFileText}
              <p className="file-input-instructions">
                Select both image and .xml file together
              </p>
            </label>
            <input
              id="image-input"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/tiff,.xml"
              onChange={handleFileChange}
              ref={fileInputRef}
              multiple
              style={{ display: "none" }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ImageLayerModal;
