import React, { useState, useEffect, useRef, useCallback } from "react";
import { X as CloseIcon, Settings, ChevronDown, ChevronUp } from "lucide-react";

const ImageEditorModal = ({
  isVisible,
  onClose,
  onSave,
  layer,
  projections,
  projectionDefs,
}) => {
  const [selectedProj, setSelectedProj] = useState("");
  const [datumParams, setDatumParams] = useState(null);
  const [showDatumParams, setShowDatumParams] = useState(false);

  // States for dragging functionality
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  // Effect to center the modal when it first appears
  useEffect(() => {
    if (isVisible && modalRef.current) {
      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;
      setPosition({
        x: (window.innerWidth - modalWidth) / 2,
        y: (window.innerHeight - modalHeight) / 2,
      });
    }
  }, [isVisible]);

  // Populate state when the modal opens with the current layer's data
  useEffect(() => {
    if (isVisible && layer) {
      const projDefArr = projectionDefs.find(
        (p) => p[0] === layer.projectionKey
      );
      setSelectedProj(layer.projectionKey);

      if (projDefArr && projDefArr[1]) {
        const towgs84Match = projDefArr[1].match(/\+towgs84=([^ ]+)/);
        if (towgs84Match) {
          const params = towgs84Match[1].split(",").map(Number);
          setDatumParams({
            dx: params[0] || 0,
            dy: params[1] || 0,
            dz: params[2] || 0,
            ex: params[3] || 0,
            ey: params[4] || 0,
            ez: params[5] || 0,
            s: params[6] || 0,
          });
        } else {
          setDatumParams(null);
        }
      }
    }
  }, [isVisible, layer, projectionDefs]);

  // Update datum fields if the user selects a new projection from the dropdown
  useEffect(() => {
    if (!isVisible) return;
    const projDefArr = projectionDefs.find((p) => p[0] === selectedProj);
    if (projDefArr && projDefArr[1]) {
      const towgs84Match = projDefArr[1].match(/\+towgs84=([^ ]+)/);
      if (towgs84Match) {
        const params = towgs84Match[1].split(",").map(Number);
        setDatumParams({
          dx: params[0] || 0,
          dy: params[1] || 0,
          dz: params[2] || 0,
          ex: params[3] || 0,
          ey: params[4] || 0,
          ez: params[5] || 0,
          s: params[6] || 0,
        });
      } else {
        setDatumParams(null);
        setShowDatumParams(false);
      }
    }
  }, [selectedProj, projectionDefs, isVisible]);

  // Handlers for dragging, wrapped in useCallback for performance
  const handleMouseDown = useCallback((e) => {
    if (modalRef.current) {
      setIsDragging(true);
      setOffset({
        x: e.clientX - modalRef.current.offsetLeft,
        y: e.clientY - modalRef.current.offsetTop,
      });
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - offset.x,
          y: e.clientY - offset.y,
        });
      }
    },
    [isDragging, offset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add and remove global mouse listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSave = () => {
    let projectionInfo = selectedProj;
    if (datumParams) {
      const projDefArr = projectionDefs.find((p) => p[0] === selectedProj);
      const originalDef = projDefArr ? projDefArr[1] : "";
      const newParamsString = [
        datumParams.dx,
        datumParams.dy,
        datumParams.dz,
        datumParams.ex,
        datumParams.ey,
        datumParams.ez,
        datumParams.s,
      ].join(",");

      const newDef = originalDef.replace(
        /\+towgs84=[^ ]+/,
        `+towgs84=${newParamsString}`
      );

      if (newDef !== originalDef) {
        const tempKey = `CUSTOM_${selectedProj}_${Date.now()}`;
        projectionInfo = { key: tempKey, def: newDef };
      }
    }
    onSave(layer.id, projectionInfo);
    onClose();
  };

  const handleDatumParamChange = (e) => {
    const { name, value } = e.target;
    setDatumParams((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  if (!isVisible || !layer) return null;

  const styles = `
    .modal-overlay-draggable {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      z-index: 1050; pointer-events: ${isDragging ? "auto" : "none"};
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
      width: 550px;
      max-width: 95%;
      animation: modal-fade-in 0.3s ease-out;
      pointer-events: auto; /* Re-enable pointer events for the modal itself */
    }
    .modal-title-draggable {
      margin: 0; padding: 0.75rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-size: 1.1rem; font-weight: 600;
      cursor: move;
      display: flex; align-items: center; gap: 0.5rem;
      user-select: none; /* Prevent text selection while dragging */
    }
    .modal-body {
        padding: 1.5rem;
        max-height: 60vh;
        overflow-y: auto;
    }
    .modal-body::-webkit-scrollbar { width: 6px; }
    .modal-body::-webkit-scrollbar-track { background: transparent; }
    .modal-body::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.2); border-radius: 3px; }
    .modal-body::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.4); }
    
    .close-button {
      background: transparent; border: none; color: #a0a0a0; cursor: pointer;
      position: absolute; top: 0.75rem; right: 1rem; padding: 0.25rem;
    }
    .close-button:hover { color: #ffffff; }
    .form-group {
      display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;
    }
    .form-group label { font-size: 0.85rem; color: #a0a0a0; }
    .modal-input, .modal-content-draggable select {
      width: 100%; padding: 0.6rem; background-color: #1a1d21;
      border: 1px solid #4a4d52; border-radius: 6px; color: #f0f0f0;
      font-size: 0.9rem; transition: border-color 0.2s; box-sizing: border-box;
    }
    .modal-input:focus, .modal-content-draggable select:focus {
      outline: none; border-color: #00aaff;
    }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 1rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background-color: rgba(0,0,0,0.2);
    }
    .modal-button, .modal-button-secondary {
      padding: 0.6rem 1.2rem; border: none; border-radius: 6px;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .modal-button { background-color: #007acc; color: white; }
    .modal-button:hover { background-color: #00aaff; }
    .modal-button-secondary { background-color: #4a4d52; color: #f0f0f0; }
    .modal-button-secondary:hover { background-color: #5a5d62; }
    .datum-section {
        margin-top: 1rem;
        background-color: rgba(0,0,0,0.2);
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.1);
    }
    .datum-header {
        padding: 0.6rem 1rem;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #a0a0a0;
        transition: color 0.2s;
    }
    .datum-header:hover { color: #f0f0f0; }
    .datum-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
        padding: 1rem;
        border-top: 1px solid rgba(255,255,255,0.1);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div
        className="modal-overlay-draggable"
        style={{ pointerEvents: isDragging ? "auto" : "none" }}
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
            <Settings size={16} /> Edit Image Layer
          </div>
          <button className="close-button" onClick={onClose}>
            <CloseIcon size={24} />
          </button>

          <div className="modal-body">
            <p
              style={{
                fontSize: "0.9rem",
                color: "#a0a0a0",
                margin: "0 0 1rem 0",
              }}
            >
              Layer: <strong>{layer.name}</strong>
            </p>

            <div className="form-group">
              <label>Coordinate System</label>
              <select
                className="modal-input"
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

            {datumParams && (
              <div className="datum-section">
                <div
                  className="datum-header"
                  onClick={() => setShowDatumParams(!showDatumParams)}
                >
                  <span>Datum Transformation Parameters</span>
                  {showDatumParams ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
                {showDatumParams && (
                  <div className="datum-grid">
                    <div className="form-group">
                      <label>dX (m)</label>
                      <input
                        type="number"
                        step="any"
                        name="dx"
                        value={datumParams.dx}
                        onChange={handleDatumParamChange}
                        className="modal-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>dY (m)</label>
                      <input
                        type="number"
                        step="any"
                        name="dy"
                        value={datumParams.dy}
                        onChange={handleDatumParamChange}
                        className="modal-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>dZ (m)</label>
                      <input
                        type="number"
                        step="any"
                        name="dz"
                        value={datumParams.dz}
                        onChange={handleDatumParamChange}
                        className="modal-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>rX (")</label>
                      <input
                        type="number"
                        step="any"
                        name="ex"
                        value={datumParams.ex}
                        onChange={handleDatumParamChange}
                        className="modal-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>rY (")</label>
                      <input
                        type="number"
                        step="any"
                        name="ey"
                        value={datumParams.ey}
                        onChange={handleDatumParamChange}
                        className="modal-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>rZ (")</label>
                      <input
                        type="number"
                        step="any"
                        name="ez"
                        value={datumParams.ez}
                        onChange={handleDatumParamChange}
                        className="modal-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Scale</label>
                      <input
                        type="number"
                        step="any"
                        name="s"
                        value={datumParams.s}
                        onChange={handleDatumParamChange}
                        className="modal-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="modal-button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="modal-button" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImageEditorModal;
