// ນຳເຂົ້າ React hooks ແລະ icons ທີ່ຈຳເປັນ
import React, { useState } from "react";
import {
  Layers,
  ChevronDown,
  Trash2,
  ZoomIn,
  Map as StreetMapIcon,
  Globe,
  Mountain,
  Image,
  MapPin,
} from "lucide-react";

// --- Sub-Components ພາຍໃນ (Internal Sub-Components) ---
// Component ເຫຼົ່ານີ້ຖືກສ້າງຂຶ້ນເພື່ອໃຊ້ສະເພາະພາຍໃນ Panel.jsx

// Component ສຳລັບສະແດງຫົວຂໍ້ຂອງແຕ່ລະສ່ວນ (Section) ທີ່ສາມາດຍຸບ/ຂະຫຍາຍໄດ້
const SectionHeader = ({ title, icon: Icon, isExpanded, onToggle }) => (
  <div className="panel-section-header" onClick={onToggle}>
    <h3 className="panel-section-header-h3">
      <Icon size={16} /> {/* ສະແດງ icon */}
      <span>{title}</span> {/* ສະແດງຊື່ຫົວຂໍ້ */}
    </h3>
    {/* ປຸ່ມລູກສອນທີ່ໝຸນຕາມສະຖານະ isExpanded */}
    <button className={`toggle-button ${isExpanded ? "expanded" : ""}`}>
      <ChevronDown size={20} />
    </button>
  </div>
);

// Component ສຳລັບສະແດງແຖບເລື່ອນປັບຄວາມໂປ່ງໃສ (Opacity Slider)
const OpacitySlider = ({ opacity, onOpacityChange, disabled }) => (
  <div className="opacity-slider-container">
    <input
      type="range" // ປະເພດ input ເປັນແຖບເລື່ອນ
      min="0" // ຄ່າຕ່ຳສຸດ
      max="1" // ຄ່າສູງສຸດ
      step="0.01" // ໄລຍະການປ່ຽນແປງ
      value={opacity} // ຄ່າປັດຈຸບັນ
      onChange={(e) => onOpacityChange(parseFloat(e.target.value))} // event handler ເມື່ອຄ່າປ່ຽນ
      disabled={disabled} // ປິດການໃຊ້ງານເມື່ອ disabled ເປັນ true
      className="opacity-slider"
    />
    {/* ສະແດງຄ່າ opacity ເປັນເປີເຊັນ */}
    <span className="opacity-value">{(opacity * 100).toFixed(0)}%</span>
  </div>
);

// Component ສຳລັບສະແດງລາຍການ Base Layers (ແຜນທີ່ພື້ນຫຼັງ)
const BaseLayersSection = ({
  baseLayerStates,
  onBaseMapChange,
  isExpanded,
}) => {
  // Array ຂອງຂໍ້ມູນ base maps ທີ່ມີຢູ່
  const baseMaps = [
    { key: "osm", name: "Street Map", icon: <StreetMapIcon size={18} /> },
    { key: "satellite", name: "Esri Satellite", icon: <Image size={18} /> },
    {
      key: "googleSatellite",
      name: "Google Satellite",
      icon: <Globe size={18} />,
    },
    { key: "googleHybrid", name: "Google Hybrid", icon: <Layers size={18} /> },
    { key: "topo", name: "Topographic", icon: <Mountain size={18} /> },
    { key: "carto", name: "Carto Voyager", icon: <MapPin size={18} /> },
  ];

  // ຖ້າ section ນີ້ບໍ່ໄດ້ຖືກຂະຫຍາຍ, ບໍ່ຕ້ອງ render ຫຍັງ
  if (!isExpanded) return null;

  return (
    <div className="property-grid">
      {/* Loop ຜ່ານ array baseMaps ເພື່ອສ້າງປຸ່ມ */}
      {baseMaps.map(
        ({ key, name, icon }) =>
          baseLayerStates[key] && (
            <button
              key={key}
              className={`basemap-option ${
                baseLayerStates[key].visible ? "active" : "" // ເພີ່ມ class 'active' ຖ້າ layer ກำลังສະແດງຜົນ
              }`}
              onClick={() => onBaseMapChange(key)} // ເອີ້ນ function ຈາກ props ເມື່ອຄລິກ
            >
              {icon}
              <span>{name}</span>
            </button>
          )
      )}
    </div>
  );
};

// Component ສຳລັບສະແດງ ແລະ ຄວບຄຸມແຕ່ລະ Imported Layer
const ImportedLayerControl = ({
  layer,
  onVisibilityChange,
  onOpacityChange,
  onRemove,
  onZoom,
}) => {
  return (
    <div className="layer-control-item">
      <div className="layer-control-header">
        <label className="layer-toggle-label">
          {/* Checkbox ສຳລັບເປີດ/ປິດການສະແດງຜົນ layer */}
          <input
            type="checkbox"
            checked={layer.visible}
            onChange={() => onVisibilityChange(layer.id, !layer.visible)}
          />
          <span className="layer-name" title={layer.name}>
            {layer.name}
          </span>
        </label>
        {/* ກຸ່ມປຸ່ມຄວບຄຸມ (Zoom, Remove) */}
        <div className="layer-actions">
          <button onClick={() => onZoom(layer.id)} title="Zoom to Layer">
            <ZoomIn size={16} />
          </button>
          <button onClick={() => onRemove(layer.id)} title="Remove Layer">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {/* ແຖບເລື່ອນ Opacity */}
      <OpacitySlider
        opacity={layer.opacity}
        onOpacityChange={(value) => onOpacityChange(layer.id, value)}
        disabled={!layer.visible} // ປິດການໃຊ້ງານຖ້າ layer ບໍ່ໄດ້ສະແດງຜົນ
      />
    </div>
  );
};

// Component ສຳລັບສະແດງລາຍການ Imported Layers ທັງໝົດ
const ImportedLayersSection = ({
  layers,
  onVisibilityChange,
  onOpacityChange,
  onRemove,
  onZoom,
  isExpanded,
}) => {
  if (!isExpanded) return null;

  return (
    <div className="property-grid">
      {layers.length > 0 ? ( // ກວດສອບວ່າມີ layer ທີ່ import ເຂົ້າມາແລ້ວບໍ່
        // ຖ້າມີ, loop ເພື່ອສ້າງ ImportedLayerControl ສຳລັບແຕ່ລະ layer
        layers.map((layer) => (
          <ImportedLayerControl
            key={layer.id}
            layer={layer}
            onVisibilityChange={onVisibilityChange}
            onOpacityChange={onOpacityChange}
            onRemove={onRemove}
            onZoom={onZoom}
          />
        ))
      ) : (
        // ຖ້າບໍ່ມີ, ສະແດງຂໍ້ຄວາມ
        <p className="no-items-message">No data imported yet.</p>
      )}
    </div>
  );
};

// --- Component ຫຼັກຂອງ Panel ---
const Panel = ({
  isVisible,
  baseLayerStates,
  onBaseMapChange,
  importedLayers,
  setImportedLayers,
  mapInstance,
}) => {
  // State ສຳລັບຄວບຄຸມການຍຸບ/ຂະຫຍາຍຂອງແຕ່ລະ section
  const [expandedSections, setExpandedSections] = useState({
    baseLayers: true, // ຄ່າເລີ່ມຕົ້ນໃຫ້ຂະຫຍາຍ
    importedLayers: true, // ຄ່າເລີ່ມຕົ້ນໃຫ້ຂະຫຍາຍ
  });

  // Function ສຳລັບປ່ຽນສະຖານະການຍຸບ/ຂະຫຍາຍ
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // --- Functions ຈັດການ Imported Layers (ຖືກส่งต่อไปยัง sub-components) ---
  const handleVisibilityChange = (id, visible) => {
    setImportedLayers((layers) =>
      layers.map((l) => (l.id === id ? { ...l, visible } : l))
    );
  };

  const handleOpacityChange = (id, opacity) => {
    setImportedLayers((layers) =>
      layers.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  };

  const handleRemoveLayer = (id) => {
    setImportedLayers((layers) => layers.filter((l) => l.id !== id));
  };

  const handleZoomToLayer = (id) => {
    if (!mapInstance) return;
    const layerToZoom = importedLayers.find((l) => l.id === id);
    if (layerToZoom && layerToZoom.features.length > 0) {
      const source = new VectorSource({ features: layerToZoom.features });
      const extent = source.getExtent();
      mapInstance.getView().fit(extent, {
        padding: [100, 100, 100, 100],
        duration: 1000,
      });
    }
  };

  // ສ່ວນ UI ຫຼັກຂອງ Panel
  return (
    <div className={`panel ${isVisible ? "visible" : ""}`}>
      {/* ສ່ວນຂອງ Base Layers */}
      <div className="panel-section">
        <SectionHeader
          title="Base Layers"
          icon={Layers}
          isExpanded={expandedSections.baseLayers}
          onToggle={() => toggleSection("baseLayers")}
        />
        <BaseLayersSection
          baseLayerStates={baseLayerStates}
          onBaseMapChange={onBaseMapChange}
          isExpanded={expandedSections.baseLayers}
        />
      </div>

      {/* ສ່ວນຂອງ Imported Layers */}
      <div className="panel-section">
        <SectionHeader
          title="Imported Layers"
          icon={Layers}
          isExpanded={expandedSections.importedLayers}
          onToggle={() => toggleSection("importedLayers")}
        />
        <ImportedLayersSection
          layers={importedLayers}
          onVisibilityChange={handleVisibilityChange}
          onOpacityChange={handleOpacityChange}
          onRemove={handleRemoveLayer}
          onZoom={handleZoomToLayer}
          isExpanded={expandedSections.importedLayers}
        />
      </div>
    </div>
  );
};

export default Panel;
