import { useCallback } from "react";
import { GeoJSON } from "ol/format";
import * as turf from "@turf/turf";

export const useAnalysisTools = (setImportedLayers) => {
  const handleRunAreaAnalysis = useCallback(
    ({ layerId, attributeName }) => {
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
    },
    [setImportedLayers]
  );

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
    [setImportedLayers]
  );

  const handleRunShapeAnalysis = useCallback(
    ({ layerId, attributeName }) => {
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
        const newLayers = [...prevLayers];
        newLayers[layerIndex] = updatedLayer;
        return newLayers;
      });
      alert(`Shape analysis complete.`);
    },
    [setImportedLayers]
  );

  return {
    handleRunAreaAnalysis,
    handleRunDistanceAnalysis,
    handleRunShapeAnalysis,
  };
};
