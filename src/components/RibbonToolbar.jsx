import React, { useState, useCallback, useEffect } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import { containsCoordinate } from "ol/extent";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import Style from "ol/style/Style"; // Added
import Fill from "ol/style/Fill"; // Added
import Stroke from "ol/style/Stroke"; // Added
import { fromLonLat } from "ol/proj"; // Added
import Select from "ol/interaction/Select"; // Added

const RibbonToolbar = ({ activeTool, setActiveTool, mapInstance }) => {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedFeature, setSelectedFeature] = useState(null);
  const vectorSource = React.useRef(new VectorSource());

  // Function to get a layer by its name
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

  // Initialize vector layer for buffer if it doesn't exist
  useEffect(() => {
    if (!mapInstance) return;

    let existingVectorLayer = getLayerByName("bufferLayer");
    if (!existingVectorLayer) {
      const newVectorLayer = new VectorLayer({
        source: vectorSource.current,
        name: "bufferLayer",
        style: new Style({
          // Corrected: Using imported Style
          fill: new Fill({
            // Corrected: Using imported Fill
            color: "rgba(0, 255, 0, 0.2)",
          }),
          stroke: new Stroke({
            // Corrected: Using imported Stroke
            color: "#00ff00",
            width: 2,
            lineDash: [5, 5],
          }),
        }),
      });
      mapInstance.addLayer(newVectorLayer);
    }
  }, [mapInstance, getLayerByName]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleToolClick = useCallback(
    (tool) => {
      setActiveTool(tool);
    },
    [setActiveTool]
  );

  const handleClearMap = useCallback(() => {
    if (mapInstance) {
      const vectorLayer = getLayerByName("vectorLayer");
      if (vectorLayer) {
        vectorLayer.getSource().clear();
      }
      const measureLayer = getLayerByName("measureLayer");
      if (measureLayer) {
        measureLayer.getSource().clear();
      }
      const bufferLayer = getLayerByName("bufferLayer");
      if (bufferLayer) {
        bufferLayer.getSource().clear();
      }

      // Remove all overlays (tooltips)
      mapInstance.getOverlays().clear();
    }
  }, [mapInstance, getLayerByName]);

  const handleZoomIn = useCallback(() => {
    if (mapInstance) {
      const view = mapInstance.getView();
      view.setZoom(view.getZoom() + 1);
    }
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    if (mapInstance) {
      const view = mapInstance.getView();
      view.setZoom(view.getZoom() - 1);
    }
  }, [mapInstance]);

  const handleZoomToLayer = useCallback(() => {
    if (mapInstance) {
      const vectorLayer = getLayerByName("vectorLayer");
      if (vectorLayer && vectorLayer.getSource().getFeatures().length > 0) {
        const view = mapInstance.getView();
        view.fit(vectorLayer.getSource().getExtent(), {
          padding: [50, 50, 50, 50],
          duration: 1000,
        });
      }
    }
  }, [mapInstance, getLayerByName]);

  const handleFullExtent = useCallback(() => {
    if (mapInstance) {
      const view = mapInstance.getView();
      view.animate({
        center: fromLonLat([102.6, 17.97]), // Corrected: Using imported fromLonLat
        zoom: 7,
        duration: 1000,
      });
    }
  }, [mapInstance]);

  const handleBuffer = useCallback(() => {
    if (!mapInstance || !selectedFeature) {
      alert("Please select a feature on the map first.");
      return;
    }

    const bufferDistanceInput = prompt("Enter buffer distance in meters:");
    const bufferDistanceInMeters = parseFloat(bufferDistanceInput);

    if (isNaN(bufferDistanceInMeters) || bufferDistanceInMeters <= 0) {
      alert("Invalid buffer distance. Please enter a positive number.");
      return;
    }

    const geometry = selectedFeature.getGeometry();
    let bufferPolygon;

    // Clear existing buffer features
    vectorSource.current.clear();

    if (geometry.getType() === "Point") {
      const center = geometry.getCoordinates();
      bufferPolygon = Polygon.circular(
        mapInstance.getView().getProjection(),
        center,
        bufferDistanceInMeters
      );
    } else if (
      geometry.getType() === "LineString" ||
      geometry.getType() === "Polygon"
    ) {
      const extent = geometry.getExtent();
      const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];

      if (!containsCoordinate(mapInstance.getView().getExtent(), center)) {
        const geomCenter = geometry.getCoordinates();
        const actualCenter =
          geometry.getType() === "LineString"
            ? geomCenter[0]
            : geomCenter[0][0];

        bufferPolygon = Polygon.circular(
          mapInstance.getView().getProjection(),
          actualCenter,
          bufferDistanceInMeters
        );
      } else {
        bufferPolygon = Polygon.circular(
          mapInstance.getView().getProjection(),
          center,
          bufferDistanceInMeters
        );
      }
    } else {
      alert(
        "Buffering is currently supported for Point, LineString, and Polygon features."
      );
      return;
    }

    const bufferFeature = new Feature(bufferPolygon);
    vectorSource.current.addFeature(bufferFeature);
  }, [mapInstance, selectedFeature]);

  // Effect to handle feature selection changes from MapComponent
  useEffect(() => {
    if (mapInstance) {
      const select = mapInstance
        .getInteractions()
        .getArray()
        .find(
          (interaction) => interaction instanceof Select // Corrected: Using imported Select
        );

      if (select) {
        select.on("select", (event) => {
          if (event.selected.length > 0) {
            setSelectedFeature(event.selected[0]);
          } else {
            setSelectedFeature(null);
          }
        });
      }
    }
  }, [mapInstance]);

  return (
    <div className="ribbon-toolbar">
      <div className="ribbon-tabs">
        <div
          className={`ribbon-tab ${activeTab === "home" ? "active" : ""}`}
          onClick={() => handleTabClick("home")}
        >
          Home
        </div>
        <div
          className={`ribbon-tab ${activeTab === "map" ? "active" : ""}`}
          onClick={() => handleTabClick("map")}
        >
          Map
        </div>
        <div
          className={`ribbon-tab ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => handleTabClick("analysis")}
        >
          Analysis
        </div>
      </div>

      <div className="ribbon-content">
        {activeTab === "home" && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                <button
                  className={`ribbon-button ${
                    activeTool === "pan" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("pan")}
                >
                  <svg className="ribbon-button-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h-4c0 6.07 4.07 11.16 9.5 12.59v-4.66zm0-15.86V2.07C7.07 3.5 3 8.59 3 14.66h4c0-4.08 3.05-7.44 7-7.93zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" />
                  </svg>
                  Pan
                </button>
                <button
                  className={`ribbon-button ${
                    activeTool === "select" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("select")}
                >
                  <svg className="ribbon-button-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h-4c0 6.07 4.07 11.16 9.5 12.59v-4.66zm0-15.86V2.07C7.07 3.5 3 8.59 3 14.66h4c0-4.08 3.05-7.44 7-7.93zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" />
                  </svg>
                  Select
                </button>
                <button className="ribbon-button" onClick={handleClearMap}>
                  <svg className="ribbon-button-icon" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                  Clear Map
                </button>
              </div>
              <div className="ribbon-group-title">Map Tools</div>
            </div>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                <button
                  className={`ribbon-button ${
                    activeTool === "draw-point" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("draw-point")}
                >
                  <svg className="ribbon-button-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h-4c0 6.07 4.07 11.16 9.5 12.59v-4.66zm0-15.86V2.07C7.07 3.5 3 8.59 3 14.66h4c0-4.08 3.05-7.44 7-7.93zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" />
                  </svg>
                  Point
                </button>
                <button
                  className={`ribbon-button ${
                    activeTool === "draw-line" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("draw-line")}
                >
                  <svg className="ribbon-button-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h-4c0 6.07 4.07 11.16 9.5 12.59v-4.66zm0-15.86V2.07C7.07 3.5 3 8.59 3 14.66h4c0-4.08 3.05-7.44 7-7.93zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" />
                  </svg>
                  Line
                </button>
                <button
                  className={`ribbon-button ${
                    activeTool === "draw-polygon" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("draw-polygon")}
                >
                  <svg className="ribbon-button-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h-4c0 6.07 4.07 11.16 9.5 12.59v-4.66zm0-15.86V2.07C7.07 3.5 3 8.59 3 14.66h4c0-4.08 3.05-7.44 7-7.93zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" />
                  </svg>
                  Polygon
                </button>
                <button
                  className={`ribbon-button ${
                    activeTool === "draw-circle" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("draw-circle")}
                >
                  <svg className="ribbon-button-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h-4c0 6.07 4.07 11.16 9.5 12.59v-4.66zm0-15.86V2.07C7.07 3.5 3 8.59 3 14.66h4c0-4.08 3.05-7.44 7-7.93zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" />
                  </svg>
                  Circle
                </button>
              </div>
              <div className="ribbon-group-title">Draw</div>
            </div>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                <button
                  className={`ribbon-button ${
                    activeTool === "measure-distance" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("measure-distance")}
                >
                  <svg className="ribbon-button-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h-4c0 6.07 4.07 11.16 9.5 12.59v-4.66zm0-15.86V2.07C7.07 3.5 3 8.59 3 14.66h4c0-4.08 3.05-7.44 7-7.93zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" />
                  </svg>
                  Distance
                </button>
                <button
                  className={`ribbon-button ${
                    activeTool === "measure-area" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("measure-area")}
                >
                  <svg className="ribbon-button-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h-4c0 6.07 4.07 11.16 9.5 12.59v-4.66zm0-15.86V2.07C7.07 3.5 3 8.59 3 14.66h4c0-4.08 3.05-7.44 7-7.93zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" />
                  </svg>
                  Area
                </button>
                <button
                  className={`ribbon-button ${
                    activeTool === "identify" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("identify")}
                >
                  <svg className="ribbon-button-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h-4c0 6.07 4.07 11.16 9.5 12.59v-4.66zm0-15.86V2.07C7.07 3.5 3 8.59 3 14.66h4c0-4.08 3.05-7.44 7-7.93zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" />
                  </svg>
                  Identify
                </button>
              </div>
              <div className="ribbon-group-title">Measure</div>
            </div>
          </>
        )}

        {activeTab === "map" && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                <button className="ribbon-button" onClick={handleZoomIn}>
                  <svg className="ribbon-button-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h-4c0 6.07 4.07 11.16 9.5 12.59v-4.66zm0-15.86V2.07C7.07 3.5 3 8.59 3 14.66h4c0-4.08 3.05-7.44 7-7.93zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" />
                  </svg>
                  Zoom In
                </button>
                <button className="ribbon-button" onClick={handleZoomOut}>
                  <svg className="ribbon-button-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h-4c0 6.07 4.07 11.16 9.5 12.59v-4.66zm0-15.86V2.07C7.07 3.5 3 8.59 3 14.66h4c0-4.08 3.05-7.44 7-7.93zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" />
                  </svg>
                  Zoom Out
                </button>
                <button className="ribbon-button" onClick={handleZoomToLayer}>
                  <svg className="ribbon-button-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h-4c0 6.07 4.07 11.16 9.5 12.59v-4.66zm0-15.86V2.07C7.07 3.5 3 8.59 3 14.66h4c0-4.08 3.05-7.44 7-7.93zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" />
                  </svg>
                  Zoom to Layer
                </button>
                <button className="ribbon-button" onClick={handleFullExtent}>
                  <svg className="ribbon-button-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h-4c0 6.07 4.07 11.16 9.5 12.59v-4.66zm0-15.86V2.07C7.07 3.5 3 8.59 3 14.66h4c0-4.08 3.05-7.44 7-7.93zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" />
                  </svg>
                  Full Extent
                </button>
              </div>
              <div className="ribbon-group-title">Navigation</div>
            </div>
          </>
        )}

        {activeTab === "analysis" && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                <button className="ribbon-button" onClick={handleBuffer}>
                  <svg className="ribbon-button-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93h-4c0 6.07 4.07 11.16 9.5 12.59v-4.66zm0-15.86V2.07C7.07 3.5 3 8.59 3 14.66h4c0-4.08 3.05-7.44 7-7.93zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" />
                  </svg>
                  Buffer
                </button>
              </div>
              <div className="ribbon-group-title">Geoprocessing</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RibbonToolbar;
