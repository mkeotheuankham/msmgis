import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";

export const useLayerManagement = (
  setActivePanel,
  setIsImageEditorModalVisible,
  setIsStyleEditorVisible,
  setSelectedFeatureInfo
) => {
  const [importedLayers, setImportedLayers] = useState([]);
  const [imageLayers, setImageLayers] = useState([]);
  const [editingImageLayer, setEditingImageLayer] = useState(null);
  const [stylingLayer, setStylingLayer] = useState(null);
  const [baseLayerStates, setBaseLayerStates] = useState({
    osm: { name: "Street Map", visible: true, opacity: 1 },
    satellite: { name: "Esri Satellite", visible: false, opacity: 1 },
    googleSatellite: { name: "Google Satellite", visible: false, opacity: 1 },
    topo: { name: "Topographic", visible: false, opacity: 1 },
    googleHybrid: { name: "Google Hybrid", visible: false, opacity: 1 },
    carto: { name: "Carto Voyager", visible: false, opacity: 1 },
  });

  const getLayerByName = useCallback(
    (mapInstance, name) => {
      if (!mapInstance) return null;
      let layerFound = null;
      mapInstance.getLayers().forEach((layer) => {
        if (layer.get("name") === name) layerFound = layer;
      });
      return layerFound;
    },
    []
  );

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

  const handleAddImageLayer = useCallback(
    (file, extent, projectionInfo) => {
      const imageUrl = URL.createObjectURL(file);
      let projectionKey =
        typeof projectionInfo === "string"
          ? projectionInfo
          : projectionInfo.key;
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
    },
    [setActivePanel]
  );

  const handleImageEdit = useCallback(
    (layerId) => {
      const layerToEdit = imageLayers.find((l) => l.id === layerId);
      if (layerToEdit) {
        setEditingImageLayer(layerToEdit);
        setIsImageEditorModalVisible(true);
      }
    },
    [imageLayers, setIsImageEditorModalVisible]
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
    [imageLayers, setIsImageEditorModalVisible]
  );

  const handleFeatureSelect = useCallback(
    (info) => {
      setSelectedFeatureInfo(info);
    },
    [setSelectedFeatureInfo]
  );

  const handleCloseAttributeInfo = useCallback(() => {
    setSelectedFeatureInfo(null);
  }, [setSelectedFeatureInfo]);

  const handleStyleEdit = useCallback(
    (layerId) => {
      const layerToStyle = importedLayers.find((l) => l.id === layerId);
      if (layerToStyle) {
        setStylingLayer(layerToStyle);
        setIsStyleEditorVisible(true);
      }
    },
    [importedLayers, setIsStyleEditorVisible]
  );

  const handleStyleSave = useCallback(
    (layerId, newStyle) => {
      setImportedLayers((layers) =>
        layers.map((l) => (l.id === layerId ? { ...l, style: newStyle } : l))
      );
      setIsStyleEditorVisible(false);
    },
    [setIsStyleEditorVisible]
  );

  return {
    importedLayers,
    setImportedLayers,
    imageLayers,
    setImageLayers,
    editingImageLayer,
    setEditingImageLayer,
    stylingLayer,
    setStylingLayer,
    baseLayerStates,
    setBaseLayerStates,
    getLayerByName,
    handleBaseMapChange,
    handleBaseMapOpacityChange,
    handleAddImageLayer,
    handleImageEdit,
    handleImageEditSave,
    handleFeatureSelect,
    handleCloseAttributeInfo,
    handleStyleEdit,
    handleStyleSave,
  };
};
