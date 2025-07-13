import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  MapPin,
  ChevronUp,
  ChevronDown,
  Info,
  Loader, // For loading indicator
} from "lucide-react";
// Removed: import LaoDistricsData from "../../data/laoDistricts.json"; // Data is passed via props
// Removed: import { X } from "lucide-react"; // X icon is not used in Sidebar.jsx

// Inline styles object for all sidebar-related elements
const styles = {
  // --- Sidebar Container Styles ---
  sidebarContainer: (isCollapsed, isMobile) => ({
    position: "absolute",
    top: isMobile
      ? "calc(var(--header-height) + 0.5rem)"
      : "calc(var(--header-height) + 1rem)",
    right: isMobile ? "2.5vw" : "1rem",
    bottom: isMobile ? "0.5rem" : "1rem",
    width: isMobile ? "95vw" : "320px",
    zIndex: 1001,
    background: "rgba(45, 45, 45, 0.95)", // --color-secondary-bg
    borderRadius: isMobile ? "8px" : "12px",
    padding: isMobile ? "0.75rem" : "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    overflowY: "auto",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)", // --color-shadow-dark (adjusted for softer shadow)
    transition: "transform 0.3s ease-in-out, opacity 0.3s ease-in-out",
    transformOrigin: "right center",
    transform: isCollapsed
      ? isMobile
        ? "translateX(calc(100% + 2.5vw))" // Completely off-screen for mobile
        : "translateX(calc(100% - 40px))" // Leave toggle button visible for desktop
      : "translateX(0)",
    opacity: isCollapsed ? 0.8 : 1,
  }),

  // --- Sidebar Toggle Button Styles ---
  sidebarToggle: (isMobile, isHovered) => ({
    position: "absolute",
    left: isMobile ? "-50px" : "-40px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "40px",
    height: "40px",
    background: isHovered ? "#007acc" : "rgba(45, 45, 45, 0.95)", // --color-secondary-bg, --color-accent-blue
    border: "none",
    borderRadius: isMobile ? "12px" : "12px 0 0 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: isHovered ? "white" : "#f0f0f0", // --color-text-light
    boxShadow: "-5px 0 10px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease",
  }),

  // --- Sidebar Section Styles ---
  sidebarSection: {
    backgroundColor: "rgba(0, 0, 0, 0.25)", // --color-inset-bg
    borderRadius: "8px",
    padding: "12px 16px",
    border: "1px solid rgba(255, 255, 255, 0.1)", // --color-border-light
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)", // Softer shadow
  },
  sidebarSectionLastChild: {
    borderBottom: "none",
  },
  sidebarSectionHeader: () => ({
    // Removed isHovered as it's typically handled by CSS classes
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    padding: "4px 0",
    marginBottom: "8px",
    color: "#f0f0f0", // --color-text-light (Hover handled by CSS-like effect where possible)
  }),
  sidebarSectionHeaderH3: {
    margin: 0,
    fontSize: "1.05rem", // Slightly larger font
    fontWeight: 600,
    color: "#f0f0f0", // --color-text-light (will be overridden by parent hover if applied to header)
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  toggleButton: (isExpanded) => ({
    background: "none",
    border: "none",
    color: "#f0f0f0", // --color-text-light
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.2s ease-in-out",
    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
  }),
  toggleButtonHover: {
    color: "#007acc", // --color-accent-blue
  },

  // --- Property Grid (common for provinces/layers) ---
  propertyGrid: {
    paddingTop: 0,
    marginTop: 0,
    borderTop: "none",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", // Flexible columns
    gap: "10px",
  },

  // --- Province Controls Specific Styles ---
  provinceGrid: {
    gridTemplateColumns: "1fr 1fr", // 2 equal columns
  },
  provinceButton: (isDisabled, isSelected, isHovered) => ({
    width: "100%",
    backgroundColor: isSelected
      ? "#007acc" // --color-accent-blue
      : isHovered && !isDisabled
      ? "#2a2a2a" // Darker on hover
      : "#1e1e1e", // --color-primary-bg
    border: `1px solid ${
      isSelected || (isHovered && !isDisabled)
        ? "#007acc"
        : "rgba(255, 255, 255, 0.1)"
    }`, // Accent blue or border-light
    color: isSelected ? "white" : "#f0f0f0", // --color-text-light
    padding: "8px 10px",
    borderRadius: "6px",
    textAlign: "left",
    cursor: isDisabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.85rem",
    fontWeight: 500,
    opacity: isDisabled ? 0.6 : 1,
  }),

  // --- District Selector Specific Styles ---
  districtGrid: {
    gridTemplateColumns: "1fr",
    gap: "12px",
  },
  districtItemContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    paddingBottom: "10px",
    borderBottom: "1px dashed rgba(255, 255, 255, 0.08)",
  },
  districtItemContainerLast: {
    borderBottom: "none",
    paddingBottom: 0,
  },
  districtItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.95rem",
  },
  districtItemLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    color: "#f0f0f0", // --color-text-light
  },
  districtItemContent: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  districtColor: (color) => ({
    width: "18px",
    height: "18px",
    borderRadius: "4px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    flexShrink: 0,
    backgroundColor: color,
  }),
  districtName: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  statusIcons: {
    display: "flex",
    gap: "5px",
  },
  // Keyframe for spin animation (cannot be truly inline, but defined here for context)
  spinAnimation: {
    animation: "spin 1s linear infinite",
  },
  // For actual keyframe, it would need to be in a <style> tag or a CSS-in-JS library
  // @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  // --- Checkbox Styles (custom rendering required for full control) ---
  checkboxInput: (isChecked, isDisabled) => ({
    appearance: "none",
    width: "18px",
    height: "18px",
    border: `1px solid ${isChecked ? "#007acc" : "rgba(255, 255, 255, 0.1)"}`, // --color-accent-blue, --color-border-light
    borderRadius: "4px",
    backgroundColor: isChecked ? "#007acc" : "#1e1e1e", // --color-primary-bg
    display: "inline-block",
    position: "relative",
    cursor: isDisabled ? "not-allowed" : "pointer",
    flexShrink: 0,
    opacity: isDisabled ? 0.5 : 1,
    // Note: The checkmark '✔' content requires CSS pseudo-element, not possible inline.
    // This styling just makes the box appear.
  }),

  // --- Opacity Slider Styles ---
  opacitySliderContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    paddingLeft: "28px", // Indent to align with checkbox content
  },
  opacitySlider: (isHovered) => ({
    WebkitAppearance: "none",
    appearance: "none",
    width: "100%",
    height: "4px",
    background: "#444",
    outline: "none",
    opacity: isHovered ? 1 : 0.8,
    transition: "opacity 0.2s",
    borderRadius: "2px",
    cursor: "pointer",
    // Note: Slider thumb styling also requires pseudo-elements (::-webkit-slider-thumb), not possible inline.
  }),
  opacitySliderThumb: (isHovered) => ({
    // This is conceptual; actual thumb styling needs pseudo-elements
    // width: "16px",
    // height: "16px",
    // background: isHovered ? "white" : "#007acc", // Example hover effect
    // borderRadius: "50%",
    // border: "2px solid white",
    // boxShadow: "0 0 5px rgba(0, 0, 0, 0.3)",
  }),
  opacityValue: {
    fontSize: "0.8rem",
    color: "#a0a0a0", // --color-text-muted
    minWidth: "35px",
    textAlign: "right",
  },

  // --- Load Data Button Styles ---
  loadDataButton: (isDisabled, isHovered) => ({
    backgroundColor: isHovered && !isDisabled ? "#0095f7" : "#007acc", // --color-accent-blue-hover, --color-accent-blue
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: isDisabled ? "not-allowed" : "pointer",
    fontSize: "0.9rem",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "15px",
    transition: "background-color 0.2s ease",
    width: "100%",
    opacity: isDisabled ? 0.6 : 1,
  }),
  noDistrictsMessage: {
    fontStyle: "italic",
    color: "#a0a0a0", // --color-text-muted
    textAlign: "center",
    padding: "15px 0",
  },

  // --- Layer Toggles Specific Styles ---
  layerCategoriesContainer: {
    paddingTop: "12px",
    marginTop: "10px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)", // --color-border-light
  },
  layerCategory: {
    marginBottom: "15px",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "6px",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  categoryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    cursor: "pointer",
  },
  categoryHeaderH4: {
    margin: 0,
    fontSize: "0.95rem",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  layerControlsGrid: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  layerControlItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  layerToggleLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.9rem",
    cursor: "pointer",
    color: "#f0f0f0", // --color-text-light
  },
};

// Internal Checkbox Component to apply custom styling with inline styles
// Note: Pseudo-elements like '::after' for the checkmark are not directly supported by React inline styles.
// A simpler visual indicator or a CSS-in-JS library would be needed for a perfect match.
const CustomCheckbox = ({ checked, onChange, label, disabled }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <label
      style={styles.districtItemLabel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={styles.checkboxInput(checked, disabled)}
      />
      {label}
    </label>
  );
};

// Internal Opacity Slider Component
const OpacitySlider = ({ opacity, onOpacityChange, disabled }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div style={styles.opacitySliderContainer}>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={opacity}
        onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
        disabled={disabled}
        style={styles.opacitySlider(isHovered)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      <span style={styles.opacityValue}>{(opacity * 100).toFixed(0)}%</span>
    </div>
  );
};

// Internal LayerToggles Component - All styles moved here
const LayerToggles = ({ layerStates, onVisibilityChange, onOpacityChange }) => {
  const [expandedCategories, setExpandedCategories] = useState({
    road: true, // Assuming default expanded state
    building: true, // Assuming default expanded state
  });

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <div style={styles.layerCategoriesContainer}>
      {Object.entries(layerStates).map(([key, layer]) => (
        <div key={key} style={styles.layerCategory}>
          <div
            style={styles.categoryHeader}
            onClick={() => toggleCategory(key)}
          >
            <h4 style={styles.categoryHeaderH4}>
              <Layers size={16} style={{ marginRight: "8px" }} />{" "}
              {key === "road" ? "ເສັ້ນທາງ (Roads)" : "ອາຄານ (Buildings)"}
            </h4>
            <button
              style={styles.toggleButton(expandedCategories[key])}
              aria-label={expandedCategories[key] ? "Collapse" : "Expand"}
            >
              {expandedCategories[key] ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
          </div>
          {expandedCategories[key] && (
            <div style={styles.layerControlsGrid}>
              <div style={styles.layerControlItem}>
                <CustomCheckbox
                  label="ເປີດ/ປິດການເບິ່ງເຫັນ"
                  checked={layer.isVisible}
                  onChange={() => onVisibilityChange(key, !layer.isVisible)}
                />
                <OpacitySlider
                  opacity={layer.opacity}
                  onOpacityChange={(value) => onOpacityChange(key, value)}
                  disabled={!layer.isVisible}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// NEW Internal ProvinceButton Component to manage individual button state
const ProvinceButton = ({
  province,
  isSelected,
  isDisabled,
  onClick,
  styles,
}) => {
  const [isHovered, setIsHovered] = useState(false); // Correctly placed Hook

  return (
    <button
      style={styles.provinceButton(isDisabled, isSelected, isHovered)}
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {province.label}
    </button>
  );
};

// Internal ProvinceControls Component - All styles moved here
const ProvinceControls = ({ openLayersLoaded, onProvinceSelectForMap }) => {
  const provinces = [
    {
      name: "VientianeCapital",
      label: "ນະຄອນຫຼວງວຽງຈັນ",
      coords: [102.61, 17.96],
      zoom: 9,
    },
    {
      name: "LuangPrabang",
      label: "ຫຼວງພະບາງ",
      coords: [102.13, 19.89],
      zoom: 9,
    },
    {
      name: "Savannakhet",
      label: "ສະຫວັນນະເຂດ",
      coords: [104.75, 16.56],
      zoom: 9,
    },
    { name: "Champasak", label: "ຈໍາປາສັກ", coords: [105.81, 14.77], zoom: 9 },
    { name: "Khammouane", label: "ຄໍາມ່ວນ", coords: [104.75, 17.65], zoom: 9 },
    {
      name: "XiengKhouang",
      label: "ຊຽງຂວາງ",
      coords: [103.38, 19.46],
      zoom: 9,
    },
  ];

  const [selectedProvince, setSelectedProvince] = useState(null);

  const handleProvinceClick = (province) => {
    setSelectedProvince(province.name);
    onProvinceSelectForMap(province.coords, province.zoom, province.name);
  };

  return (
    <div style={styles.propertyGrid}>
      {provinces.map((province) => {
        const isSelected = selectedProvince === province.name;
        const isDisabled = !openLayersLoaded;
        return (
          <ProvinceButton
            key={province.name}
            province={province}
            isSelected={isSelected}
            isDisabled={isDisabled}
            onClick={() => handleProvinceClick(province)}
            styles={styles} // Pass styles down
          />
        );
      })}
    </div>
  );
};

// Internal DistrictSelector Component - All styles moved here
const DistrictSelector = ({
  districts,
  onToggle,
  onLoadData,
  onOpacityChange,
  selectedProvinceForDistricts,
}) => {
  const filteredDistricts = districts.filter(
    (d) => d.province === selectedProvinceForDistricts
  );

  const areAllSelectedDistrictsLoaded = filteredDistricts.every(
    (d) => !d.checked || d.hasLoaded || d.error
  );
  const anyDistrictChecked = filteredDistricts.some((d) => d.checked);

  // Corrected destructuring for useState
  const [isLoadButtonHovered, setIsLoadButtonHovered] = useState(false);

  return (
    <div>
      {filteredDistricts.length > 0 ? (
        <div style={styles.districtGrid}>
          {filteredDistricts.map((district, index) => (
            <div
              key={district.id}
              style={
                index === filteredDistricts.length - 1
                  ? {
                      ...styles.districtItemContainer,
                      ...styles.districtItemContainerLast,
                    }
                  : styles.districtItemContainer
              }
            >
              <div style={styles.districtItem}>
                <label style={styles.districtItemLabel}>
                  <CustomCheckbox
                    checked={district.checked}
                    onChange={() => onToggle(district.name)}
                    disabled={district.loading}
                  />
                  <span style={styles.districtItemContent}>
                    {district.color && (
                      <span style={styles.districtColor(district.color)}></span>
                    )}
                    <span style={styles.districtName}>{district.label}</span>
                  </span>
                </label>
                <div style={styles.statusIcons}>
                  {district.loading && (
                    <Loader
                      size={18}
                      style={styles.spinAnimation}
                      color="#007acc"
                    />
                  )}
                  {district.error && (
                    <Info
                      size={18}
                      color="orange"
                      title={district.error.message}
                    />
                  )}
                  {district.hasLoaded && !district.error && (
                    <span style={{ color: "lightgreen" }}>✔</span>
                  )}
                </div>
              </div>
              <OpacitySlider
                opacity={district.opacity || 1}
                onOpacityChange={(value) =>
                  onOpacityChange(district.name, value)
                }
                disabled={!district.checked}
              />
            </div>
          ))}
        </div>
      ) : (
        <p style={styles.noDistrictsMessage}>
          ກະລຸນາເລືອກແຂວງກ່ອນ (Please select a province first)
        </p>
      )}
      <button
        onClick={onLoadData}
        disabled={!anyDistrictChecked || !areAllSelectedDistrictsLoaded}
        style={styles.loadDataButton(
          !anyDistrictChecked || !areAllSelectedDistrictsLoaded,
          isLoadButtonHovered
        )}
        onMouseEnter={() => setIsLoadButtonHovered(true)}
        onMouseLeave={() => setIsLoadButtonHovered(false)}
      >
        {anyDistrictChecked ? "ໂຫຼດຂໍ້ມູນຕອນດິນ" : "ເລືອກເມືອງ"}
      </button>
    </div>
  );
};

// Main Sidebar Component
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
  const [isSidebarToggleHovered, setIsSidebarToggleHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 768px)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleMediaQueryChange = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handleMediaQueryChange);
    return () =>
      mediaQuery.removeEventListener("change", handleMediaQueryChange);
  }, []);

  return (
    <div style={styles.sidebarContainer(isSidebarCollapsed, isMobile)}>
      <button
        style={styles.sidebarToggle(isMobile, isSidebarToggleHovered)}
        onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
        onMouseEnter={() => setIsSidebarToggleHovered(true)}
        onMouseLeave={() => setIsSidebarToggleHovered(false)}
      >
        {isSidebarCollapsed ? (
          <ChevronRight size={20} />
        ) : (
          <ChevronLeft size={20} />
        )}
      </button>

      {!isSidebarCollapsed && (
        <>
          <div style={styles.sidebarSection}>
            <div
              style={styles.sidebarSectionHeader()} // No hover state for header itself
              onClick={() => setLayersExpanded((e) => !e)}
            >
              <h3 style={styles.sidebarSectionHeaderH3}>
                <Layers size={16} style={{ marginRight: "8px" }} /> ຊັ້ນຂໍ້ມູນ
                (Layers)
              </h3>
              <button
                style={styles.toggleButton(isLayersExpanded)}
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
              />
            )}
          </div>

          <div style={styles.sidebarSection}>
            <div
              style={styles.sidebarSectionHeader()}
              onClick={() => setProvincesExpanded((e) => !e)}
            >
              <h3 style={styles.sidebarSectionHeaderH3}>
                <MapPin size={16} style={{ marginRight: "8px" }} /> ແຂວງ
              </h3>
              <button
                style={styles.toggleButton(isProvincesExpanded)}
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
              />
            )}
          </div>

          <div style={styles.sidebarSection}>
            <div
              style={styles.sidebarSectionHeader()}
              onClick={() => setDistrictsExpanded((e) => !e)}
            >
              <h3>
                <MapPin size={16} style={{ marginRight: "8px" }} /> ເມືອງ
              </h3>
              <button
                style={styles.toggleButton(isDistrictsExpanded)}
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
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
