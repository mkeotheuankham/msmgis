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
  Edit, // ນຳເຂົ້າ icon ແກ້ໄຂ
} from "lucide-react";
import VectorSource from "ol/source/Vector";

// --- Sub-Components (ໃຊ້ພາຍໃນ Panel) ---

const SectionHeader = ({ title, icon, isExpanded, onToggle }) => {
  // **ແກ້ໄຂ:** ປ່ຽນວິທີຮັບ prop ເພື່ອແກ້ບັນຫາ ESLint
  const IconComponent = icon;
  return (
    <div className="panel-section-header" onClick={onToggle}>
      <h3 className="panel-section-header-h3">
        {IconComponent && <IconComponent size={16} />}
        <span>{title}</span>
      </h3>
      <button className={`toggle-button ${isExpanded ? "expanded" : ""}`}>
        <ChevronDown size={20} />
      </button>
    </div>
  );
};

const OpacitySlider = ({ opacity, onOpacityChange, disabled }) => (
  <div className="opacity-slider-container">
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={opacity}
      onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
      disabled={disabled}
      className="opacity-slider"
    />
    <span className="opacity-value">{(opacity * 100).toFixed(0)}%</span>
  </div>
);

// --- Sections ---

const BaseLayersSection = ({
  isExpanded,
  baseLayerStates,
  onBaseMapChange,
  onBaseMapOpacityChange,
}) => {
  if (!isExpanded) return null;

  const baseMaps = [
    { key: "osm", name: "Street Map", icon: StreetMapIcon },
    { key: "satellite", name: "Esri Satellite", icon: Image },
    { key: "googleSatellite", name: "Google Satellite", icon: Globe },
    { key: "googleHybrid", name: "Google Hybrid", icon: Layers },
    { key: "topo", name: "Topographic", icon: Mountain },
    { key: "carto", name: "Carto Voyager", icon: MapPin },
  ];

  return (
    <div className="property-grid">
      {!baseLayerStates ? (
        <p className="no-items-message">Loading base maps...</p>
      ) : (
        baseMaps.map(({ key, name, icon }) => {
          // **ແກ້ໄຂ:** ປ່ຽນວິທີຮັບ prop ເພື່ອແກ້ບັນຫາ ESLint
          const IconComponent = icon;
          return (
            <div key={key} className="layer-control-item">
              <div className="layer-control-header">
                <label className="layer-toggle-label">
                  <input
                    type="checkbox"
                    checked={baseLayerStates[key]?.visible || false}
                    onChange={() => onBaseMapChange(key)}
                  />
                  {IconComponent && (
                    <IconComponent size={16} className="layer-icon" />
                  )}
                  <span className="layer-name">{name}</span>
                </label>
              </div>
              <OpacitySlider
                opacity={baseLayerStates[key]?.opacity || 1}
                onOpacityChange={(value) => onBaseMapOpacityChange(key, value)}
                disabled={!baseLayerStates[key]?.visible}
              />
            </div>
          );
        })
      )}
    </div>
  );
};

const ImportedLayersSection = ({
  isExpanded,
  layers,
  setImportedLayers,
  mapInstance,
  onStyleEdit,
}) => {
  if (!isExpanded) return null;

  const handleVisibilityChange = (id, visible) => {
    setImportedLayers((currentLayers) =>
      currentLayers.map((l) => (l.id === id ? { ...l, visible } : l))
    );
  };

  const handleOpacityChange = (id, opacity) => {
    setImportedLayers((currentLayers) =>
      currentLayers.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  };

  const handleRemoveLayer = (id) => {
    setImportedLayers((currentLayers) =>
      currentLayers.filter((l) => l.id !== id)
    );
  };

  const handleZoomToLayer = (id) => {
    if (!mapInstance) return;
    const layerToZoom = layers.find((l) => l.id === id);
    if (
      layerToZoom &&
      layerToZoom.features &&
      layerToZoom.features.length > 0
    ) {
      const source = new VectorSource({ features: layerToZoom.features });
      const extent = source.getExtent();
      mapInstance.getView().fit(extent, {
        padding: [100, 100, 100, 100],
        duration: 1000,
        maxZoom: 19,
      });
    }
  };

  return (
    <div className="property-grid">
      {layers && layers.length > 0 ? (
        layers.map((layer) => (
          <div key={layer.id} className="layer-control-item">
            <div className="layer-control-header">
              <label className="layer-toggle-label">
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() =>
                    handleVisibilityChange(layer.id, !layer.visible)
                  }
                />
                <span className="layer-name" title={layer.name}>
                  {layer.name}
                </span>
              </label>
              <div className="layer-actions">
                <button
                  onClick={() => onStyleEdit(layer.id)}
                  title="Edit Style"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleZoomToLayer(layer.id)}
                  title="Zoom to Layer"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={() => handleRemoveLayer(layer.id)}
                  title="Remove Layer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <OpacitySlider
              opacity={layer.opacity}
              onOpacityChange={(value) => handleOpacityChange(layer.id, value)}
              disabled={!layer.visible}
            />
          </div>
        ))
      ) : (
        <p className="no-items-message">No data imported yet.</p>
      )}
    </div>
  );
};

// --- Main Panel Component ---
const Panel = ({
  isVisible,
  baseLayerStates,
  onBaseMapChange,
  onBaseMapOpacityChange,
  importedLayers,
  setImportedLayers,
  mapInstance,
  onStyleEdit,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    baseLayers: true,
    importedLayers: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className={`panel ${isVisible ? "visible" : ""}`}>
      <div className="panel-section">
        <SectionHeader
          title="Base Layers"
          icon={Layers}
          isExpanded={expandedSections.baseLayers}
          onToggle={() => toggleSection("baseLayers")}
        />
        <BaseLayersSection
          isExpanded={expandedSections.baseLayers}
          baseLayerStates={baseLayerStates}
          onBaseMapChange={onBaseMapChange}
          onBaseMapOpacityChange={onBaseMapOpacityChange}
        />
      </div>

      <div className="panel-section">
        <SectionHeader
          title="Imported Layers"
          icon={Layers}
          isExpanded={expandedSections.importedLayers}
          onToggle={() => toggleSection("importedLayers")}
        />
        <ImportedLayersSection
          isExpanded={expandedSections.importedLayers}
          layers={importedLayers}
          setImportedLayers={setImportedLayers}
          mapInstance={mapInstance}
          onStyleEdit={onStyleEdit}
        />
      </div>
    </div>
  );
};

export default Panel;
