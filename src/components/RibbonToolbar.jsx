// ນຳເຂົ້າ React hooks ທີ່ຈຳເປັນ
import React, { useState, useCallback, useEffect, useRef } from "react";
// ນຳເຂົ້າ function ຈາກ OpenLayers (ບໍ່ໄດ້ໃຊ້ໃນໄຟລ໌ນີ້ໂດຍກົງ ແຕ່ອາດຈະຈຳເປັນໃນອະນາຄົດ)
import { fromLonLat } from "ol/proj";
// ນຳເຂົ້າ icons ຕ່າງໆຈາກ library lucide-react ເພື່ອໃຊ້ໃນປຸ່ມຕ່າງໆ
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
  Map as BaseMapIcon,
  Clock,
  Edit,
  Upload,
  Download,
} from "lucide-react";
// ນຳເຂົ້າ CSS file ສຳລັບ component ນີ້
import "./RibbonToolbar.css";

// ສ້າງ functional component ຊື່ RibbonToolbar
// Component ນີ້ຮັບ props ຕ່າງໆຈາກ App.jsx ເພື່ອຈັດການ state ແລະ event handlers
const RibbonToolbar = ({
  activeTool, // ເຄື່ອງມືທີ່ກຳລັງໃຊ້ງານຢູ່
  setActiveTool, // function ສຳລັບປ່ຽນ activeTool
  activeTab, // ແຖບທີ່ກຳລັງເປີດຢູ່ (home, map, analysis)
  setActiveTab, // function ສຳລັບປ່ຽນ activeTab
  activePanel, // ແຜງດ້ານຂ້າງທີ່ກຳລັງເປີດຢູ່ (layers, basemaps)
  setActivePanel, // function ສຳລັບເປີດ/ປິດ activePanel
  isTimeSliderVisible, // ສະຖານະການເບິ່ງເຫັນຂອງແຖບເລື່ອນເວລາ
  setIsTimeSliderVisible, // function ສຳລັບປ່ຽນ isTimeSliderVisible
  toggleHistoricalLayer, // function ສຳລັບເປີດ/ປິດ historical layer
  setIsImportModalVisible, // function ສຳລັບເປີດ modal ນຳເຂົ້າຂໍ້ມູນ
  setIsExportModalVisible, // function ສຳລັບເປີດ modal ສົ່ງອອກຂໍ້ມູນ
  mapInstance, // instance ຂອງແຜນທີ່ OpenLayers
  handleClearMap, // function ສຳລັບລ້າງແຜນທີ່
  handleZoomIn, // function ສຳລັບຊູມເຂົ້າ
  handleZoomOut, // function ສຳລັບຊູມອອກ
  handleZoomToLayer, // function ສຳລັບຊູມໄປຫາ layer
  handleFullExtent, // function ສຳລັບຊູມໄປຫາຂອບເຂດເລີ່ມຕົ້ນ
}) => {
  // Function ຈັດການການຄລິກແຖບ (tab)
  const handleTabClick = (tab) => setActiveTab(tab);

  // Function ຈັດການການຄລິກເຄື່ອງມື (tool)
  // ໃຊ້ useCallback ເພື່ອປ້ອງກັນການສ້າງ function ໃໝ່ທຸກຄັ້ງທີ່ re-render, ຊ່ວຍເພີ່ມປະສິດທິພາບ
  const handleToolClick = useCallback(
    (tool) => setActiveTool(tool),
    [setActiveTool] // dependency array: function ຈະຖືກສ້າງໃໝ່ເມື່ອ setActiveTool ປ່ຽນ
  );

  // Function ເປີດ/ປິດແຜງດ້ານຂ້າງ (Layer Panel, Base Map Panel)
  const handlePanelToggle = (panelName) => {
    // ຖ້າຄລິກແຜງທີ່ເປີດຢູ່ແລ້ວ, ໃຫ້ປິດມັນ (ຕັ້ງເປັນ null). ຖ້າບໍ່, ໃຫ້ເປີດແຜງນັ້ນ.
    setActivePanel((prev) => (prev === panelName ? null : panelName));
  };

  // ສ້າງ sub-component ພາຍໃນຊື່ RibbonButton ເພື່ອໃຊ້ซ้ำ
  // ເປັນ component ສຳລັບສ້າງປຸ່ມໃນແຖບເຄື່ອງມື
  const RibbonButton = ({ icon, label, toolName, onClick, isActive }) => {
    // ກວດສອບວ່າປຸ່ມນີ້ຄວນຈະຢູ່ໃນສະຖານະ "active" ຫຼືບໍ່
    const buttonIsActive = isActive || activeTool === toolName;
    return (
      <button
        // ຕັ້ງ class ແບບ dynamic: ຖ້າປຸ່ມ active, ຈະເພີ່ມ class "active"
        className={`ribbon-button ${buttonIsActive ? "active" : ""}`}
        // ຕັ້ງ event onClick: ຖ້າມີ prop onClick ສົ່ງມາ, ໃຫ້ໃຊ້ function ນັ້ນ. ຖ້າບໍ່, ໃຫ້ໃຊ້ handleToolClick.
        onClick={onClick || (() => handleToolClick(toolName))}
        title={label} // ສະແດງ label ເປັນ tooltip
      >
        {icon} {/* ສະແດງ icon ທີ່ສົ່ງມາຜ່ານ prop */}
        <span>{label}</span> {/* ສະແດງຊື່ປຸ່ມ */}
      </button>
    );
  };

  // ສ່ວນຂອງ UI ທີ່ component ຈະ render ອອກມາ
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
        {/* ເນື້ອຫາຂອງແຖບ Home (ຈະສະແດງເມື່ອ activeTab === 'home') */}
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

        {/* ເນື້ອຫາຂອງແຖບ Map (ຈະສະແດງເມື່ອ activeTab === 'map') */}
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
          <div className="ribbon-group">
            <div className="ribbon-buttons">
              <RibbonButton
                icon={<Clock size={18} />}
                label="Historical"
                isActive={isTimeSliderVisible}
                onClick={() => {
                  // ເມື່ອຄລິກ, ຈະເປີດ/ປິດທັງ historical layer ແລະ time slider
                  toggleHistoricalLayer(!isTimeSliderVisible);
                  setIsTimeSliderVisible(!isTimeSliderVisible);
                }}
              />
            </div>
            <div className="ribbon-group-title">Time Series</div>
          </div>
        </div>

        {/* ເນື້ອຫາຂອງແຖບ Analysis (ຈະສະແດງເມື່ອ activeTab === 'analysis') */}
        <div className={`tab-pane ${activeTab === "analysis" ? "active" : ""}`}>
          <div className="ribbon-group">
            <div className="ribbon-buttons">
              <RibbonButton
                icon={<Target size={18} />}
                label="Buffer"
                onClick={() => {
                  // ໂລຈິກສຳລັບ Buffer ຍັງບໍ່ທັນໄດ້ສ້າງ
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

// ສົ່ງອອກ component ເພື່ອໃຫ້ໄຟລ໌ອື່ນສາມາດນຳໄປໃຊ້ໄດ້
export default RibbonToolbar;
