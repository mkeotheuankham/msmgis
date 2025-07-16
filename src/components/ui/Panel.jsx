import React, { useState } from "react";
import { Layers, MapPin, ChevronDown } from "lucide-react";

// This component is now controlled by a CSS class for visibility.

const styles = {
  // Styles remain the same as before
  panelSection: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: "8px",
    padding: "12px 16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  panelSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    padding: "4px 0",
    marginBottom: "8px",
    color: "#f0f0f0",
  },
  panelSectionHeaderH3: {
    margin: 0,
    fontSize: "1.05rem",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  toggleButton: (isExpanded) => ({
    background: "none",
    border: "none",
    color: "#f0f0f0",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.2s ease-in-out",
    transform: isExpanded ? "rotate(0deg)" : "rotate(-180deg)",
  }),
  propertyGrid: {
    paddingTop: "8px",
    display: "grid",
    gap: "10px",
  },
  provinceButton: (isDisabled, isSelected) => ({
    width: "100%",
    backgroundColor: isSelected ? "#007acc" : "#1e1e1e",
    border: `1px solid ${isSelected ? "#007acc" : "rgba(255, 255, 255, 0.1)"}`,
    color: isSelected ? "white" : "#f0f0f0",
    padding: "8px 10px",
    borderRadius: "6px",
    textAlign: "left",
    cursor: isDisabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    opacity: isDisabled ? 0.6 : 1,
  }),
  checkboxInput: (isChecked, isDisabled) => ({
    appearance: "none",
    width: "18px",
    height: "18px",
    border: `1px solid ${isChecked ? "#007acc" : "rgba(255, 255, 255, 0.2)"}`,
    borderRadius: "4px",
    backgroundColor: isChecked ? "#007acc" : "transparent",
    display: "inline-block",
    position: "relative",
    cursor: isDisabled ? "not-allowed" : "pointer",
    flexShrink: 0,
  }),
  opacitySliderContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    paddingLeft: "28px",
  },
  opacitySlider: {
    flexGrow: 1,
  },
  opacityValue: {
    fontSize: "0.8rem",
    color: "#a0a0a0",
    minWidth: "35px",
    textAlign: "right",
  },
  layerControlItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  layerToggleLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "0.9rem",
    cursor: "pointer",
    color: "#f0f0f0",
  },
  noItemsMessage: {
    fontStyle: "italic",
    color: "#a0a0a0",
    textAlign: "center",
    padding: "15px 0",
  },
};

// --- Internal Sub-Components ---
const CustomCheckbox = ({ checked, onChange, label, disabled }) => (
  <label style={styles.layerToggleLabel}>
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

const OpacitySlider = ({ opacity, onOpacityChange, disabled }) => (
  <div style={styles.opacitySliderContainer}>
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={opacity}
      onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
      disabled={disabled}
      style={styles.opacitySlider}
    />
    <span style={styles.opacityValue}>{(opacity * 100).toFixed(0)}%</span>
  </div>
);

const LayerTogglesSection = ({
  layerStates,
  onVisibilityChange,
  onOpacityChange,
}) => (
  <div style={styles.propertyGrid}>
    {Object.entries(layerStates).map(([key, layer]) => (
      <div key={key} style={styles.layerControlItem}>
        <CustomCheckbox
          label={layer.name}
          checked={layer.visible}
          onChange={() => onVisibilityChange(key, !layer.visible)}
        />
        <OpacitySlider
          opacity={layer.opacity}
          onOpacityChange={(value) => onOpacityChange(key, value)}
          disabled={!layer.visible}
        />
      </div>
    ))}
  </div>
);

const ProvinceControlsSection = () => {
  const provinces = [
    { name: "VientianeCapital", label: "ນະຄອນຫຼວງວຽງຈັນ" },
    { name: "LuangPrabang", label: "ຫຼວງພະບາງ" },
    { name: "Savannakhet", label: "ສະຫວັນນະເຂດ" },
    { name: "Champasak", label: "ຈໍາປາສັກ" },
  ];
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ ...styles.propertyGrid, gridTemplateColumns: "1fr 1fr" }}>
      {provinces.map((p) => (
        <button
          key={p.name}
          style={styles.provinceButton(false, selected === p.name)}
          onClick={() => setSelected(p.name)}
        >
          {" "}
          {p.label}{" "}
        </button>
      ))}
    </div>
  );
};

const DistrictSelectorSection = () => (
  <p style={styles.noItemsMessage}>
    {" "}
    ກະລຸນາເລືອກແຂວງກ່ອນ (Please select a province first){" "}
  </p>
);

// --- Main Panel Component ---
const Panel = ({
  isVisible,
  layerStates,
  onVisibilityChange,
  onOpacityChange,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    layers: true,
    provinces: true,
    districts: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const sections = [
    {
      key: "layers",
      title: "ຊັ້ນຂໍ້ມູນ (Layers)",
      icon: Layers,
      component: (
        <LayerTogglesSection
          layerStates={layerStates}
          onVisibilityChange={onVisibilityChange}
          onOpacityChange={onOpacityChange}
        />
      ),
    },
    {
      key: "provinces",
      title: "ແຂວງ (Provinces)",
      icon: MapPin,
      component: <ProvinceControlsSection />,
    },
    {
      key: "districts",
      title: "ເມືອງ (Districts)",
      icon: MapPin,
      component: <DistrictSelectorSection />,
    },
  ];

  // Apply the 'visible' class based on the isVisible prop
  const panelClassName = `panel ${isVisible ? "visible" : ""}`;

  return (
    <div className={panelClassName}>
      {sections.map((section) => (
        <div key={section.key} style={styles.panelSection}>
          <div
            style={styles.panelSectionHeader}
            onClick={() => toggleSection(section.key)}
          >
            <h3 style={styles.panelSectionHeaderH3}>
              <section.icon size={16} style={{ marginRight: "8px" }} />
              {section.title}
            </h3>
            <button style={styles.toggleButton(expandedSections[section.key])}>
              <ChevronDown size={20} />
            </button>
          </div>
          {expandedSections[section.key] && section.component}
        </div>
      ))}
    </div>
  );
};

export default Panel;
