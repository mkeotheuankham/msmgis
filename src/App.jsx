import React, { useState } from "react";
import RibbonToolbar from "./components/RibbonToolbar";
import MapComponent from "./components/MapComponent";
import "./App.css"; // For global styles
import { Grid, Globe } from "lucide-react"; // Import icons

function App() {
  const [activeTool, setActiveTool] = useState("select");
  const [activeTab, setActiveTab] = useState("home");
  const [mapInstance, setMapInstance] = useState(null);
  const [showGraticuleOptions, setShowGraticuleOptions] = useState(false); // State for graticule options visibility
  const [graticuleEnabled, setGraticuleEnabled] = useState(false); // State for graticule layer visibility
  const [graticuleType, setGraticuleType] = useState("WGS84"); // State for graticule type: 'WGS84' or 'UTM'

  const handleGraticuleToggle = () => {
    setGraticuleEnabled((prev) => !prev);
    setShowGraticuleOptions(false); // Close options when toggling main switch
  };

  const handleGraticuleTypeChange = (type) => {
    setGraticuleType(type);
    setGraticuleEnabled(true); // Ensure graticule is enabled when type is selected
    setShowGraticuleOptions(false);
  };

  return (
    <div className="app-container">
      <RibbonToolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mapInstance={mapInstance}
      />
      <MapComponent
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        setMapInstance={setMapInstance}
        graticuleEnabled={graticuleEnabled} // Pass graticule state
        graticuleType={graticuleType} // Pass graticule type
      />
      <div className="status-bar">
        <div className="status-item">
          <span>Coordinates:</span>
          <span className="coordinates" id="coordinates">
            0.0000, 0.0000
          </span>
        </div>
        <div className="status-item">
          <span>Scale:</span>
          <span id="scale">1:1,000,000</span>
        </div>
        {/* <div className="status-item">
          <span>Projection:</span>
          <span>EPSG:3857</span>
        </div> */}
        {/* Graticule Layer Button */}
        <div className="status-item graticule-button-container">
          <button
            className={`graticule-toggle-button ${
              graticuleEnabled ? "active" : ""
            }`}
            onClick={() => {
              // If graticule is currently disabled, enable it (defaulting to WGS84 if not set)
              if (!graticuleEnabled) {
                setGraticuleEnabled(true);
              }
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
                className={`graticule-option ${
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
    </div>
  );
}

export default App;
