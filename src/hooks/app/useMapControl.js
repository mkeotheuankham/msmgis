import { useState, useCallback } from "react";
import { createEmpty, extend, isEmpty } from "ol/extent";
import VectorSource from "ol/source/Vector";
import { fromLonLat } from "ol/proj";

export const useMapControl = (
  importedLayers,
  imageLayers,
  getLayerByName
) => {
  const [mapInstance, setMapInstance] = useState(null);
  const [graticuleEnabled, setGraticuleEnabled] = useState(false);
  const [graticuleType, setGraticuleType] = useState("WGS84");
  const [showGraticuleOptions, setShowGraticuleOptions] = useState(false);

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
    const editorLayer = getLayerByName(mapInstance, "editorLayer");
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

  return {
    mapInstance,
    setMapInstance,
    graticuleEnabled,
    setGraticuleEnabled,
    graticuleType,
    setGraticuleType,
    showGraticuleOptions,
    setShowGraticuleOptions,
    handleZoomIn,
    handleZoomOut,
    handleZoomToLayer,
    handleFullExtent,
  };
};
