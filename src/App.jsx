import React, { useState } from "react";
import RibbonToolbar from "./components/RibbonToolbar";
import MapComponent from "./components/MapComponent";
import StatusBar from "./components/StatusBar";
import Panel from "./components/ui/Panel";
import "./App.css";

function App() {
  // --- State Management ---
  const [activeTool, setActiveTool] = useState("select");
  const [activeTab, setActiveTab] = useState("home");
  const [mapInstance, setMapInstance] = useState(null);

  // State to control Panel visibility
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  // State for Graticule (Grid lines)
  const [graticuleEnabled, setGraticuleEnabled] = useState(false);
  const [graticuleType, setGraticuleType] = useState("WGS84");
  const [showGraticuleOptions, setShowGraticuleOptions] = useState(false);

  // State for map layers
  const [layerStates, setLayerStates] = useState({
    osm: { name: "OpenStreetMap", visible: true, opacity: 1 },
    satellite: { name: "Satellite Imagery", visible: false, opacity: 1 },
  });

  // --- Handlers ---
  const handleGraticuleToggle = () => {
    setGraticuleEnabled((prev) => !prev);
    setShowGraticuleOptions(false);
  };

  const handleGraticuleTypeChange = (type) => {
    setGraticuleType(type);
    setGraticuleEnabled(true);
    setShowGraticuleOptions(false);
  };

  const onVisibilityChange = (layerName, visible) => {
    if (mapInstance) {
      mapInstance.getLayers().forEach((layer) => {
        if (layer.get("name") === layerName) {
          layer.setVisible(visible);
        }
      });
      setLayerStates((prev) => ({
        ...prev,
        [layerName]: { ...prev[layerName], visible },
      }));
    }
  };

  const onOpacityChange = (layerName, opacity) => {
    if (mapInstance) {
      mapInstance.getLayers().forEach((layer) => {
        if (layer.get("name") === layerName) {
          layer.setOpacity(opacity);
        }
      });
      setLayerStates((prev) => ({
        ...prev,
        [layerName]: { ...prev[layerName], opacity },
      }));
    }
  };

  return (
    <div className="app-container">
      <RibbonToolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mapInstance={mapInstance}
        isPanelVisible={isPanelVisible}
        setIsPanelVisible={setIsPanelVisible}
      />
      <div className="main-content">
        <MapComponent
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          setMapInstance={setMapInstance}
          graticuleEnabled={graticuleEnabled}
          graticuleType={graticuleType}
        />
        {/* The Panel is now always rendered, but its visibility is controlled by a CSS class for smooth animation */}
        <Panel
          isVisible={isPanelVisible}
          layerStates={layerStates}
          onVisibilityChange={onVisibilityChange}
          onOpacityChange={onOpacityChange}
        />
      </div>
      <StatusBar
        graticuleEnabled={graticuleEnabled}
        setGraticuleEnabled={setGraticuleEnabled}
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
