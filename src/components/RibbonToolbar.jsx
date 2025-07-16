import React, { useState, useCallback, useEffect, useRef } from "react";
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
  Image,
  Clock,
  Edit,
  Upload,
} from "lucide-react";

const RibbonToolbar = ({
  activeTool,
  setActiveTool,
  activeTab,
  setActiveTab,
  isPanelVisible,
  setIsPanelVisible,
  layerStates,
  handleBaseMapChange,
  isTimeSliderVisible,
  setIsTimeSliderVisible,
  toggleHistoricalLayer,
  setIsImportModalVisible,
  handleClearMap,
  handleZoomIn,
  handleZoomOut,
  handleZoomToLayer,
  handleFullExtent,
  handleBuffer,
}) => {
  const [showBaseMapMenu, setShowBaseMapMenu] = useState(false);
  const baseMapRef = useRef(null);

  // Event listener to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (baseMapRef.current && !baseMapRef.current.contains(event.target)) {
        setShowBaseMapMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleToolClick = useCallback(
    (tool) => {
      setActiveTool(tool);
    },
    [setActiveTool]
  );

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
    { key: "satellite", label: "Esri Satellite", icon: <Image size={18} /> },
    {
      key: "googleSatellite",
      label: "Google Satellite",
      icon: <Globe size={18} />,
    },
    { key: "googleHybrid", label: "Google Hybrid", icon: <Layers size={18} /> },
    { key: "topo", label: "Topographic", icon: <Mountain size={18} /> },
    { key: "carto", label: "Carto Voyager", icon: <MapPin size={18} /> },
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
          Home
        </button>
        <button
          className={`ribbon-tab ${activeTab === "map" ? "active" : ""}`}
          onClick={() => handleTabClick("map")}
        >
          Map
        </button>
        <button
          className={`ribbon-tab ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => handleTabClick("analysis")}
        >
          Analysis
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
                icon={<Edit size={18} />}
                label="Edit"
                toolName="edit"
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
                icon={<Upload size={18} />}
                label="Import Data"
                onClick={() => setIsImportModalVisible(true)}
              />
            </div>
            <div className="ribbon-group-title">Data</div>
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
          <div className="ribbon-group">
            <div className="ribbon-buttons">
              <RibbonButton
                icon={<Clock size={18} />}
                label="Historical"
                isActive={isTimeSliderVisible}
                onClick={() => {
                  toggleHistoricalLayer(!isTimeSliderVisible);
                  setIsTimeSliderVisible(!isTimeSliderVisible);
                }}
              />
            </div>
            <div className="ribbon-group-title">Time Series</div>
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
