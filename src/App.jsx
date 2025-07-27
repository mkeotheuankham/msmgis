import React, { useState, useCallback, useRef } from "react";
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
import ImageLayerModal from "./components/ui/ImageLayerModal";
import ImageEditorModal from "./components/ui/ImageEditorModal";
import HistoryManager from "./utils/HistoryManager";
import AnalysisPanel from "./components/ui/AnalysisPanel";
import "./App.css";
// *** THE FIX IS HERE: Using 'shpjs' for reading and 'shp-write' for writing ***
import shp from "shpjs";
import shpwrite from "shp-write";
import { KML, GeoJSON } from "ol/format";
import { fromLonLat, toLonLat } from "ol/proj";
import { register } from "ol/proj/proj4";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { v4 as uuidv4 } from "uuid";
import proj4 from "proj4";
import VectorSource from "ol/source/Vector";
import { createEmpty, extend, isEmpty } from "ol/extent";
import { saveAs } from "file-saver";
import * as turf from "@turf/turf";

// Define full projection systems
const projectionDefs = [
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
];
proj4.defs(projectionDefs);
register(proj4);

const utmProjections = [
  { key: "WGS84_UTM47N", name: "WGS 84 / UTM zone 47N" },
  { key: "WGS84_UTM48N", name: "WGS 84 / UTM zone 48N" },
  { key: "INDIAN1975_UTM47N", name: "Indian 1975 / UTM zone 47N" },
  { key: "INDIAN1975_UTM48N", name: "Indian 1975 / UTM zone 48N" },
  { key: "LAO1997_UTM47N", name: "Lao 1997 / UTM zone 47N" },
  { key: "LAO1997_UTM48N", name: "Lao 1997 / UTM zone 48N" },
  { key: "EPSG:4326", name: "WGS 84 (Latitude/Longitude)" },
];

function App() {
  const [activeTool, setActiveTool] = useState("pan");
  const [activeTab, setActiveTab] = useState("home");
  const [mapInstance, setMapInstance] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importedLayers, setImportedLayers] = useState([]);
  const [imageLayers, setImageLayers] = useState([]);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isImageEditorModalVisible, setIsImageEditorModalVisible] =
    useState(false);
  const [editingImageLayer, setEditingImageLayer] = useState(null);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
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

  const historyManagerRef = useRef(new HistoryManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateHistoryButtons = useCallback(() => {
    setCanUndo(historyManagerRef.current.canUndo());
    setCanRedo(historyManagerRef.current.canRedo());
  }, []);

  const handleUndo = () => {
    if (mapInstance && historyManagerRef.current.canUndo()) {
      const previousFeatures = historyManagerRef.current.undo();
      const editorLayer = mapInstance
        .getLayers()
        .getArray()
        .find((l) => l.get("name") === "editorLayer");
      if (editorLayer && previousFeatures) {
        editorLayer.getSource().clear();
        editorLayer.getSource().addFeatures(previousFeatures);
      }
      updateHistoryButtons();
    }
  };

  const handleRedo = () => {
    if (mapInstance && historyManagerRef.current.canRedo()) {
      const nextFeatures = historyManagerRef.current.redo();
      const editorLayer = mapInstance
        .getLayers()
        .getArray()
        .find((l) => l.get("name") === "editorLayer");
      if (editorLayer && nextFeatures) {
        editorLayer.getSource().clear();
        editorLayer.getSource().addFeatures(nextFeatures);
      }
      updateHistoryButtons();
    }
  };

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
    imageLayers.forEach((layerData) => {
      extend(combinedExtent, layerData.extent);
    });
    const editorLayer = getLayerByName("editorLayer");
    if (editorLayer && editorLayer.getSource().getFeatures().length > 0) {
      extend(combinedExtent, editorLayer.getSource().getExtent());
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
  }, [mapInstance, importedLayers, imageLayers, getLayerByName]);

  const handleFullExtent = useCallback(() => {
    if (mapInstance) {
      mapInstance.getView().animate({
        center: fromLonLat([102.6, 17.97]),
        zoom: 7,
        duration: 1000,
      });
    }
  }, [mapInstance]);

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
          const lines = content
            .split(/\r\n|\n/)
            .filter((line) => line.trim() !== "");
          if (lines.length < 2)
            throw new Error(
              "CSV file must have a header and at least one data row."
            );
          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().toLowerCase());

          const lonIndex = headers.findIndex(
            (h) => h === "lon" || h === "longitude"
          );
          const latIndex = headers.findIndex(
            (h) => h === "lat" || h === "latitude"
          );
          const eastingIndex = headers.findIndex(
            (h) => h === "x" || h === "easting"
          );
          const northingIndex = headers.findIndex(
            (h) => h === "y" || h === "northing"
          );
          const zIndex = headers.findIndex(
            (h) => h === "z" || h === "elevation" || h === "height"
          );

          if (lonIndex !== -1 && latIndex !== -1) {
            for (let i = 1; i < lines.length; i++) {
              const data = lines[i].split(",");
              if (data.length < headers.length) continue;
              const lon = parseFloat(data[lonIndex]);
              const lat = parseFloat(data[latIndex]);
              const z = zIndex !== -1 ? parseFloat(data[zIndex]) : undefined;
              if (!isNaN(lon) && !isNaN(lat)) {
                const properties = {};
                headers.forEach((header, index) => {
                  properties[header] = data[index]?.trim() || "";
                });
                const coordinate = [lon, lat];
                if (z !== undefined && !isNaN(z)) coordinate.push(z);
                const feature = new Feature({
                  geometry: new Point(fromLonLat(coordinate)),
                  ...properties,
                });
                features.push(feature);
              }
            }
          } else if (eastingIndex !== -1 && northingIndex !== -1) {
            const projIndex = headers.findIndex(
              (h) => h === "projection" || h === "crs" || h === "srs"
            );
            if (projIndex === -1)
              throw new Error(
                "CSV with UTM coordinates must contain a 'projection' column."
              );
            for (let i = 1; i < lines.length; i++) {
              const data = lines[i].split(",");
              if (data.length < headers.length) continue;
              const x = parseFloat(data[eastingIndex]);
              const y = parseFloat(data[northingIndex]);
              const z = zIndex !== -1 ? parseFloat(data[zIndex]) : undefined;
              const sourceProj = data[projIndex]?.trim();
              if (!isNaN(x) && !isNaN(y) && sourceProj) {
                if (!proj4.defs(sourceProj)) {
                  console.warn(
                    `Projection '${sourceProj}' not defined for row ${
                      i + 1
                    }. Skipping.`
                  );
                  continue;
                }
                const properties = {};
                headers.forEach((header, index) => {
                  properties[header] = data[index]?.trim() || "";
                });
                const mapCoords2D = proj4(sourceProj, "EPSG:3857").forward([
                  x,
                  y,
                ]);
                const finalCoords = [...mapCoords2D];
                if (z !== undefined && !isNaN(z)) finalCoords.push(z);
                const feature = new Feature({
                  geometry: new Point(finalCoords),
                  ...properties,
                });
                features.push(feature);
              }
            }
          } else {
            throw new Error(
              "CSV file must contain coordinate columns (e.g., 'lat'/'lon' or 'x'/'y')."
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
            style: null,
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

  const handleAddImageLayer = (file, extent, projectionInfo) => {
    const imageUrl = URL.createObjectURL(file);
    let projectionKey =
      typeof projectionInfo === "string" ? projectionInfo : projectionInfo.key;

    if (
      typeof projectionInfo === "object" &&
      projectionInfo.key &&
      projectionInfo.def
    ) {
      if (!proj4.defs(projectionKey)) {
        proj4.defs(projectionKey, projectionInfo.def);
        register(proj4);
      }
    }

    const [minX, minY, maxX, maxY] = extent;
    const transformedMin = proj4(projectionKey, "EPSG:3857").forward([
      minX,
      minY,
    ]);
    const transformedMax = proj4(projectionKey, "EPSG:3857").forward([
      maxX,
      maxY,
    ]);
    const transformedExtent = [
      transformedMin[0],
      transformedMin[1],
      transformedMax[0],
      transformedMax[1],
    ];

    const newImageLayer = {
      id: uuidv4(),
      name: file.name,
      url: imageUrl,
      extent: transformedExtent,
      originalExtent: extent,
      projectionKey: projectionKey,
      visible: true,
      opacity: 1.0,
    };
    setImageLayers((prevLayers) => [...prevLayers, newImageLayer]);
    setActivePanel("layers");
  };

  const handleImageEdit = (layerId) => {
    const layerToEdit = imageLayers.find((l) => l.id === layerId);
    if (layerToEdit) {
      setEditingImageLayer(layerToEdit);
      setIsImageEditorModalVisible(true);
    }
  };

  const handleImageEditSave = (layerId, newProjectionInfo) => {
    const layerToUpdate = imageLayers.find((l) => l.id === layerId);
    if (!layerToUpdate) return;

    let newProjectionKey =
      typeof newProjectionInfo === "string"
        ? newProjectionInfo
        : newProjectionInfo.key;

    if (
      typeof newProjectionInfo === "object" &&
      newProjectionInfo.key &&
      newProjectionInfo.def
    ) {
      proj4.defs(newProjectionKey, newProjectionInfo.def);
      register(proj4);
    }

    const [minX, minY, maxX, maxY] = layerToUpdate.originalExtent;
    const transformedMin = proj4(newProjectionKey, "EPSG:3857").forward([
      minX,
      minY,
    ]);
    const transformedMax = proj4(newProjectionKey, "EPSG:3857").forward([
      maxX,
      maxY,
    ]);
    const newTransformedExtent = [
      transformedMin[0],
      transformedMin[1],
      transformedMax[0],
      transformedMax[1],
    ];

    setImageLayers((prevLayers) =>
      prevLayers.map((l) =>
        l.id === layerId
          ? {
              ...l,
              extent: newTransformedExtent,
              projectionKey: newProjectionKey,
            }
          : l
      )
    );

    setIsImageEditorModalVisible(false);
  };

  const handleExportData = useCallback(
    async (layerId, format) => {
      let layerToExport;
      let features;
      let layerName;

      if (layerId === "editorLayer") {
        layerToExport = mapInstance
          .getLayers()
          .getArray()
          .find((l) => l.get("name") === "editorLayer");
        features = layerToExport?.getSource().getFeatures() || [];
        layerName = "Drawn_Features";
      } else {
        layerToExport = importedLayers.find((l) => l.id === layerId);
        features = layerToExport?.features || [];
        layerName = layerToExport?.name.split(".")[0] || "Exported_Layer";
      }

      if (!features || features.length === 0) {
        alert("No features to export in the selected layer.");
        return;
      }

      const formatOptions = {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      };

      try {
        switch (format) {
          case "geojson": {
            const geojsonFormat = new GeoJSON();
            const geojsonString = geojsonFormat.writeFeatures(
              features,
              formatOptions
            );
            const blob = new Blob([geojsonString], {
              type: "application/json",
            });
            saveAs(blob, `${layerName}.geojson`);
            break;
          }
          case "kml": {
            const kmlFormat = new KML();
            const kmlString = kmlFormat.writeFeatures(features, formatOptions);
            const blob = new Blob([kmlString], {
              type: "application/vnd.google-earth.kml+xml",
            });
            saveAs(blob, `${layerName}.kml`);
            break;
          }
          case "csv": {
            const pointFeatures = features.filter(
              (f) => f.getGeometry().getType() === "Point"
            );
            if (pointFeatures.length === 0) {
              alert("No point features found in this layer to export as CSV.");
              return;
            }
            let csvContent = "";
            const headers = new Set(["longitude", "latitude"]);
            pointFeatures.forEach((f) => {
              Object.keys(f.getProperties()).forEach((key) => {
                if (key !== "geometry") {
                  headers.add(key);
                }
              });
            });

            const headerArray = Array.from(headers);
            csvContent += headerArray.join(",") + "\r\n";

            pointFeatures.forEach((f) => {
              const coords = toLonLat(f.getGeometry().getCoordinates());
              const properties = f.getProperties();
              const row = headerArray.map((header) => {
                if (header === "longitude") return coords[0];
                if (header === "latitude") return coords[1];
                const value = properties[header] || "";
                return `"${String(value).replace(/"/g, '""')}"`;
              });
              csvContent += row.join(",") + "\r\n";
            });

            const blob = new Blob([csvContent], {
              type: "text/csv;charset=utf-8;",
            });
            saveAs(blob, `${layerName}.csv`);
            break;
          }
          case "shp": {
            const geojsonFormat = new GeoJSON();
            const geojson = geojsonFormat.writeFeaturesObject(
              features,
              formatOptions
            );

            // Using shpwrite.download for exporting
            shpwrite.download(geojson);
            break;
          }
          default:
            alert(`Format '${format}' is not supported yet.`);
        }
      } catch (error) {
        console.error("Export failed:", error);
        alert(`An error occurred during export: ${error.message}`);
      }
    },
    [mapInstance, importedLayers]
  );

  const toggleHistoricalLayer = useCallback((isActive) => {
    setIsHistoricalLayerActive(isActive);
    setIsTimeSliderVisible(isActive);
  }, []);
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

  const handleRunAreaAnalysis = useCallback(
    ({ layerId, attributeName }) => {
      const layerIndex = importedLayers.findIndex((l) => l.id === layerId);
      if (layerIndex === -1) {
        alert("Layer not found.");
        return;
      }

      const targetLayer = importedLayers[layerIndex];
      const geojsonFormat = new GeoJSON();

      try {
        const newFeatures = targetLayer.features.map((feature) => {
          const newFeature = feature.clone();
          const geojsonFeature = geojsonFormat.writeFeatureObject(feature, {
            featureProjection: "EPSG:3857",
            dataProjection: "EPSG:4326",
          });
          const area = turf.area(geojsonFeature);
          newFeature.set(attributeName, parseFloat(area.toFixed(2)));
          return newFeature;
        });

        const updatedLayer = {
          ...targetLayer,
          features: newFeatures,
          name: `${targetLayer.name} (area)`,
        };

        setImportedLayers((prevLayers) => {
          const newLayers = [...prevLayers];
          newLayers[layerIndex] = updatedLayer;
          return newLayers;
        });

        alert(
          `Area calculation complete. New attribute '${attributeName}' was added.`
        );
      } catch (error) {
        console.error("Area analysis failed:", error);
        alert(`An error occurred during area analysis: ${error.message}`);
      }
    },
    [importedLayers]
  );

  const handleRunDistanceAnalysis = useCallback(
    ({ targetLayerId, sourceLayerId, attributeName }) => {
      const targetLayerIndex = importedLayers.findIndex(
        (l) => l.id === targetLayerId
      );
      const sourceLayer = importedLayers.find((l) => l.id === sourceLayerId);

      if (targetLayerIndex === -1 || !sourceLayer) {
        alert("Target or source layer not found.");
        return;
      }
      if (!sourceLayer.features || sourceLayer.features.length === 0) {
        alert("Source layer has no features to measure to.");
        return;
      }

      const targetLayer = importedLayers[targetLayerIndex];
      const geojsonFormat = new GeoJSON();

      try {
        const sourceGeoJsonFeatures = sourceLayer.features.map((feature) =>
          geojsonFormat.writeFeatureObject(feature, {
            featureProjection: "EPSG:3857",
            dataProjection: "EPSG:4326",
          })
        );
        const sourceCollection = turf.featureCollection(sourceGeoJsonFeatures);

        const newFeatures = targetLayer.features.map((feature) => {
          const newFeature = feature.clone();
          const targetGeoJsonFeature = geojsonFormat.writeFeatureObject(
            feature,
            {
              featureProjection: "EPSG:3857",
              dataProjection: "EPSG:4326",
            }
          );

          const targetPoint = turf.centerOfMass(targetGeoJsonFeature);
          let minDistance = Infinity;

          sourceCollection.features.forEach((sourceFeature) => {
            let currentDist;
            const geomType = turf.getType(sourceFeature);
            if (geomType === "Point") {
              currentDist = turf.distance(targetPoint, sourceFeature, {
                units: "meters",
              });
            } else if (
              geomType === "LineString" ||
              geomType === "MultiLineString"
            ) {
              currentDist = turf.pointToLineDistance(
                targetPoint,
                sourceFeature,
                { units: "meters" }
              );
            } else if (geomType === "Polygon" || geomType === "MultiPolygon") {
              const outline = turf.polygonToLine(sourceFeature);
              currentDist = turf.pointToLineDistance(targetPoint, outline, {
                units: "meters",
              });
            }
            if (currentDist < minDistance) {
              minDistance = currentDist;
            }
          });

          newFeature.set(attributeName, parseFloat(minDistance.toFixed(2)));
          return newFeature;
        });

        const updatedLayer = {
          ...targetLayer,
          features: newFeatures,
          name: `${targetLayer.name} (dist)`,
        };

        setImportedLayers((prevLayers) => {
          const newLayers = [...prevLayers];
          newLayers[targetLayerIndex] = updatedLayer;
          return newLayers;
        });

        alert(
          `Distance analysis complete. New attribute '${attributeName}' was added.`
        );
      } catch (error) {
        console.error("Distance analysis failed:", error);
        alert(`An error occurred during distance analysis: ${error.message}`);
      }
    },
    [importedLayers]
  );

  const handleRunShapeAnalysis = useCallback(
    ({ layerId, attributeName }) => {
      const layerIndex = importedLayers.findIndex((l) => l.id === layerId);
      if (layerIndex === -1) {
        alert("Layer not found.");
        return;
      }

      const targetLayer = importedLayers[layerIndex];
      const geojsonFormat = new GeoJSON();

      try {
        const newFeatures = targetLayer.features.map((feature) => {
          const newFeature = feature.clone();

          const geojsonFeature = geojsonFormat.writeFeatureObject(feature, {
            featureProjection: "EPSG:3857",
            dataProjection: "EPSG:4326",
          });

          const bbox = turf.bbox(geojsonFeature);

          const westPoint = turf.point([bbox[0], bbox[1]]);
          const eastPoint = turf.point([bbox[2], bbox[1]]);
          const southPoint = turf.point([bbox[0], bbox[1]]);
          const northPoint = turf.point([bbox[0], bbox[3]]);

          const width = turf.distance(westPoint, eastPoint, {
            units: "meters",
          });
          const depth = turf.distance(southPoint, northPoint, {
            units: "meters",
          });

          const ratio = depth > 0 ? width / depth : 0;

          newFeature.set(attributeName, parseFloat(ratio.toFixed(4)));
          return newFeature;
        });

        const updatedLayer = {
          ...targetLayer,
          features: newFeatures,
          name: `${targetLayer.name} (shape)`,
        };

        setImportedLayers((prevLayers) => {
          const newLayers = [...prevLayers];
          newLayers[layerIndex] = updatedLayer;
          return newLayers;
        });

        alert(
          `Shape analysis complete. New attribute '${attributeName}' was added.`
        );
      } catch (error) {
        console.error("Shape analysis failed:", error);
        alert(`An error occurred during shape analysis: ${error.message}`);
      }
    },
    [importedLayers]
  );

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
        setIsImageModalVisible={setIsImageModalVisible}
        setIsExportModalVisible={setIsExportModalVisible}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handleZoomToLayer={handleZoomToLayer}
        handleFullExtent={handleFullExtent}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
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
          imageLayers={imageLayers}
          historyManager={historyManagerRef.current}
          onHistoryChange={updateHistoryButtons}
          baseLayerStates={baseLayerStates}
          onFeatureSelect={handleFeatureSelect}
        />
        <LayerPanel
          isVisible={activePanel === "layers"}
          importedLayers={importedLayers}
          setImportedLayers={setImportedLayers}
          imageLayers={imageLayers}
          setImageLayers={setImageLayers}
          mapInstance={mapInstance}
          onStyleEdit={handleStyleEdit}
          onImageEdit={handleImageEdit}
        />
        <BaseMapPanel
          isVisible={activePanel === "basemaps"}
          baseLayerStates={baseLayerStates}
          onBaseMapChange={handleBaseMapChange}
          onBaseMapOpacityChange={handleBaseMapOpacityChange}
        />
        <AnalysisPanel
          isVisible={activePanel === "analysis"}
          onClose={() => setActivePanel(null)}
          importedLayers={importedLayers}
          onRunAreaAnalysis={handleRunAreaAnalysis}
          onRunDistanceAnalysis={handleRunDistanceAnalysis}
          onRunShapeAnalysis={handleRunShapeAnalysis}
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
      <ImageLayerModal
        isVisible={isImageModalVisible}
        onClose={() => setIsImageModalVisible(false)}
        onAddImage={handleAddImageLayer}
        projections={utmProjections}
        projectionDefs={projectionDefs}
      />
      <ImageEditorModal
        isVisible={isImageEditorModalVisible}
        onClose={() => setIsImageEditorModalVisible(false)}
        onSave={handleImageEditSave}
        layer={editingImageLayer}
        projections={utmProjections}
        projectionDefs={projectionDefs}
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
      <TimeSliderPanel
        isVisible={isTimeSliderVisible}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
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
