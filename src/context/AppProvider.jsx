import React, { useState, useCallback, useRef, useMemo } from "react";
import HistoryManager from "../utils/HistoryManager";
import { AppContext } from "./AppContext";

// Imports ທີ່ຈຳເປັນສຳລັບ Handler Functions
import shp from "shpjs";
import shpwrite from "shp-write";
import { KML, GeoJSON } from "ol/format";
import { fromLonLat, toLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { v4 as uuidv4 } from "uuid";
import VectorSource from "ol/source/Vector";
import { createEmpty, extend, isEmpty } from "ol/extent";
import { saveAs } from "file-saver";
import * as turf from "@turf/turf";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";

export const AppProvider = ({ children }) => {
  // State ທັງໝົດຂອງແອັບພລິເຄຊັນ
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

  // Handler Functions ทั้งหมด
  const updateHistoryButtons = useCallback(() => {
    setCanUndo(historyManagerRef.current.canUndo());
    setCanRedo(historyManagerRef.current.canRedo());
  }, []);

  const handleUndo = useCallback(() => {
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
  }, [mapInstance, updateHistoryButtons]);

  const handleRedo = useCallback(() => {
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
  }, [mapInstance, updateHistoryButtons]);

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

  const handleBaseMapChange = useCallback((baseMapKey) => {
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
  }, []);

  const handleBaseMapOpacityChange = useCallback((key, opacity) => {
    setBaseLayerStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], opacity },
    }));
  }, []);

  const handleFileImport = useCallback(async (file) => {
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
          if (lonIndex !== -1 && latIndex !== -1) {
            for (let i = 1; i < lines.length; i++) {
              const data = lines[i].split(",");
              if (data.length < headers.length) continue;
              const lon = parseFloat(data[lonIndex]);
              const lat = parseFloat(data[latIndex]);
              if (!isNaN(lon) && !isNaN(lat)) {
                const properties = {};
                headers.forEach((header, index) => {
                  properties[header] = data[index]?.trim() || "";
                });
                features.push(
                  new Feature({
                    geometry: new Point(fromLonLat([lon, lat])),
                    ...properties,
                  })
                );
              }
            }
          } else {
            throw new Error("CSV file must contain 'lat' and 'lon' columns.");
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
  }, []);

  const handleAddImageLayer = useCallback((file, extent, projectionInfo) => {
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
  }, []);

  const handleImageEdit = useCallback(
    (layerId) => {
      const layerToEdit = imageLayers.find((l) => l.id === layerId);
      if (layerToEdit) {
        setEditingImageLayer(layerToEdit);
        setIsImageEditorModalVisible(true);
      }
    },
    [imageLayers]
  );

  const handleImageEditSave = useCallback(
    (layerId, newProjectionInfo) => {
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
    },
    [imageLayers]
  );

  const handleExportData = useCallback(
    async (layerId, format) => {
      let features;
      let layerName;
      if (layerId === "editorLayer") {
        const layerToExport = mapInstance
          .getLayers()
          .getArray()
          .find((l) => l.get("name") === "editorLayer");
        features = layerToExport?.getSource().getFeatures() || [];
        layerName = "Drawn_Features";
      } else {
        const layerToExport = importedLayers.find((l) => l.id === layerId);
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
            saveAs(
              new Blob([geojsonString], { type: "application/json" }),
              `${layerName}.geojson`
            );
            break;
          }
          case "kml": {
            const kmlFormat = new KML();
            const kmlString = kmlFormat.writeFeatures(features, formatOptions);
            saveAs(
              new Blob([kmlString], {
                type: "application/vnd.google-earth.kml+xml",
              }),
              `${layerName}.kml`
            );
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
                if (key !== "geometry") headers.add(key);
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
            saveAs(
              new Blob([csvContent], { type: "text/csv;charset=utf-8;" }),
              `${layerName}.csv`
            );
            break;
          }
          case "shp": {
            const geojsonFormat = new GeoJSON();
            const geojson = geojsonFormat.writeFeaturesObject(
              features,
              formatOptions
            );
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

  const handleFeatureSelect = useCallback((info) => {
    setSelectedFeatureInfo(info);
  }, []);

  const handleCloseAttributeInfo = useCallback(() => {
    setSelectedFeatureInfo(null);
  }, []);

  const handleStyleEdit = useCallback(
    (layerId) => {
      const layerToStyle = importedLayers.find((l) => l.id === layerId);
      if (layerToStyle) {
        setStylingLayer(layerToStyle);
        setIsStyleEditorVisible(true);
      }
    },
    [importedLayers]
  );

  const handleStyleSave = useCallback((layerId, newStyle) => {
    setImportedLayers((layers) =>
      layers.map((l) => (l.id === layerId ? { ...l, style: newStyle } : l))
    );
    setIsStyleEditorVisible(false);
  }, []);

  const handleRunAreaAnalysis = useCallback(({ layerId, attributeName }) => {
    setImportedLayers((prevLayers) => {
      const layerIndex = prevLayers.findIndex((l) => l.id === layerId);
      if (layerIndex === -1) {
        alert("Layer not found.");
        return prevLayers;
      }
      const targetLayer = prevLayers[layerIndex];
      const geojsonFormat = new GeoJSON();
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
      const newLayers = [...prevLayers];
      newLayers[layerIndex] = updatedLayer;
      return newLayers;
    });
    alert(
      `Area calculation complete. New attribute '${attributeName}' was added.`
    );
  }, []);

  const handleRunDistanceAnalysis = useCallback(
    ({ targetLayerId, sourceLayerId, attributeName }) => {
      setImportedLayers((prevLayers) => {
        const targetLayerIndex = prevLayers.findIndex(
          (l) => l.id === targetLayerId
        );
        const sourceLayer = prevLayers.find((l) => l.id === sourceLayerId);
        if (targetLayerIndex === -1 || !sourceLayer) {
          alert("Target or source layer not found.");
          return prevLayers;
        }
        if (!sourceLayer.features || sourceLayer.features.length === 0) {
          alert("Source layer has no features to measure to.");
          return prevLayers;
        }

        const targetLayer = prevLayers[targetLayerIndex];
        const geojsonFormat = new GeoJSON();

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
        const newLayers = [...prevLayers];
        newLayers[targetLayerIndex] = updatedLayer;
        return newLayers;
      });
      alert(`Distance analysis complete.`);
    },
    []
  );

  const handleRunShapeAnalysis = useCallback(({ layerId, attributeName }) => {
    setImportedLayers((prevLayers) => {
      const layerIndex = prevLayers.findIndex((l) => l.id === layerId);
      if (layerIndex === -1) {
        alert("Layer not found.");
        return prevLayers;
      }
      const targetLayer = prevLayers[layerIndex];
      const geojsonFormat = new GeoJSON();

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
        const width = turf.distance(westPoint, eastPoint, { units: "meters" });
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
      const newLayers = [...prevLayers];
      newLayers[layerIndex] = updatedLayer;
      return newLayers;
    });
    alert(`Shape analysis complete.`);
  }, []);

  const value = useMemo(
    () => ({
      activeTool,
      setActiveTool,
      activeTab,
      setActiveTab,
      mapInstance,
      setMapInstance,
      activePanel,
      setActivePanel,
      isImportModalVisible,
      setIsImportModalVisible,
      importedLayers,
      setImportedLayers,
      imageLayers,
      setImageLayers,
      isImageModalVisible,
      setIsImageModalVisible,
      isImageEditorModalVisible,
      setIsImageEditorModalVisible,
      editingImageLayer,
      setEditingImageLayer,
      isExportModalVisible,
      setIsExportModalVisible,
      graticuleEnabled,
      setGraticuleEnabled,
      graticuleType,
      setGraticuleType,
      showGraticuleOptions,
      setShowGraticuleOptions,
      selectedFeatureInfo,
      setSelectedFeatureInfo,
      isStyleEditorVisible,
      setIsStyleEditorVisible,
      stylingLayer,
      setStylingLayer,
      baseLayerStates,
      setBaseLayerStates,
      historyManagerRef,
      canUndo,
      canRedo,
      updateHistoryButtons,
      handleUndo,
      handleRedo,
      getLayerByName,
      handleZoomIn,
      handleZoomOut,
      handleZoomToLayer,
      handleFullExtent,
      handleBaseMapChange,
      handleBaseMapOpacityChange,
      handleFileImport,
      handleAddImageLayer,
      handleImageEdit,
      handleImageEditSave,
      handleExportData,
      handleFeatureSelect,
      handleCloseAttributeInfo,
      handleStyleEdit,
      handleStyleSave,
      handleRunAreaAnalysis,
      handleRunDistanceAnalysis,
      handleRunShapeAnalysis,
    }),
    [
      activeTool,
      activeTab,
      mapInstance,
      activePanel,
      isImportModalVisible,
      importedLayers,
      imageLayers,
      isImageModalVisible,
      isImageEditorModalVisible,
      editingImageLayer,
      isExportModalVisible,
      graticuleEnabled,
      graticuleType,
      showGraticuleOptions,
      selectedFeatureInfo,
      isStyleEditorVisible,
      stylingLayer,
      baseLayerStates,
      canUndo,
      canRedo,
      updateHistoryButtons,
      handleUndo,
      handleRedo,
      getLayerByName,
      handleZoomIn,
      handleZoomOut,
      handleZoomToLayer,
      handleFullExtent,
      handleBaseMapChange,
      handleBaseMapOpacityChange,
      handleFileImport,
      handleAddImageLayer,
      handleImageEdit,
      handleImageEditSave,
      handleExportData,
      handleFeatureSelect,
      handleCloseAttributeInfo,
      handleStyleEdit,
      handleStyleSave,
      handleRunAreaAnalysis,
      handleRunDistanceAnalysis,
      handleRunShapeAnalysis,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
