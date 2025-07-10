import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Layers,
  MapPin,
  ChevronUp,
  ChevronDown,
} from "lucide-react"; // Added ChevronUp and ChevronDown
import ProvinceControls from "./ProvinceControls";
import DistrictSelector from "./DistrictSelector";
import LayerToggles from "./LayerToggles";

const sidebarStyles = {
  container: {
    position: "absolute",
    top: "calc(var(--header-height) + 1rem)",
    right: "1rem",
    bottom: "1rem",
    width: "320px",
    zIndex: 1001,
    background: "rgba(45, 45, 45, 0.95)", // --color-secondary-bg
    borderRadius: "12px",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    overflowY: "auto",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.5)", // --color-shadow-dark
    transition: "transform 0.3s ease-in-out, opacity 0.3s ease-in-out",
    transformOrigin: "right center",
  },
  collapsedContainer: {
    transform: "translateX(calc(100% - 40px))",
    opacity: 0.8,
  },
  toggleButton: {
    position: "absolute",
    left: "-40px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "40px",
    height: "40px",
    background: "rgba(45, 45, 45, 0.95)", // --color-secondary-bg
    border: "none",
    borderRadius: "12px 0 0 12px", // Adjust for left side
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f0f0f0", // --color-text-light
    boxShadow: "-5px 0 10px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease",
  },
  toggleButtonHover: {
    background: "#007acc", // --color-accent-blue
    color: "white",
  },
  section: {
    backgroundColor: "rgba(0, 0, 0, 0.25)", // --color-inset-bg
    borderRadius: "8px",
    padding: "12px 16px",
    border: "1px solid rgba(255, 255, 255, 0.1)", // --color-border-light
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)", // --color-shadow-dark
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    padding: "4px 0",
  },
  sectionHeaderH3: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 500,
    color: "#f0f0f0", // --color-text-light
    display: "flex",
    alignItems: "center",
  },
};

const Sidebar = ({
  openLayersLoaded,
  onProvinceSelectForMap,
  layerStates,
  onVisibilityChange,
  onOpacityChange,
  districts,
  toggleDistrict,
  handleLoadData,
  handleDistrictOpacityChange,
  selectedProvinceForDistricts,
}) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProvincesExpanded, setProvincesExpanded] = useState(true);
  const [isDistrictsExpanded, setDistrictsExpanded] = useState(true);
  const [isLayersExpanded, setLayersExpanded] = useState(true);

  return (
    <div
      className="sidebar"
      style={
        isSidebarCollapsed
          ? { ...sidebarStyles.container, ...sidebarStyles.collapsedContainer }
          : sidebarStyles.container
      }
    >
      <button
        className="sidebar-toggle"
        style={sidebarStyles.toggleButton}
        onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
      >
        {isSidebarCollapsed ? (
          <ChevronRight size={20} />
        ) : (
          <ChevronLeft size={20} />
        )}
      </button>

      {!isSidebarCollapsed && (
        <>
          <div className="sidebar-section" style={sidebarStyles.section}>
            <div
              className="sidebar-section-header"
              style={sidebarStyles.sectionHeader}
              onClick={() => setLayersExpanded((e) => !e)}
            >
              <h3 style={sidebarStyles.sectionHeaderH3}>
                <Layers size={16} style={{ marginRight: "8px" }} /> Layer
                (Layers)
              </h3>
              <button
                className="toggle-button"
                aria-label={isLayersExpanded ? "Collapse" : "Expand"}
              >
                {isLayersExpanded ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
            </div>
            {isLayersExpanded && (
              <LayerToggles
                layerStates={layerStates}
                onVisibilityChange={onVisibilityChange}
                onOpacityChange={onOpacityChange}
                isExpanded={isLayersExpanded}
                onToggleExpansion={() => {}}
              />
            )}
          </div>

          <div className="sidebar-section" style={sidebarStyles.section}>
            <div
              className="sidebar-section-header"
              style={sidebarStyles.sectionHeader}
              onClick={() => setProvincesExpanded((e) => !e)}
            >
              <h3 style={sidebarStyles.sectionHeaderH3}>
                <MapPin size={16} style={{ marginRight: "8px" }} /> ແຂວງ
              </h3>
              <button
                className="toggle-button"
                aria-label={isProvincesExpanded ? "Collapse" : "Expand"}
              >
                {isProvincesExpanded ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
            </div>
            {isProvincesExpanded && (
              <ProvinceControls
                openLayersLoaded={openLayersLoaded}
                onProvinceSelectForMap={onProvinceSelectForMap}
                isExpanded={isProvincesExpanded}
                onToggleExpansion={() => {}}
              />
            )}
          </div>

          <div className="sidebar-section" style={sidebarStyles.section}>
            <div
              className="sidebar-section-header"
              style={sidebarStyles.sectionHeader}
              onClick={() => setDistrictsExpanded((e) => !e)}
            >
              <h3 style={sidebarStyles.sectionHeaderH3}>
                <MapPin size={16} style={{ marginRight: "8px" }} /> ເມືອງ
              </h3>
              <button
                className="toggle-button"
                aria-label={isDistrictsExpanded ? "Collapse" : "Expand"}
              >
                {isDistrictsExpanded ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
            </div>
            {isDistrictsExpanded && (
              <DistrictSelector
                districts={districts}
                onToggle={toggleDistrict}
                onLoadData={handleLoadData}
                onOpacityChange={handleDistrictOpacityChange}
                selectedProvinceForDistricts={selectedProvinceForDistricts}
                isExpanded={isDistrictsExpanded}
                onToggleExpansion={() => {}}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
