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
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [graticuleEnabled, setGraticuleEnabled] = useState(false);
  const [graticuleType, setGraticuleType] = useState("WGS84");
  const [showGraticuleOptions, setShowGraticuleOptions] = useState(false);

  // Updated layer states to include the new base maps
  const [layerStates, setLayerStates] = useState({
    osm: { name: "Street Map", visible: true, opacity: 1 },
    satellite: { name: "Esri Satellite", visible: false, opacity: 1 },
    topo: { name: "Topographic", visible: false, opacity: 1 },
    googleSatellite: { name: "Google Satellite", visible: false, opacity: 1 },
    googleHybrid: { name: "Google Hybrid", visible: false, opacity: 1 },
    carto: { name: "Carto Voyager", visible: false, opacity: 1 },
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

  // Updated handler for Base Map Switching
  const handleBaseMapChange = (baseMapKey) => {
    const newLayerStates = { ...layerStates };
    const baseMapKeys = [
      "osm",
      "satellite",
      "topo",
      "googleSatellite",
      "googleHybrid",
      "carto",
    ];

    // Set all base maps to invisible first
    baseMapKeys.forEach((key) => {
      if (newLayerStates[key]) {
        newLayerStates[key].visible = false;
      }
    });

    // Set the selected one to visible
    newLayerStates[baseMapKey].visible = true;

    setLayerStates(newLayerStates);

    // Also update the layers on the map instance directly
    if (mapInstance) {
      mapInstance.getLayers().forEach((layer) => {
        const layerName = layer.get("name");
        if (baseMapKeys.includes(layerName)) {
          layer.setVisible(layerName === baseMapKey);
        }
      });
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
        layerStates={layerStates}
        handleBaseMapChange={handleBaseMapChange}
      />
      <div className="main-content">
        <MapComponent
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          setMapInstance={setMapInstance}
          graticuleEnabled={graticuleEnabled}
          graticuleType={graticuleType}
        />
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
