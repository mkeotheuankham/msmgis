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
import { fromLonLat, transform } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { v4 as uuidv4 } from "uuid";
import proj4 from "proj4";

// Define common datums for the region
proj4.defs([
  ["EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs"], // WGS84 Geographic
  // WGS84 UTM Zones
  ["EPSG:32647", "+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs"],
  ["EPSG:32648", "+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs"],
  // Indian 1975 UTM Zones with specific transformation parameters for Thailand/Laos region
  [
    "INDIAN1975_UTM47N",
    "+proj=utm +zone=47 +ellps=evrst30 +towgs84=206,836,295,0,0,0,0 +units=m +no_defs",
  ],
  [
    "INDIAN1975_UTM48N",
    "+proj=utm +zone=48 +ellps=evrst30 +towgs84=206,836,295,0,0,0,0 +units=m +no_defs",
  ],
]);

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
          const lines = content.split("\n");
          const header = lines[0]
            .toLowerCase()
            .split(",")
            .map((h) => h.trim().replace(/"/g, ""));
          const dataLines = lines.slice(1).filter((line) => line.trim() !== "");

          const getIndex = (name) => header.indexOf(name);
          const lonIndex = getIndex("longitude");
          const latIndex = getIndex("latitude");
          const eastingIndex = getIndex("easting");
          const northingIndex = getIndex("northing");
          const zoneIndex = getIndex("zone");
          const datumIndex = getIndex("datum");

          if (lonIndex !== -1 && latIndex !== -1) {
            dataLines.forEach((line) => {
              const parts = line.split(",");
              if (parts.length < header.length) return;
              const properties = {};
              header.forEach((h, i) => {
                properties[h] = parts[i].trim();
              });
              const lon = parseFloat(parts[lonIndex]);
              const lat = parseFloat(parts[latIndex]);
              if (!isNaN(lon) && !isNaN(lat)) {
                features.push(
                  new Feature({
                    geometry: new Point(fromLonLat([lon, lat])),
                    ...properties,
                  })
                );
              }
            });
          } else if (
            eastingIndex !== -1 &&
            northingIndex !== -1 &&
            zoneIndex !== -1
          ) {
            dataLines.forEach((line) => {
              const parts = line.split(",");
              if (parts.length < header.length) return;
              const properties = {};
              header.forEach((h, i) => {
                properties[h] = parts[i].trim();
              });
              const easting = parseFloat(parts[eastingIndex]);
              const northing = parseFloat(parts[northingIndex]);
              const zone = parseInt(parts[zoneIndex], 10);
              const datumName =
                datumIndex !== -1
                  ? parts[datumIndex].trim().toLowerCase()
                  : "wgs84";

              if (!isNaN(easting) && !isNaN(northing) && !isNaN(zone)) {
                let sourceProjection;
                if (datumName.includes("indian")) {
                  sourceProjection =
                    zone === 47 ? "INDIAN1975_UTM47N" : "INDIAN1975_UTM48N";
                } else {
                  // Default to WGS84
                  sourceProjection = zone === 47 ? "EPSG:32647" : "EPSG:32648";
                }

                const wgs84Coords = proj4(sourceProjection, "EPSG:4326", [
                  easting,
                  northing,
                ]);
                const mapCoords = fromLonLat(wgs84Coords);
                features.push(
                  new Feature({ geometry: new Point(mapCoords), ...properties })
                );
              }
            });
          } else {
            throw new Error(
              "CSV headers must include 'longitude,latitude' or 'easting,northing,zone'."
            );
          }
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
