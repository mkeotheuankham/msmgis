import React, { useState } from "react";
import RibbonToolbar from "./components/RibbonToolbar";
import MapComponent from "./components/MapComponent";
import StatusBar from "./components/StatusBar";
import Panel from "./components/ui/Panel";
import TimeSliderPanel from "./components/ui/TimeSliderPanel"; // Import new component
import "./App.css";

function App() {
  // --- State Management ---
  const [activeTool, setActiveTool] = useState("pan");
  const [activeTab, setActiveTab] = useState("home");
  const [mapInstance, setMapInstance] = useState(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [graticuleEnabled, setGraticuleEnabled] = useState(false);
  const [graticuleType, setGraticuleType] = useState("WGS84");
  const [showGraticuleOptions, setShowGraticuleOptions] = useState(false);

  // State for Historical Imagery
  const [isHistoricalLayerActive, setIsHistoricalLayerActive] = useState(false);
  const [isTimeSliderVisible, setIsTimeSliderVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState("2025-07-01");

  // State for map layers
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
        if (layer.get("name") === layerName) layer.setVisible(visible);
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
        if (layer.get("name") === layerName) layer.setOpacity(opacity);
      });
      setLayerStates((prev) => ({
        ...prev,
        [layerName]: { ...prev[layerName], opacity },
      }));
    }
  };

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
    baseMapKeys.forEach((key) => {
      if (newLayerStates[key]) newLayerStates[key].visible = false;
    });
    newLayerStates[baseMapKey].visible = true;
    setLayerStates(newLayerStates);
    if (mapInstance) {
      mapInstance.getLayers().forEach((layer) => {
        const layerName = layer.get("name");
        if (baseMapKeys.includes(layerName))
          layer.setVisible(layerName === baseMapKey);
      });
    }
  };

  const toggleHistoricalLayer = (isActive) => {
    setIsHistoricalLayerActive(isActive);
    if (mapInstance) {
      mapInstance.getLayers().forEach((layer) => {
        const name = layer.get("name");
        if (name === "historicalLayer") {
          layer.setVisible(isActive);
        }
        // Hide base maps when historical is active
        if (
          [
            "osm",
            "satellite",
            "topo",
            "googleSatellite",
            "googleHybrid",
            "carto",
          ].includes(name)
        ) {
          if (isActive) {
            layer.setVisible(false);
          } else {
            // Restore the default base map (osm) when historical is turned off
            layer.setVisible(name === "osm");
          }
        }
      });
      // If turning off, reset layer states to default
      if (!isActive) {
        setLayerStates((prev) => ({
          ...prev,
          osm: { ...prev.osm, visible: true },
        }));
      }
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
        isTimeSliderVisible={isTimeSliderVisible}
        setIsTimeSliderVisible={setIsTimeSliderVisible}
        toggleHistoricalLayer={toggleHistoricalLayer}
      />
      <div className="main-content">
        <MapComponent
          activeTool={activeTool}
          setMapInstance={setMapInstance}
          graticuleEnabled={graticuleEnabled}
          graticuleType={graticuleType}
          isHistoricalLayerActive={isHistoricalLayerActive}
          selectedDate={selectedDate}
        />
        <Panel
          isVisible={isPanelVisible}
          layerStates={layerStates}
          onVisibilityChange={onVisibilityChange}
          onOpacityChange={onOpacityChange}
        />
      </div>
      <TimeSliderPanel
        isVisible={isTimeSliderVisible}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
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
