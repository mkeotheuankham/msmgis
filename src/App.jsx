import React, { useState } from "react";
import RibbonToolbar from "./components/RibbonToolbar";
import MapComponent from "./components/MapComponent";
import StatusBar from "./components/StatusBar";
import Panel from "./components/ui/Panel";
import TimeSliderPanel from "./components/ui/TimeSliderPanel";
import ImportDataModal from "./components/ui/ImportDataModal";
import "./App.css";
import shp from "shpjs";
import { KML } from "ol/format";
import { fromLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";

function App() {
  // --- State Management ---
  const [activeTool, setActiveTool] = useState("pan");
  const [activeTab, setActiveTab] = useState("home");
  const [mapInstance, setMapInstance] = useState(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [graticuleEnabled, setGraticuleEnabled] = useState(false);
  const [graticuleType, setGraticuleType] = useState("WGS84");
  const [showGraticuleOptions, setShowGraticuleOptions] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importedFeatures, setImportedFeatures] = useState([]);

  // State for Historical Imagery
  const [isHistoricalLayerActive, setIsHistoricalLayerActive] = useState(false);
  const [isTimeSliderVisible, setIsTimeSliderVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState("2024-01-01"); // Default to a recent date

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
            layer.setVisible(name === "osm");
          }
        }
      });
      if (!isActive) {
        setLayerStates((prev) => ({
          ...prev,
          osm: { ...prev.osm, visible: true },
        }));
      }
    }
  };

  const handleFileImport = async (file) => {
    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target.result;
      let features = [];

      try {
        if (extension === "csv") {
          const lines = content.split("\n").slice(1); // Skip header
          lines.forEach((line) => {
            const parts = line.split(",");
            const lon = parseFloat(parts[0]);
            const lat = parseFloat(parts[1]);
            if (!isNaN(lon) && !isNaN(lat)) {
              const feature = new Feature({
                geometry: new Point(fromLonLat([lon, lat])),
              });
              features.push(feature);
            }
          });
        } else if (extension === "kml") {
          const kmlFormat = new KML({
            extractStyles: true,
            showPointNames: true,
          });
          features = kmlFormat.readFeatures(content, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          });
        } else if (extension === "zip") {
          const geojson = await shp(content);
          const kmlFormatForGeoJSON = new KML();
          if (Array.isArray(geojson)) {
            geojson.forEach((g) => {
              features = features.concat(
                kmlFormatForGeoJSON.readFeatures(g, {
                  dataProjection: "EPSG:4326",
                  featureProjection: "EPSG:3857",
                })
              );
            });
          } else {
            features = kmlFormatForGeoJSON.readFeatures(geojson, {
              dataProjection: "EPSG:4326",
              featureProjection: "EPSG:3857",
            });
          }
        }
        setImportedFeatures(features);
      } catch (error) {
        console.error("Error importing file:", error);
        alert(
          "Failed to import file. Please check the file format and content."
        );
      }
    };

    if (extension === "zip") {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
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
        setIsImportModalVisible={setIsImportModalVisible}
      />
      <div className="main-content">
        <MapComponent
          activeTool={activeTool}
          setMapInstance={setMapInstance}
          graticuleEnabled={graticuleEnabled}
          graticuleType={graticuleType}
          isHistoricalLayerActive={isHistoricalLayerActive}
          selectedDate={selectedDate}
          importedFeatures={importedFeatures}
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
      <ImportDataModal
        isVisible={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onFileImport={handleFileImport}
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
