import React, { useEffect, useRef } from "react";
import { X, Info } from "lucide-react";

const AttributePanel = ({ info, onClose, map }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!info || !map || !panelRef.current) return;

    // This logic positions the panel based on the map's viewport pixel.
    // It ensures the panel doesn't go off-screen.
    const pixel = map.getPixelFromCoordinate(info.coordinate);
    const mapSize = map.getSize();
    const panelElement = panelRef.current;

    let left = pixel[0] + 20;
    let top = pixel[1] - 20;

    // Adjust if panel goes out of bounds
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
  }, [info, map]);

  if (!info || !info.attributes) return null;

  // Filter out the geometry property from being displayed
  const attributesToShow = Object.entries(info.attributes).filter(
    ([key]) => key.toLowerCase() !== "geometry"
  );

  return (
    <div ref={panelRef} className="attribute-panel">
      <div className="attribute-panel-header">
        <div className="attribute-panel-title">
          <Info size={16} />
          <span>Feature Attributes</span>
        </div>
        <button onClick={onClose} className="attribute-panel-close-btn">
          <X size={18} />
        </button>
      </div>
      <div className="attribute-panel-content">
        {attributesToShow.length > 0 ? (
          <div className="attribute-list">
            {attributesToShow.map(([key, value]) => (
              <div className="attribute-item" key={key}>
                <div className="attribute-key">{key}</div>
                <div className="attribute-value">{String(value) || "N/A"}</div>
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
  );
};

export default AttributePanel;
