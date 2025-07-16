import React, { useState, useCallback, useEffect, useRef } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import OlPolygon from "ol/geom/Polygon";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import { fromLonLat } from "ol/proj";
import Select from "ol/interaction/Select";

// Import Lucide React Icons
import {
  Hand,
  MousePointer,
  Eraser,
  MapPin,
  PenLine,
  Hexagon,
  Circle,
  Ruler,
  LandPlot,
  Info,
  ZoomIn,
  ZoomOut,
  Layers,
  ScanSearch,
  Fullscreen,
  Target,
  Map as StreetMapIcon,
  Globe,
  Mountain,
} from "lucide-react";

const RibbonToolbar = ({
  activeTool,
  setActiveTool,
  mapInstance,
  activeTab,
  setActiveTab,
  isPanelVisible,
  setIsPanelVisible,
  layerStates,
  handleBaseMapChange,
}) => {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showBaseMapMenu, setShowBaseMapMenu] = useState(false);
  const baseMapRef = useRef(null);
  const vectorSource = React.useRef(new VectorSource());

  // --- Event listener to close dropdown when clicking outside ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (baseMapRef.current && !baseMapRef.current.contains(event.target)) {
        setShowBaseMapMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  useEffect(() => {
    if (!mapInstance) return;
    let existingVectorLayer = getLayerByName("bufferLayer");
    if (!existingVectorLayer) {
      const newVectorLayer = new VectorLayer({
        source: vectorSource.current,
        name: "bufferLayer",
        style: new Style({
          fill: new Fill({ color: "rgba(0, 255, 0, 0.2)" }),
          stroke: new Stroke({ color: "#00ff00", width: 2, lineDash: [5, 5] }),
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
      if (vectorLayer) vectorLayer.getSource().clear();
      const measureLayer = getLayerByName("measureLayer");
      if (measureLayer) measureLayer.getSource().clear();
      const bufferLayer = getLayerByName("bufferLayer");
      if (bufferLayer) bufferLayer.getSource().clear();
      mapInstance.getOverlays().clear();
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
      const vectorLayer = getLayerByName("vectorLayer");
      if (vectorLayer && vectorLayer.getSource().getFeatures().length > 0) {
        mapInstance.getView().fit(vectorLayer.getSource().getExtent(), {
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
    if (geometry.getType() === "Point") {
      const bufferPolygon = OlPolygon.circular(
        geometry,
        bufferDistanceInMeters,
        64
      ).transform("EPSG:4326", mapInstance.getView().getProjection());
      const bufferFeature = new Feature(bufferPolygon);
      vectorSource.current.clear();
      vectorSource.current.addFeature(bufferFeature);
    } else {
      alert("Buffering is currently supported only for Point features.");
    }
  }, [mapInstance, selectedFeature]);

  useEffect(() => {
    if (mapInstance) {
      const select = mapInstance
        .getInteractions()
        .getArray()
        .find((interaction) => interaction instanceof Select);
      if (select) {
        select.on("select", (event) => {
          setSelectedFeature(
            event.selected.length > 0 ? event.selected[0] : null
          );
        });
      }
    }
  }, [mapInstance]);

  const RibbonButton = ({ icon, label, toolName, onClick, isActive }) => {
    const buttonIsActive = isActive || activeTool === toolName;
    return (
      <button
        className={`ribbon-button ${buttonIsActive ? "active" : ""}`}
        onClick={onClick || (() => handleToolClick(toolName))}
        title={label}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  const baseMaps = [
    { key: "osm", label: "Street Map", icon: <StreetMapIcon size={18} /> },
    { key: "satellite", label: "Satellite", icon: <Globe size={18} /> },
    { key: "topo", label: "Topographic", icon: <Mountain size={18} /> },
  ];

  const activeBaseMap =
    baseMaps.find((bm) => layerStates[bm.key]?.visible) || baseMaps[0];

  return (
    <div className="ribbon-toolbar">
      <div className="ribbon-tabs">
        <button
          className={`ribbon-tab ${activeTab === "home" ? "active" : ""}`}
          onClick={() => handleTabClick("home")}
        >
          Home (ໜ້າຫຼັກ)
        </button>
        <button
          className={`ribbon-tab ${activeTab === "map" ? "active" : ""}`}
          onClick={() => handleTabClick("map")}
        >
          Map (ແຜນທີ່)
        </button>
        <button
          className={`ribbon-tab ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => handleTabClick("analysis")}
        >
          Analysis (ການວິເຄາະ)
        </button>
      </div>

      <div className="ribbon-content">
        <div className={`tab-pane ${activeTab === "home" ? "active" : ""}`}>
          <div className="ribbon-group">
            <div className="ribbon-buttons">
              <RibbonButton
                icon={<Hand size={18} />}
                label="Pan"
                toolName="pan"
              />
              <RibbonButton
                icon={<MousePointer size={18} />}
                label="Select"
                toolName="select"
              />
              <RibbonButton
                icon={<Eraser size={18} />}
                label="Clear Map"
                onClick={handleClearMap}
              />
            </div>
            <div className="ribbon-group-title">Map Tools</div>
          </div>
          <div className="ribbon-group">
            <div className="ribbon-buttons">
              <RibbonButton
                icon={<MapPin size={18} />}
                label="Point"
                toolName="draw-point"
              />
              <RibbonButton
                icon={<PenLine size={18} />}
                label="Line"
                toolName="draw-line"
              />
              <RibbonButton
                icon={<Hexagon size={18} />}
                label="Polygon"
                toolName="draw-polygon"
              />
              <RibbonButton
                icon={<Circle size={18} />}
                label="Circle"
                toolName="draw-circle"
              />
            </div>
            <div className="ribbon-group-title">Draw</div>
          </div>
          <div className="ribbon-group">
            <div className="ribbon-buttons">
              <RibbonButton
                icon={<Ruler size={18} />}
                label="Distance"
                toolName="measure-distance"
              />
              <RibbonButton
                icon={<LandPlot size={18} />}
                label="Area"
                toolName="measure-area"
              />
              <RibbonButton
                icon={<Info size={18} />}
                label="Identify"
                toolName="identify"
              />
            </div>
            <div className="ribbon-group-title">Measure</div>
          </div>
        </div>

        <div className={`tab-pane ${activeTab === "map" ? "active" : ""}`}>
          <div className="ribbon-group">
            <div className="ribbon-buttons">
              <RibbonButton
                icon={<ZoomIn size={18} />}
                label="Zoom In"
                onClick={handleZoomIn}
              />
              <RibbonButton
                icon={<ZoomOut size={18} />}
                label="Zoom Out"
                onClick={handleZoomOut}
              />
              <RibbonButton
                icon={<ScanSearch size={18} />}
                label="Zoom to Layer"
                onClick={handleZoomToLayer}
              />
              <RibbonButton
                icon={<Fullscreen size={18} />}
                label="Full Extent"
                onClick={handleFullExtent}
              />
            </div>
            <div className="ribbon-group-title">Navigation</div>
          </div>
          <div className="ribbon-group">
            <div className="ribbon-buttons">
              <RibbonButton
                icon={<Layers size={18} />}
                label="Layers Panel"
                isActive={isPanelVisible}
                onClick={() => setIsPanelVisible((prev) => !prev)}
              />
            </div>
            <div className="ribbon-group-title">View</div>
          </div>
          <div className="ribbon-group">
            <div className="ribbon-buttons" ref={baseMapRef}>
              <div className="basemap-switcher-container">
                <RibbonButton
                  icon={activeBaseMap.icon}
                  label={activeBaseMap.label}
                  isActive={showBaseMapMenu}
                  onClick={() => setShowBaseMapMenu((prev) => !prev)}
                />
                {showBaseMapMenu && (
                  <div className="basemap-switcher-menu">
                    {baseMaps.map((bm) => (
                      <button
                        key={bm.key}
                        className={`basemap-option ${
                          layerStates[bm.key]?.visible ? "active" : ""
                        }`}
                        onClick={() => {
                          handleBaseMapChange(bm.key);
                          setShowBaseMapMenu(false);
                        }}
                      >
                        {bm.icon}
                        <span>{bm.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="ribbon-group-title">Base Maps</div>
          </div>
        </div>

        <div className={`tab-pane ${activeTab === "analysis" ? "active" : ""}`}>
          <div className="ribbon-group">
            <div className="ribbon-buttons">
              <RibbonButton
                icon={<Target size={18} />}
                label="Buffer"
                onClick={handleBuffer}
              />
            </div>
            <div className="ribbon-group-title">Geoprocessing</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RibbonToolbar;
