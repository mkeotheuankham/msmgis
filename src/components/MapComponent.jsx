import React from "react";
import "ol/ol.css";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";

import BaseMapManager from "./map/BaseMapManager";
import CustomUtmGrid from "./map/CustomUtmGrid";
import MeasureTool from "./tools/MeasureTool";

import { useAppContext } from "../hooks/useAppContext";
import { useMapInitialization } from "../hooks/map/useMapInitialization";
import { useMapLayers } from "../hooks/map/useMapLayers";
import { useMapGraticule } from "../hooks/map/useMapGraticule";
import { useMapInteractions } from "../hooks/map/useMapInteractions";

// Register UTM projections for Laos
proj4.defs("EPSG:32647", "+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs");
proj4.defs("EPSG:32648", "+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs");
register(proj4);

const MapComponent = () => {
  const {
    activeTool,
    setActiveTool,
    setMapInstance,
    graticuleEnabled,
    graticuleType,
    importedLayers,
    baseLayerStates,
    handleFeatureSelect,
    imageLayers,
    historyManagerRef,
    updateHistoryButtons,
  } = useAppContext();

  // 1. Map Initialization
  const {
    mapRef,
    olMap,
    vectorLayerRef,
    selectionMeasureLayerRef,
    utmLabelSource,
    utmGridLineSource,
    graticuleLayer,
  } = useMapInitialization(
    setMapInstance,
    historyManagerRef,
    updateHistoryButtons
  );

  // 2. Layer Management
  useMapLayers(olMap, importedLayers, imageLayers);

  // 3. Graticule and Grid
  useMapGraticule(
    olMap,
    graticuleEnabled,
    graticuleType,
    utmLabelSource,
    utmGridLineSource,
    graticuleLayer
  );

  // 4. Interactions (Draw, Edit, Measure, etc.)
  useMapInteractions(
    olMap,
    activeTool,
    vectorLayerRef,
    selectionMeasureLayerRef,
    handleFeatureSelect,
    historyManagerRef,
    updateHistoryButtons,
    setActiveTool,
    importedLayers
  );

  return (
    <div className="map-container">
      <BaseMapManager map={olMap.current} baseLayerStates={baseLayerStates} />
      <CustomUtmGrid
        map={olMap.current}
        isVisible={graticuleEnabled && graticuleType === "UTM"}
      />
      <div
        ref={mapRef}
        id="map"
        style={{ width: "100%", height: "100%" }}
      ></div>
      {olMap.current && selectionMeasureLayerRef.current && (
        <MeasureTool
          map={olMap.current}
          activeTool={activeTool}
          selectionMeasureLayer={selectionMeasureLayerRef.current}
        />
      )}
    </div>
  );
};

export default MapComponent;
