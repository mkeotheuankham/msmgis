import React, { useState, useCallback } from "react";
import RibbonToolbar from "./components/RibbonToolbar";
import MapComponent from "./components/MapComponent";
import StatusBar from "./components/StatusBar";
import LayerPanel from "./components/ui/LayerPanel";
import BaseMapPanel from "./components/ui/BaseMapPanel";
import TimeSliderPanel from "./components/ui/TimeSliderPanel";
import ImportDataModal from "./components/ui/ImportDataModal";
import AttributePanel from "./components/ui/AttributePanel";
import "./App.css";
import shp from "shpjs";
import { KML, GeoJSON } from "ol/format";
import { fromLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { v4 as uuidv4 } from "uuid";

function App() {
  // --- State Management ---
  const [activeTool, setActiveTool] = useState("pan");
  const [activeTab, setActiveTab] = useState("home");
  const [mapInstance, setMapInstance] = useState(null);
  const [activePanel, setActivePanel] = useState(null); // null, 'layers', or 'basemaps'
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importedLayers, setImportedLayers] = useState([]);

  const [graticuleEnabled, setGraticuleEnabled] = useState(false);
  const [graticuleType, setGraticuleType] = useState("WGS84");
  const [showGraticuleOptions, setShowGraticuleOptions] = useState(false);

  const [isHistoricalLayerActive, setIsHistoricalLayerActive] = useState(false);
  const [isTimeSliderVisible, setIsTimeSliderVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState("2024-01-01");

  const [selectedFeatureInfo, setSelectedFeatureInfo] = useState(null);

  const [baseLayerStates, setBaseLayerStates] = useState({
    osm: { name: "Street Map", visible: true, opacity: 1 },
    satellite: { name: "Esri Satellite", visible: false, opacity: 1 },
    googleSatellite: { name: "Google Satellite", visible: false, opacity: 1 },
    topo: { name: "Topographic", visible: false, opacity: 1 },
    googleHybrid: { name: "Google Hybrid", visible: false, opacity: 1 },
    carto: { name: "Carto Voyager", visible: false, opacity: 1 },
  });

  // --- Handlers for Map Actions ---
  const getLayerByName = useCallback(
    (name) => {
      if (!mapInstance) return null;
      let layerFound = null;
      mapInstance.getLayers().forEach((layer) => {
        if (layer.get("name") === name) layerFound = layer;
      });
      return layerFound;
    },
    [mapInstance]
  );

  const handleClearMap = useCallback(() => {
    if (mapInstance) {
      const editorLayer = getLayerByName("editorLayer");
      if (editorLayer) editorLayer.getSource().clear();
      setImportedLayers([]);
    }
  }, [mapInstance, getLayerByName]);

  const handleZoomIn = useCallback(() => {
    if (mapInstance)
      mapInstance.getView().setZoom(mapInstance.getView().getZoom() + 1);
  }, [mapInstance]);
  const handleZoomOut = useCallback(() => {
    if (mapInstance)
      mapInstance.getView().setZoom(mapInstance.getView().getZoom() - 1);
  }, [mapInstance]);

  const handleZoomToLayer = useCallback(() => {
    if (mapInstance) {
      const editorLayer = getLayerByName("editorLayer");
      if (editorLayer && editorLayer.getSource().getFeatures().length > 0) {
        mapInstance.getView().fit(editorLayer.getSource().getExtent(), {
          padding: [50, 50, 50, 50],
          duration: 1000,
        });
      }
    }
  }, [mapInstance, getLayerByName]);

  const handleFullExtent = useCallback(() => {
    if (mapInstance) {
      mapInstance.getView().animate({
        center: fromLonLat([102.6, 17.97]),
        zoom: 7,
        duration: 1000,
      });
    }
  }, [mapInstance]);

  // --- Other Handlers ---
  const handleBaseMapChange = (baseMapKey) => {
    setBaseLayerStates((prevStates) => {
      const newStates = { ...prevStates };
      if (newStates[baseMapKey]) {
        newStates[baseMapKey] = {
          ...newStates[baseMapKey],
          visible: !newStates[baseMapKey].visible,
        };
      }
      return newStates;
    });
  };

  const handleBaseMapOpacityChange = (key, opacity) => {
    setBaseLayerStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], opacity },
    }));
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
          const lines = content.split("\n").slice(1);
          lines.forEach((line) => {
            const parts = line.split(",");
            const lon = parseFloat(parts[0]);
            const lat = parseFloat(parts[1]);
            if (!isNaN(lon) && !isNaN(lat)) {
              features.push(
                new Feature({ geometry: new Point(fromLonLat([lon, lat])) })
              );
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
          const geoJsonFormat = new GeoJSON();
          features = geoJsonFormat.readFeatures(geojson, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          });
        } else if (extension === "geojson" || extension === "json") {
          const geoJsonFormat = new GeoJSON();
          features = geoJsonFormat.readFeatures(JSON.parse(content), {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          });
        }

        if (features.length > 0) {
          const newLayer = {
            id: uuidv4(),
            name: file.name,
            features: features,
            visible: true,
            opacity: 1,
          };
          setImportedLayers((prevLayers) => [newLayer, ...prevLayers]);
          setActivePanel("layers");
        } else {
          alert("No features found in the imported file.");
        }
      } catch (error) {
        console.error("Error importing file:", error);
        alert(
          "Failed to import file. Please check the file format and content."
        );
      }
    };

    if (extension === "zip") reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  };

  const toggleHistoricalLayer = (isActive) => {
    setIsHistoricalLayerActive(isActive);
    if (mapInstance) {
      mapInstance.getLayers().forEach((layer) => {
        const name = layer.get("name");
        if (name === "historicalLayer") {
          layer.setVisible(isActive);
        }
        if (Object.keys(baseLayerStates).includes(name)) {
          if (isActive) {
            layer.setVisible(false);
          } else {
            layer.setVisible(name === "osm");
          }
        }
      });
      if (!isActive) {
        const newStates = { ...baseLayerStates };
        Object.keys(newStates).forEach(
          (key) => (newStates[key].visible = false)
        );
        newStates["osm"].visible = true;
        setBaseLayerStates(newStates);
      }
    }
  };

  const handleFeatureSelect = (info) => {
    setSelectedFeatureInfo(info);
  };

  const handleCloseAttributeInfo = () => {
    setSelectedFeatureInfo(null);
  };

  return (
    <div className="app-container">
      <RibbonToolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        isTimeSliderVisible={isTimeSliderVisible}
        setIsTimeSliderVisible={setIsTimeSliderVisible}
        toggleHistoricalLayer={toggleHistoricalLayer}
        setIsImportModalVisible={setIsImportModalVisible}
        handleClearMap={handleClearMap}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handleZoomToLayer={handleZoomToLayer}
        handleFullExtent={handleFullExtent}
      />
      <div className="main-content">
        <MapComponent
          activeTool={activeTool}
          setMapInstance={setMapInstance}
          graticuleEnabled={graticuleEnabled}
          graticuleType={graticuleType}
          isHistoricalLayerActive={isHistoricalLayerActive}
          selectedDate={selectedDate}
          importedLayers={importedLayers}
          baseLayerStates={baseLayerStates}
          onFeatureSelect={handleFeatureSelect}
        />
        <LayerPanel
          isVisible={activePanel === "layers"}
          importedLayers={importedLayers}
          setImportedLayers={setImportedLayers}
          mapInstance={mapInstance}
        />
        <BaseMapPanel
          isVisible={activePanel === "basemaps"}
          baseLayerStates={baseLayerStates}
          onBaseMapChange={handleBaseMapChange}
          onBaseMapOpacityChange={handleBaseMapOpacityChange}
        />
      </div>
      <ImportDataModal
        isVisible={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onFileImport={handleFileImport}
      />
      <TimeSliderPanel
        isVisible={isTimeSliderVisible}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
      <AttributePanel
        info={selectedFeatureInfo}
        onClose={handleCloseAttributeInfo}
        map={mapInstance}
      />
      <StatusBar
        graticuleEnabled={graticuleEnabled}
        graticuleType={graticuleType}
        setShowGraticuleOptions={setShowGraticuleOptions}
        showGraticuleOptions={showGraticuleOptions}
        handleGraticuleTypeChange={(type) => {
          setGraticuleType(type);
          setGraticuleEnabled(true);
          setShowGraticuleOptions(false);
        }}
        handleGraticuleToggle={() => {
          setGraticuleEnabled((prev) => !prev);
          setShowGraticuleOptions(false);
        }}
      />
    </div>
  );
}

export default App;
