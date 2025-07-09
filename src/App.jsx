import React, { useState } from "react";
import RibbonToolbar from "./components/RibbonToolbar";
import MapComponent from "./components/MapComponent";
import "./App.css"; // For global styles

function App() {
  const [activeTool, setActiveTool] = useState("select");
  const [activeTab, setActiveTab] = useState("home");
  const [mapInstance, setMapInstance] = useState(null);

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
        <div className="status-item">
          <span>Projection:</span>
          <span>EPSG:3857</span>
        </div>
      </div>
    </div>
  );
}

export default App;
