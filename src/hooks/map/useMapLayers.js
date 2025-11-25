import { useEffect } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import ImageLayer from "ol/layer/Image";
import ImageStatic from "ol/source/ImageStatic";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";

export const useMapLayers = (olMap, importedLayers, imageLayers) => {
  useEffect(() => {
    if (!olMap.current) return;

    // Imported Vector Layers
    olMap.current
      .getLayers()
      .getArray()
      .filter((l) => l.get("isImportedLayer"))
      .forEach((l) => olMap.current.removeLayer(l));
    if (importedLayers) {
      importedLayers.forEach((layerData) => {
        const vectorLayer = new VectorLayer({
          source: new VectorSource({ features: layerData.features }),
          name: layerData.name,
          visible: layerData.visible,
          opacity: layerData.opacity,
          style: new Style({
            fill: new Fill({
              color: layerData.style?.fillColor || "rgba(255, 0, 255, 0.4)",
            }),
            stroke: new Stroke({
              color: layerData.style?.strokeColor || "#ff00ff",
              width: layerData.style?.strokeWidth || 3,
            }),
            image: new CircleStyle({
              radius: layerData.style?.pointSize || 7,
              fill: new Fill({
                color: layerData.style?.pointColor || "#ff00ff",
              }),
            }),
          }),
        });
        vectorLayer.set("isImportedLayer", true);
        vectorLayer.set("id", layerData.id);
        olMap.current.addLayer(vectorLayer);
      });
    }

    // Image Layers
    olMap.current
      .getLayers()
      .getArray()
      .filter((l) => l.get("isImageLayer"))
      .forEach((l) => olMap.current.removeLayer(l));
    if (imageLayers) {
      imageLayers.forEach((layerData) => {
        const imageLayer = new ImageLayer({
          source: new ImageStatic({
            url: layerData.url,
            imageExtent: layerData.extent,
            projection: "EPSG:3857",
          }),
          opacity: layerData.opacity,
          visible: layerData.visible,
        });
        imageLayer.set("isImageLayer", true);
        imageLayer.set("id", layerData.id);
        imageLayer.set("name", layerData.name);
        olMap.current.addLayer(imageLayer);
      });
    }
  }, [importedLayers, imageLayers, olMap]);
};
