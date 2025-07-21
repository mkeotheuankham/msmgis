import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { createEmpty, extend } from "ol/extent";
import VectorSource from "ol/source/Vector";

/**
 * Custom hook to manage map layers state (as data) and interactions.
 * @param {import('ol/Map').default} mapInstance - The OpenLayers map instance.
 * @returns {object} An object containing layer states and management functions.
 */
const useLayerManager = (mapInstance) => {
  const [importedLayers, setImportedLayers] = useState([]);
  const [stylingLayer, setStylingLayer] = useState(null);
  const [isStyleEditorVisible, setIsStyleEditorVisible] = useState(false);

  /**
   * Adds a new layer to the state.
   * @param {string} name - The name for the new layer.
   * @param {Array<import('ol/Feature').default>} features - The features for the layer.
   */
  const addLayer = useCallback((name, features) => {
    const newLayer = {
      id: uuidv4(),
      name: name,
      features: features,
      visible: true,
      opacity: 1,
      style: {
        // Default style
        fillColor: "rgba(255, 255, 255, 0.4)",
        strokeColor: "#3399CC",
        strokeWidth: 2,
        pointRadius: 7,
        pointFillColor: "#3399CC",
      },
    };
    setImportedLayers((prevLayers) => [newLayer, ...prevLayers]);
  }, []);

  /**
   * Zooms the map to the extent of a specific layer or all layers.
   * @param {string} [layerId] - The ID of the layer to zoom to. If null, zooms to all layers.
   */
  const zoomToLayer = useCallback(
    (layerId) => {
      if (!mapInstance) return;

      const combinedExtent = createEmpty();
      const layersToConsider = layerId
        ? importedLayers.filter((l) => l.id === layerId)
        : importedLayers;

      layersToConsider.forEach((layerData) => {
        if (layerData.features && layerData.features.length > 0) {
          const source = new VectorSource({ features: layerData.features });
          extend(combinedExtent, source.getExtent());
        }
      });

      if (combinedExtent[0] !== Infinity) {
        mapInstance.getView().fit(combinedExtent, {
          padding: [50, 50, 50, 50],
          duration: 1000,
        });
      } else {
        alert("No features found to zoom to.");
      }
    },
    [mapInstance, importedLayers]
  );

  /**
   * Removes a layer from the state.
   * @param {string} layerId - The ID of the layer to remove.
   */
  const removeLayer = useCallback((layerId) => {
    setImportedLayers((prevLayers) =>
      prevLayers.filter((l) => l.id !== layerId)
    );
  }, []);

  /**
   * Opens the style editor for a specific layer.
   * @param {string} layerId - The ID of the layer to style.
   */
  const handleStyleEdit = (layerId) => {
    const layerToStyle = importedLayers.find((l) => l.id === layerId);
    if (layerToStyle) {
      setStylingLayer(layerToStyle);
      setIsStyleEditorVisible(true);
    }
  };

  /**
   * Saves the new style for a layer.
   * @param {string} layerId - The ID of the layer being styled.
   * @param {object} newStyle - The new style object.
   */
  const handleStyleSave = (layerId, newStyle) => {
    setImportedLayers((layers) =>
      layers.map((l) => (l.id === layerId ? { ...l, style: newStyle } : l))
    );
    setIsStyleEditorVisible(false);
  };

  return {
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
  };
};

export default useLayerManager;
