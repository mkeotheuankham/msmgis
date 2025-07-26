import React, { useState } from "react";
import { AreaChart, Waypoints } from "lucide-react";

const AnalysisPanel = ({
  isVisible,
  onClose,
  importedLayers,
  onRunAreaAnalysis,
  onRunDistanceAnalysis,
}) => {
  // State for Area Analysis
  const [areaTargetLayerId, setAreaTargetLayerId] = useState("");
  const [areaAttributeName, setAreaAttributeName] = useState("area_sqm");

  // State for Distance Analysis
  const [distTargetLayerId, setDistTargetLayerId] = useState("");
  const [distSourceLayerId, setDistSourceLayerId] = useState("");
  const [distAttributeName, setDistAttributeName] = useState("dist_m");

  const polygonLayers = importedLayers.filter((layer) => {
    if (!layer.features || layer.features.length === 0) return false;
    const firstFeature = layer.features[0];
    if (!firstFeature || !firstFeature.getGeometry()) return false;
    const geomType = firstFeature.getGeometry().getType();
    return geomType === "Polygon" || geomType === "MultiPolygon";
  });

  const handleAreaRunClick = () => {
    if (!areaTargetLayerId) {
      alert("Please select a layer for Area Analysis.");
      return;
    }
    if (!areaAttributeName.trim()) {
      alert("Please provide an attribute name for the area.");
      return;
    }
    onRunAreaAnalysis({
      layerId: areaTargetLayerId,
      attributeName: areaAttributeName.trim(),
    });
    onClose();
  };

  const handleDistanceRunClick = () => {
    if (!distTargetLayerId || !distSourceLayerId) {
      alert("Please select both a target and a source layer.");
      return;
    }
    if (distTargetLayerId === distSourceLayerId) {
      alert("Target and source layers cannot be the same.");
      return;
    }
    if (!distAttributeName.trim()) {
      alert("Please provide an attribute name for the distance.");
      return;
    }
    onRunDistanceAnalysis({
      targetLayerId: distTargetLayerId,
      sourceLayerId: distSourceLayerId,
      attributeName: distAttributeName.trim(),
    });
    onClose();
  };

  const styles = `
    .analysis-tool-card {
      background-color: rgba(40, 42, 45, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      margin-bottom: 1rem;
      overflow: hidden;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background-color: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .card-header h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #f0f0f0;
    }
    .card-body {
      padding: 1rem 1.25rem;
    }
    .card-description {
      font-size: 0.85rem;
      color: #b0b0b0;
      margin-top: 0;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      font-size: 0.8rem;
      font-weight: 500;
      color: #a0a0a0;
      margin-bottom: 0.5rem;
    }
    .form-group select,
    .form-group input {
      width: 100%;
      padding: 0.7rem;
      background-color: rgba(0, 0, 0, 0.4);
      border: 1px solid transparent;
      border-bottom: 1px solid #4a4d52;
      border-radius: 4px;
      color: #f0f0f0;
      font-size: 0.9rem;
      box-sizing: border-box;
      transition: all 0.2s ease;
    }
    .form-group select:focus,
    .form-group input:focus {
      outline: none;
      background-color: rgba(0, 0, 0, 0.5);
      border-bottom-color: #00aaff;
    }
    .run-button {
      width: 100%;
      padding: 0.75rem;
      font-size: 1rem;
      font-weight: 600;
      color: white;
      background-image: linear-gradient(to right, #007acc, #0099ff);
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 122, 204, 0.3);
    }
    .run-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 153, 255, 0.4);
    }
    .run-button:disabled {
      background-image: none;
      background-color: #555;
      color: #999;
      cursor: not-allowed;
      box-shadow: none;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className={`panel ${isVisible ? "visible" : ""}`}>
        {/* The (X) button has been removed from the header */}
        <div className="panel-header" style={{ justifyContent: "center" }}>
          <h3>Analysis Tools</h3>
        </div>
        <div className="panel-content">
          {/* Area Analysis Tool Card */}
          <div className="analysis-tool-card">
            <div className="card-header">
              <AreaChart size={18} />
              <h4>Calculate Area</h4>
            </div>
            <div className="card-body">
              <p className="card-description">
                Calculates the area of each polygon and adds it as a new
                attribute.
              </p>
              <div className="form-group">
                <label>Target Polygon Layer</label>
                <select
                  value={areaTargetLayerId}
                  onChange={(e) => setAreaTargetLayerId(e.target.value)}
                >
                  <option value="" disabled>
                    -- Select a layer --
                  </option>
                  {polygonLayers.map((layer) => (
                    <option key={layer.id} value={layer.id}>
                      {layer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>New Area Attribute Name</label>
                <input
                  type="text"
                  value={areaAttributeName}
                  onChange={(e) => setAreaAttributeName(e.target.value)}
                />
              </div>
              <button
                className="run-button"
                onClick={handleAreaRunClick}
                disabled={polygonLayers.length === 0}
              >
                {polygonLayers.length > 0
                  ? "Run Area Analysis"
                  : "No Polygon Layers"}
              </button>
            </div>
          </div>

          {/* Distance Analysis Tool Card */}
          <div className="analysis-tool-card">
            <div className="card-header">
              <Waypoints size={18} />
              <h4>Distance to Nearest Feature</h4>
            </div>
            <div className="card-body">
              <p className="card-description">
                Calculates the distance from each feature in the target layer to
                the nearest feature in the source layer.
              </p>
              <div className="form-group">
                <label>Target Layer</label>
                <select
                  value={distTargetLayerId}
                  onChange={(e) => setDistTargetLayerId(e.target.value)}
                >
                  <option value="" disabled>
                    -- Select a layer --
                  </option>
                  {importedLayers.map((layer) => (
                    <option key={layer.id} value={layer.id}>
                      {layer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Source Layer (Measure to)</label>
                <select
                  value={distSourceLayerId}
                  onChange={(e) => setDistSourceLayerId(e.target.value)}
                >
                  <option value="" disabled>
                    -- Select a layer --
                  </option>
                  {importedLayers.map((layer) => (
                    <option key={layer.id} value={layer.id}>
                      {layer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>New Distance Attribute Name</label>
                <input
                  type="text"
                  value={distAttributeName}
                  onChange={(e) => setDistAttributeName(e.target.value)}
                />
              </div>
              <button
                className="run-button"
                onClick={handleDistanceRunClick}
                disabled={importedLayers.length < 2}
              >
                {importedLayers.length < 2
                  ? "Need at least 2 layers"
                  : "Run Distance Analysis"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalysisPanel;
