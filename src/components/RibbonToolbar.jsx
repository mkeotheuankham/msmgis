import React, { useCallback } from "react";
import {
  Hand,
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
  Map as BaseMapIcon,
  Edit,
  Upload,
  Download,
  Image as ImageIcon,
  Undo,
  Redo,
  Save,
  CloudDownload,
  BrainCircuit, // Icon for Analysis
} from "lucide-react";
import "./RibbonToolbar.css";

const RibbonToolbar = ({
  activeTool,
  setActiveTool,
  activeTab,
  setActiveTab,
  activePanel,
  setActivePanel,
  setIsImportModalVisible,
  setIsExportModalVisible,
  setIsImageModalVisible,
  handleZoomIn,
  handleZoomOut,
  handleZoomToLayer,
  handleFullExtent,
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
  handleSaveProject,
  handleLoadProject,
}) => {
  const handleTabClick = (tab) => setActiveTab(tab);

  const handleToolClick = useCallback(
    (toolName) => {
      setActiveTool((currentTool) =>
        currentTool === toolName ? "pan" : toolName
      );
    },
    [setActiveTool]
  );

  const handlePanelToggle = (panelName) => {
    setActivePanel((prev) => (prev === panelName ? null : panelName));
  };

  const RibbonButton = ({
    icon,
    label,
    toolName,
    onClick,
    isActive,
    isDisabled,
  }) => {
    const buttonIsActive = isActive || activeTool === toolName;
    return (
      <button
        className={`ribbon-button ${buttonIsActive ? "active" : ""}`}
        onClick={onClick || (() => handleToolClick(toolName))}
        title={label}
        disabled={isDisabled}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

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
        {/* Home Tab Content */}
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
            </div>
            <div className="ribbon-group-title">Map Tools</div>
          </div>
          <div className="ribbon-group">
            <div className="ribbon-buttons">
              <RibbonButton
                icon={<Undo size={18} />}
                label="Undo"
                onClick={handleUndo}
                isDisabled={!canUndo}
              />
              <RibbonButton
                icon={<Redo size={18} />}
                label="Redo"
                onClick={handleRedo}
                isDisabled={!canRedo}
              />
            </div>
            <div className="ribbon-group-title">History</div>
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

        {/* Map Tab Content */}
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
                isActive={activePanel === "layers"}
                onClick={() => handlePanelToggle("layers")}
              />
            </div>
            <div className="ribbon-group-title">View</div>
          </div>
          <div className="ribbon-group">
            <div className="ribbon-buttons">
              <RibbonButton
                icon={<BaseMapIcon size={18} />}
                label="Base Maps"
                isActive={activePanel === "basemaps"}
                onClick={() => handlePanelToggle("basemaps")}
              />
            </div>
            <div className="ribbon-group-title">Base Maps</div>
          </div>
          <div className="ribbon-group">
            <div className="ribbon-buttons">
              <RibbonButton
                icon={<Upload size={18} />}
                label="Import Vector"
                onClick={() => setIsImportModalVisible(true)}
              />
              <RibbonButton
                icon={<ImageIcon size={18} />}
                label="Import Image"
                onClick={() => setIsImageModalVisible(true)}
              />
              <RibbonButton
                icon={<Download size={18} />}
                label="Export Data"
                onClick={() => setIsExportModalVisible(true)}
              />
            </div>
            <div className="ribbon-group-title">Data</div>
          </div>
          <div className="ribbon-group">
            <div className="ribbon-buttons">
              <RibbonButton
                icon={<Save size={18} />}
                label="Save Project"
                onClick={handleSaveProject}
              />
              <RibbonButton
                icon={<CloudDownload size={18} />}
                label="Load Project"
                onClick={handleLoadProject}
              />
            </div>
            <div className="ribbon-group-title">Project</div>
          </div>
        </div>

        {/* ----- FIXED ANALYSIS TAB ----- */}
        <div className={`tab-pane ${activeTab === "analysis" ? "active" : ""}`}>
          <div className="ribbon-group">
            <div className="ribbon-buttons">
              <RibbonButton
                icon={<BrainCircuit size={18} />}
                label="Analysis Tools"
                isActive={activePanel === "analysis"}
                onClick={() => handlePanelToggle("analysis")}
              />
            </div>
            <div className="ribbon-group-title">Spatial Tools</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RibbonToolbar;
