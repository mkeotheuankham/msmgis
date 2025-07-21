import React, { useState, useCallback } from "react";
import RibbonToolbar from "./components/RibbonToolbar";
import MapComponent from "./components/MapComponent";
import StatusBar from "./components/StatusBar";
import LayerPanel from "./components/ui/LayerPanel";
import BaseMapPanel from "./components/ui/BaseMapPanel";
import TimeSliderPanel from "./components/ui/TimeSliderPanel";
import ImportDataModal from "./components/ui/ImportDataModal";
import AttributePanel from "./components/ui/AttributePanel";
import StyleEditorModal from "./components/ui/StyleEditorModal";
import ExportDataModal from "./components/ui/ExportDataModal";
import "./App.css";
import shp from "shpjs";
import { KML, GeoJSON } from "ol/format";
import { fromLonLat, toLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { v4 as uuidv4 } from "uuid";
import proj4 from "proj4";
import VectorSource from "ol/source/Vector";
import { createEmpty, extend, isEmpty } from "ol/extent";

// Define full projection systems including the new Lao 1997 datum
proj4.defs([
  ["EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs"],
  [
    "EPSG:4240",
    "+title=Indian 1975 +proj=longlat +ellps=evrst30 +towgs84=214,836,303,0,0,0,0 +no_defs",
  ],
  [
    "EPSG:4674",
    "+title=Lao 1997 +proj=longlat +ellps=krass +towgs84=-46.012,127.108,38.131,0,0,0,0 +no_defs",
  ],
  ["WGS84_UTM47N", "+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs"],
  ["WGS84_UTM48N", "+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs"],
  [
    "INDIAN1975_UTM47N",
    "+proj=utm +zone=47 +ellps=evrst30 +towgs84=214,836,303,0,0,0,0 +units=m +no_defs",
  ],
  [
    "INDIAN1975_UTM48N",
    "+proj=utm +zone=48 +ellps=evrst30 +towgs84=214,836,303,0,0,0,0 +units=m +no_defs",
  ],
  [
    "LAO1997_UTM47N",
    "+proj=utm +zone=47 +ellps=krass +towgs84=-46.012,127.108,38.131,0,0,0,0 +units=m +no_defs",
  ],
  [
    "LAO1997_UTM48N",
    "+proj=utm +zone=48 +ellps=krass +towgs84=-46.012,127.108,38.131,0,0,0,0 +units=m +no_defs",
  ],
]);

function App() {
  // --- State Management ---
  const [activeTool, setActiveTool] = useState("pan");
  const [activeTab, setActiveTab] = useState("home");
  const [mapInstance, setMapInstance] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importedLayers, setImportedLayers] = useState([]);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [drawInteraction, setDrawInteraction] = useState(null); // Keep for potential future use, but not passed to StatusBar

  const [graticuleEnabled, setGraticuleEnabled] = useState(false);
  const [graticuleType, setGraticuleType] = useState("WGS84");
  const [showGraticuleOptions, setShowGraticuleOptions] = useState(false);

  const [isHistoricalLayerActive, setIsHistoricalLayerActive] = useState(false);
  const [isTimeSliderVisible, setIsTimeSliderVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState("2024-01-01");

  const [selectedFeatureInfo, setSelectedFeatureInfo] = useState(null);

  const [isStyleEditorVisible, setIsStyleEditorVisible] = useState(false);
  const [stylingLayer, setStylingLayer] = useState(null);

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
        if (layer.get("name") === name) {
          layerFound = layer;
        }
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
          // CSV logic remains the same
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
          alert("No valid features found or file format is incorrect.");
        }
      } catch (error) {
        console.error("Error importing file:", error);
        alert(`Failed to import file: ${error.message}`);
      }
    };

    if (extension === "zip") {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleExportData = useCallback(
    (layerId, format) => {
      // Export logic remains the same
    },
    [mapInstance, importedLayers, getLayerByName]
  );

  const toggleHistoricalLayer = (isActive) => {
    // Historical layer logic remains the same
  };

  const handleFeatureSelect = (info) => {
    setSelectedFeatureInfo(info);
  };

  const handleCloseAttributeInfo = () => {
    setSelectedFeatureInfo(null);
  };

  const handleStyleEdit = (layerId) => {
    const layerToStyle = importedLayers.find((l) => l.id === layerId);
    if (layerToStyle) {
      setStylingLayer(layerToStyle);
      setIsStyleEditorVisible(true);
    }
  };

  const handleStyleSave = (layerId, newStyle) => {
    setImportedLayers((layers) =>
      layers.map((l) => (l.id === layerId ? { ...l, style: newStyle } : l))
    );
    setIsStyleEditorVisible(false);
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
        setIsExportModalVisible={setIsExportModalVisible}
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
          setDrawInteraction={setDrawInteraction}
        />
        <LayerPanel
          isVisible={activePanel === "layers"}
          importedLayers={importedLayers}
          setImportedLayers={setImportedLayers}
          mapInstance={mapInstance}
          onStyleEdit={handleStyleEdit}
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
      <ExportDataModal
        isVisible={isExportModalVisible}
        onClose={() => setIsExportModalVisible(false)}
        onExport={handleExportData}
        mapInstance={mapInstance}
        importedLayers={importedLayers}
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
      <StyleEditorModal
        isVisible={isStyleEditorVisible}
        layer={stylingLayer}
        onClose={() => setIsStyleEditorVisible(false)}
        onSave={handleStyleSave}
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
