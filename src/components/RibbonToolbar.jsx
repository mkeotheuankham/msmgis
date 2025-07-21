// ນຳເຂົ້າ React hooks ທີ່ຈຳເປັນ
import React, { useCallback } from "react";
// ນຳເຂົ້າ icons ຕ່າງໆຈາກ library lucide-react ເພື່ອໃຊ້ໃນປຸ່ມຕ່າງໆ
import {
  Hand,
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
  Map as BaseMapIcon,
  // **ລຶບອອກ:** Clock icon ບໍ່ໄດ້ໃຊ້ແລ້ວ
  Edit,
  Upload,
  Download,
} from "lucide-react";
// ນຳເຂົ້າ CSS file ສຳລັບ component ນີ້
import "./RibbonToolbar.css";

// ສ້າງ functional component ຊື່ RibbonToolbar
const RibbonToolbar = ({
  activeTool,
  setActiveTool,
  activeTab,
  setActiveTab,
  activePanel,
  setActivePanel,
  // **ລຶບອອກ:** Props ທີ່ກ່ຽວຂ້ອງກັບ Historical/TimeSlider
  // isTimeSliderVisible,
  // setIsTimeSliderVisible,
  // toggleHistoricalLayer,
  setIsImportModalVisible,
  setIsExportModalVisible,
  handleClearMap,
  handleZoomIn,
  handleZoomOut,
  handleZoomToLayer,
  handleFullExtent,
}) => {
  // Function ຈັດການການຄລິກແຖບ (tab)
  const handleTabClick = (tab) => setActiveTab(tab);

  // Function ຈັດການການຄລິກເຄື່ອງມື (tool)
  const handleToolClick = useCallback(
    (tool) => setActiveTool(tool),
    [setActiveTool]
  );

  // Function ເປີດ/ປິດແຜງດ້ານຂ້າງ (Layer Panel, Base Map Panel)
  const handlePanelToggle = (panelName) => {
    setActivePanel((prev) => (prev === panelName ? null : panelName));
  };

  // ສ້າງ sub-component ພາຍໃນຊື່ RibbonButton ເພື່ອໃຊ້ซ้ำ
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

  return (
    <div className="ribbon-toolbar">
      {/* ສ່ວນຂອງແຖບ (Tabs) */}
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

      {/* ສ່ວນຂອງເນື້ອຫາໃນແຕ່ລະແຖບ */}
      <div className="ribbon-content">
        {/* ເນື້ອຫາຂອງແຖບ Home */}
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

        {/* ເນື້ອຫາຂອງແຖບ Map */}
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
                label="Import Data"
                onClick={() => setIsImportModalVisible(true)}
              />
              <RibbonButton
                icon={<Download size={18} />}
                label="Export Data"
                onClick={() => setIsExportModalVisible(true)}
              />
            </div>
            <div className="ribbon-group-title">Data</div>
          </div>
          {/* **ລຶບອອກ:** ກຸ່ມປຸ່ມ Time Series ທີ່ບັນຈຸປຸ່ມ Historical */}
          {/*
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
          */}
        </div>

        {/* ເນື້ອຫາຂອງແຖບ Analysis */}
        <div className={`tab-pane ${activeTab === "analysis" ? "active" : ""}`}>
          <div className="ribbon-group">
            <div className="ribbon-buttons">
              <RibbonButton
                icon={<Target size={18} />}
                label="Buffer"
                onClick={() => {
                  // Logic for Buffer
                }}
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
