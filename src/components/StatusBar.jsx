import React from "react";
import { Grid, Globe } from "lucide-react"; // Import icons
import "./StatusBar.css";

const StatusBar = ({
  graticuleEnabled,
  setGraticuleEnabled, // Added for direct control
  graticuleType,
  showGraticuleOptions,
  setShowGraticuleOptions,
  handleGraticuleToggle,
  handleGraticuleTypeChange,
}) => {
  return (
    <div className="status-bar">
      <div className="status-item">
        <span>Coordinates:</span>
        <span className="coordinates" id="coordinates">
          0.0000°, 0.0000°
        </span>
      </div>
      <div className="status-item">
        <span>Scale:</span>
        <span id="scale">1:1,000,000</span>
      </div>
      {/* Graticule Layer Button */}
      <div className="status-item graticule-button-container">
        <button
          className={`graticule-toggle-button ${
            graticuleEnabled ? "active" : ""
          }`}
          onClick={() => {
            // Always toggle the options dropdown visibility
            setShowGraticuleOptions((prev) => !prev);
          }}
          title="Toggle Graticule Layer and Options"
        >
          <Grid size={16} />
          Graticule ({graticuleEnabled ? graticuleType : "Off"})
        </button>
        {showGraticuleOptions && (
          <div className="graticule-options">
            <button
              className={`graticule-option ${
                graticuleType === "WGS84" && graticuleEnabled ? "active" : ""
              }`}
              onClick={() => handleGraticuleTypeChange("WGS84")}
            >
              <Globe size={14} /> WGS84
            </button>
            <button
              className={`graticule-option ${
                graticuleType === "UTM" && graticuleEnabled ? "active" : ""
              }`}
              onClick={() => handleGraticuleTypeChange("UTM")}
            >
              <Grid size={14} /> UTM
            </button>
            <button
              className={`graticule-option off-button ${
                !graticuleEnabled ? "active" : ""
              }`}
              onClick={handleGraticuleToggle}
            >
              <span className="mr-1">✖</span> Off
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusBar;
