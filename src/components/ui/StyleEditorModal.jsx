import React, { useState, useEffect } from "react";
import { Palette, X } from "lucide-react";

const StyleEditorModal = ({ layer, isVisible, onClose, onSave }) => {
  const [fillColor, setFillColor] = useState("#ff00ff");
  const [strokeColor, setStrokeColor] = useState("#ff00ff");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [pointColor, setPointColor] = useState("#ff00ff");
  const [pointSize, setPointSize] = useState(7);

  // When the modal becomes visible, update its state with the current layer's style
  useEffect(() => {
    if (isVisible && layer && layer.style) {
      setFillColor(layer.style.fillColor || "#ff00ff");
      setStrokeColor(layer.style.strokeColor || "#ff00ff");
      setStrokeWidth(layer.style.strokeWidth || 3);
      setPointColor(layer.style.pointColor || "#ff00ff");
      setPointSize(layer.style.pointSize || 7);
    } else if (isVisible && layer && !layer.style) {
      // If no style is set, use defaults
      setFillColor("#ff00ff");
      setStrokeColor("#ff00ff");
      setStrokeWidth(3);
      setPointColor("#ff00ff");
      setPointSize(7);
    }
  }, [isVisible, layer]);

  if (!isVisible || !layer) return null;

  const handleSave = () => {
    onSave(layer.id, {
      fillColor,
      strokeColor,
      strokeWidth,
      pointColor,
      pointSize,
    });
    onClose();
  };

  return (
    <div className="floating-panel-backdrop" onClick={onClose}>
      <div
        className="floating-panel style-editor-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <h3>
            <Palette size={18} /> Edit Layer Style
          </h3>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>
        <div className="panel-content">
          <div className="style-group">
            <h4>Polygon & Line</h4>
            <div className="style-control">
              <label>Fill Color</label>
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
              />
            </div>
            <div className="style-control">
              <label>Stroke Color</label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
              />
            </div>
            <div className="style-control">
              <label>Stroke Width ({strokeWidth}px)</label>
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="style-group">
            <h4>Point</h4>
            <div className="style-control">
              <label>Point Color</label>
              <input
                type="color"
                value={pointColor}
                onChange={(e) => setPointColor(e.target.value)}
              />
            </div>
            <div className="style-control">
              <label>Point Size ({pointSize}px)</label>
              <input
                type="range"
                min="2"
                max="15"
                value={pointSize}
                onChange={(e) => setPointSize(Number(e.target.value))}
              />
            </div>
          </div>
          <button className="save-style-button" onClick={handleSave}>
            Save Style
          </button>
        </div>
      </div>
    </div>
  );
};

export default StyleEditorModal;
