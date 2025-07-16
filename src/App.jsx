import React, { useState } from "react";
import RibbonToolbar from "./components/RibbonToolbar";
import MapComponent from "./components/MapComponent";
import StatusBar from "./components/StatusBar";
import "./App.css"; // For global styles

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
      <StatusBar
        graticuleEnabled={graticuleEnabled}
        graticuleType={graticuleType}
        showGraticuleOptions={showGraticuleOptions}
        setShowGraticuleOptions={setShowGraticuleOptions}
        handleGraticuleToggle={handleGraticuleToggle}
        handleGraticuleTypeChange={handleGraticuleTypeChange}
      />
    </div>
  );
}

export default App;
