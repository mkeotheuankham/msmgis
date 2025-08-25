import React, { useState, useEffect } from "react";
import { Palette, X as CloseIcon } from "lucide-react";

// 1. Import the context hook
import { useAppContext } from "../../hooks/useAppContext";

const StyleEditorModal = () => {
  // 2. Get state and functions from the context
  const {
    isStyleEditorVisible,
    stylingLayer,
    setIsStyleEditorVisible,
    handleStyleSave,
  } = useAppContext();

  // Internal state for style properties
  const [fillColor, setFillColor] = useState("#ff00ff");
  const [strokeColor, setStrokeColor] = useState("#ff00ff");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [pointColor, setPointColor] = useState("#ff00ff");
  const [pointSize, setPointSize] = useState(7);

  // Effect to populate the form when the modal becomes visible or the layer changes
  useEffect(() => {
    if (isStyleEditorVisible && stylingLayer) {
      const currentStyle = stylingLayer.style || {};
      setFillColor(currentStyle.fillColor || "#ff00ff");
      setStrokeColor(currentStyle.strokeColor || "#ff00ff");
      setStrokeWidth(currentStyle.strokeWidth || 3);
      setPointColor(currentStyle.pointColor || "#ff00ff");
      setPointSize(currentStyle.pointSize || 7);
    }
  }, [isStyleEditorVisible, stylingLayer]);

  // Local onClose handler
  const onClose = () => setIsStyleEditorVisible(false);

  // Local handleSave that calls the context function
  const onSave = () => {
    if (stylingLayer) {
      handleStyleSave(stylingLayer.id, {
        fillColor,
        strokeColor,
        strokeWidth,
        pointColor,
        pointSize,
      });
    }
    onClose();
  };

  // Do not render if not visible or no layer is selected for styling
  if (!isStyleEditorVisible || !stylingLayer) return null;

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
      position: relative; width: 350px; max-width: 90%;
      animation: modal-fade-in 0.3s ease-out;
    }
    @keyframes modal-fade-in {
      from { opacity: 0; transform: translateY(20px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .modal-title {
      margin: 0; padding-bottom: 1rem; margin-bottom: 1rem;
      border-bottom: 1px solid #4a4d52; font-size: 1.25rem; font-weight: 600;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .close-button {
      background: transparent; border: none; color: #a0a0a0; cursor: pointer;
      position: absolute; top: 1rem; right: 1rem; padding: 0.25rem;
    }
    .close-button:hover { color: #ffffff; }
    .style-group { margin-bottom: 1.5rem; }
    .style-group:last-of-type { margin-bottom: 1rem; }
    .style-group h4 {
      font-size: 0.9rem; color: #00aaff; margin-bottom: 1rem;
      border-bottom: 1px solid #4a4d52; padding-bottom: 0.5rem;
    }
    .style-control {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1rem; font-size: 0.9rem;
    }
    .style-control label { color: #a0a0a0; }
    .style-control input[type="color"] {
      -webkit-appearance: none; -moz-appearance: none; appearance: none;
      border: none; width: 40px; height: 25px; cursor: pointer;
      background-color: transparent;
    }
    .style-control input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
    .style-control input[type="color"]::-webkit-color-swatch { border: 1px solid #5a5d62; border-radius: 4px; }
    .style-control input[type="color"]::-moz-color-swatch { border: 1px solid #5a5d62; border-radius: 4px; }
    .style-control input[type="range"] { width: 140px; cursor: pointer; }
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
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h2 className="modal-title">
            <Palette size={18} /> Edit Layer Style
          </h2>
          <button onClick={onClose} className="close-button">
            <CloseIcon size={24} />
          </button>

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

          <div className="modal-footer">
            <button className="modal-button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="modal-button" onClick={onSave}>
              Save Style
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StyleEditorModal;
