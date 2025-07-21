import { useState, useCallback } from "react";
import "./App.css";

// --- Custom Hooks ---
import useCoordinateSetup from "./hooks/useCoordinateSetup";
import useLayerManager from "./hooks/useLayerManager";
import useFileHandler from "./hooks/useFileHandler";

// --- Components ---
import RibbonToolbar from "./components/RibbonToolbar";
import MapComponent from "./components/MapComponent";
import StatusBar from "./components/StatusBar";
import LayerPanel from "./components/ui/LayerPanel";
import BaseMapPanel from "./components/ui/BaseMapPanel";
import TimeSliderPanel from "./components/ui/TimeSliderPanel";
import ImportDataModal from "./components/ui/ImportDataModal";
import ExportDataModal from "./components/ui/ExportDataModal";
import AttributePanel from "./components/ui/AttributePanel";
import StyleEditorModal from "./components/ui/StyleEditorModal";
import CoordinateBar from "./components/ui/CoordinateBar";

// --- OpenLayers ---
import { fromLonLat } from "ol/proj";
import { createEmpty, extend, isEmpty } from "ol/extent";
import VectorSource from "ol/source/Vector";

function App() {
  // --- Initialize Hooks ---
  useCoordinateSetup(); // Sets up all proj4 definitions

  // --- Core State Management ---
  const [mapInstance, setMapInstance] = useState(null);
  const [activeTool, setActiveTool] = useState("pan");
  const [activeTab, setActiveTab] = useState("home");
  const [activePanel, setActivePanel] = useState(null); // 'layers', 'basemaps', etc.

  // --- UI and Feature State (Restored) ---
  const [isTimeSliderVisible, setIsTimeSliderVisible] = useState(false);
  const [selectedFeatureInfo, setSelectedFeatureInfo] = useState(null);
  const [selectedDate, setSelectedDate] = useState("2024-07-01"); // Restored state
  const [isHistoricalLayerActive, setIsHistoricalLayerActive] = useState(false); // Restored state

  // --- Base Layer State ---
  const [baseLayerStates, setBaseLayerStates] = useState({
    osm: { name: "Street Map", visible: true, opacity: 1 },
    satellite: { name: "Esri Satellite", visible: false, opacity: 1 },
    googleSatellite: { name: "Google Satellite", visible: false, opacity: 1 },
    topo: { name: "Topographic", visible: false, opacity: 1 },
    googleHybrid: { name: "Google Hybrid", visible: false, opacity: 1 },
    carto: { name: "Carto Voyager", visible: false, opacity: 1 },
  });

  // --- Custom Hooks for Complex Logic ---
  const {
    importedLayers,
    setImportedLayers,
    addLayer,
    zoomToLayer,
    removeLayer,
    stylingLayer,
    isStyleEditorVisible,
    setIsStyleEditorVisible,
    handleStyleEdit,
    handleStyleSave,
  } = useLayerManager(mapInstance);

  const {
    isImportModalVisible,
    setIsImportModalVisible,
    isExportModalVisible,
    setIsExportModalVisible,
    handleFileImport,
    handleExportData,
  } = useFileHandler(addLayer, importedLayers, mapInstance);

  // --- Map Action Handlers ---
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
    // Clear drawn features
    const editorLayer = getLayerByName("editorLayer");
    if (editorLayer) editorLayer.getSource().clear();
    // Clear imported layers from state
    setImportedLayers([]);
  }, [getLayerByName, setImportedLayers]);

  const handleZoomIn = useCallback(
    () => mapInstance?.getView().setZoom(mapInstance.getView().getZoom() + 1),
    [mapInstance]
  );
  const handleZoomOut = useCallback(
    () => mapInstance?.getView().setZoom(mapInstance.getView().getZoom() - 1),
    [mapInstance]
  );

  const handleFullExtent = useCallback(() => {
    mapInstance?.getView().animate({
      center: fromLonLat([102.6, 17.97]), // Center of Laos
      zoom: 7,
      duration: 1000,
    });
  }, [mapInstance]);

  const handleZoomToAllLayers = useCallback(() => {
    if (!mapInstance) return;
    const combinedExtent = createEmpty();

    importedLayers.forEach((layerData) => {
      if (layerData.features && layerData.features.length > 0) {
        const source = new VectorSource({ features: layerData.features });
        extend(combinedExtent, source.getExtent());
      }
    });

    const editorLayer = getLayerByName("editorLayer");
    if (editorLayer) {
      const editorSource = editorLayer.getSource();
      if (editorSource.getFeatures().length > 0) {
        extend(combinedExtent, editorSource.getExtent());
      }
    }

    if (!isEmpty(combinedExtent)) {
      mapInstance.getView().fit(combinedExtent, {
        padding: [100, 100, 100, 100],
        duration: 1000,
        maxZoom: 19,
      });
    } else {
      alert("No layers with features found to zoom to.");
    }
  }, [mapInstance, importedLayers, getLayerByName]);

  // Handler to toggle historical layer visibility (Restored)
  const toggleHistoricalLayer = (isActive) => {
    setIsHistoricalLayerActive(isActive);
    setIsTimeSliderVisible(isActive);

    // Automatically manage base layer visibility
    const newStates = { ...baseLayerStates };
    Object.keys(newStates).forEach((key) => {
      // Hide all base layers if historical is active, otherwise restore their previous state (or default to OSM)
      newStates[key].visible = isActive ? false : key === "osm";
    });
    if (!isActive) {
      newStates["osm"].visible = true; // Ensure OSM is visible when historical is turned off
    }
    setBaseLayerStates(newStates);
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
        toggleHistoricalLayer={toggleHistoricalLayer} // Restored prop
        setIsImportModalVisible={setIsImportModalVisible}
        setIsExportModalVisible={setIsExportModalVisible}
        handleClearMap={handleClearMap}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handleZoomToLayer={handleZoomToAllLayers}
        handleFullExtent={handleFullExtent}
      />
      <div className="main-content">
        <MapComponent
          setMapInstance={setMapInstance}
          activeTool={activeTool}
          baseLayerStates={baseLayerStates}
          importedLayers={importedLayers}
          onFeatureSelect={setSelectedFeatureInfo}
          isHistoricalLayerActive={isHistoricalLayerActive} // Restored prop
          selectedDate={selectedDate} // Restored prop
        />
        <LayerPanel
          isVisible={activePanel === "layers"}
          importedLayers={importedLayers}
          setImportedLayers={setImportedLayers}
          onZoomToLayer={zoomToLayer}
          onRemoveLayer={removeLayer}
          onStyleEdit={handleStyleEdit}
        />
        <BaseMapPanel
          isVisible={activePanel === "basemaps"}
          baseLayerStates={baseLayerStates}
          onBaseMapChange={(key, visible) =>
            setBaseLayerStates((p) => ({ ...p, [key]: { ...p[key], visible } }))
          }
          onBaseMapOpacityChange={(key, opacity) =>
            setBaseLayerStates((p) => ({ ...p, [key]: { ...p[key], opacity } }))
          }
        />
        <CoordinateBar map={mapInstance} />
      </div>

      {/* --- Modals and Panels --- */}
      <ImportDataModal
        isVisible={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onFileImport={handleFileImport}
      />
      <ExportDataModal
        isVisible={isExportModalVisible}
        onClose={() => setIsExportModalVisible(false)}
        onExport={handleExportData}
        importedLayers={importedLayers}
      />
      <TimeSliderPanel
        isVisible={isTimeSliderVisible}
        selectedDate={selectedDate} // Restored prop
        onDateChange={setSelectedDate} // Restored prop
      />
      <AttributePanel
        info={selectedFeatureInfo}
        onClose={() => setSelectedFeatureInfo(null)}
        map={mapInstance}
      />
      <StyleEditorModal
        isVisible={isStyleEditorVisible}
        layer={stylingLayer}
        onClose={() => setIsStyleEditorVisible(false)}
        onSave={handleStyleSave}
      />
      <StatusBar map={mapInstance} />
    </div>
  );
}

export default App;
