import React, { useEffect, useRef } from "react";
import { X as CloseIcon, Info } from "lucide-react";

// 1. Import the context hook
import { useAppContext } from "../../hooks/useAppContext";

const AttributePanel = () => {
  // 2. Get state and functions from the context
  const { selectedFeatureInfo, handleCloseAttributeInfo, mapInstance } =
    useAppContext();

  const panelRef = useRef(null);

  useEffect(() => {
    // Use state from context
    if (!selectedFeatureInfo || !mapInstance || !panelRef.current) return;

    const pixel = mapInstance.getPixelFromCoordinate(
      selectedFeatureInfo.coordinate
    );
    const mapSize = mapInstance.getSize();
    const panelElement = panelRef.current;

    let left = pixel[0] + 20;
    let top = pixel[1] - 20;

    // Adjust position to keep the panel within the map viewport
    if (left + panelElement.offsetWidth > mapSize[0] - 10) {
      left = pixel[0] - panelElement.offsetWidth - 20;
    }
    if (top + panelElement.offsetHeight > mapSize[1] - 10) {
      top = mapSize[1] - panelElement.offsetHeight - 10;
    }
    if (top < 10) {
      top = 10;
    }
    if (left < 10) {
      left = 10;
    }

    panelElement.style.left = `${left}px`;
    panelElement.style.top = `${top}px`;
  }, [selectedFeatureInfo, mapInstance]); // Update dependency array

  // Do not render if there is no feature info
  if (!selectedFeatureInfo || !selectedFeatureInfo.attributes) return null;

  const attributesToShow = Object.entries(
    selectedFeatureInfo.attributes
  ).filter(([key]) => key.toLowerCase() !== "geometry");

  const styles = `
    .attribute-panel {
      position: absolute;
      background-color: rgba(42, 45, 50, 0.9);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid #4a4d52;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      z-index: 1020;
      width: 320px;
      max-height: 350px;
      display: flex;
      flex-direction: column;
      color: #f0f0f0;
      animation: attribute-panel-fade-in 0.3s ease-out;
    }
    @keyframes attribute-panel-fade-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .attribute-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #4a4d52;
    }
    .attribute-panel-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 1rem;
    }
    .attribute-panel-close-btn {
      background: transparent;
      border: none;
      color: #a0a0a0;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .attribute-panel-close-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
    .attribute-panel-content {
      padding: 1rem;
      overflow-y: auto;
    }
    .attribute-panel-content::-webkit-scrollbar { width: 6px; }
    .attribute-panel-content::-webkit-scrollbar-track { background: transparent; }
    .attribute-panel-content::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.2); border-radius: 3px; }
    .attribute-panel-content::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.4); }
    .attribute-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .attribute-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .attribute-key {
      font-size: 0.75rem;
      color: #a0a0a0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .attribute-value {
      font-size: 0.9rem;
      color: #f0f0f0;
      background-color: #1a1d21;
      padding: 0.5rem;
      border-radius: 4px;
      word-break: break-all;
      border: 1px solid #4a4d52;
    }
    .no-items-message {
      font-style: italic;
      color: #a0a0a0;
      text-align: center;
      padding: 15px 0;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div ref={panelRef} className="attribute-panel">
        <div className="attribute-panel-header">
          <div className="attribute-panel-title">
            <Info size={16} />
            <span>Feature Attributes</span>
          </div>
          <button
            onClick={handleCloseAttributeInfo}
            className="attribute-panel-close-btn"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="attribute-panel-content">
          {attributesToShow.length > 0 ? (
            <div className="attribute-list">
              {attributesToShow.map(([key, value]) => (
                <div className="attribute-item" key={key}>
                  <div className="attribute-key">{key}</div>
                  <div className="attribute-value">
                    {String(value) || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-items-message">
              No attributes found for this feature.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default AttributePanel;
