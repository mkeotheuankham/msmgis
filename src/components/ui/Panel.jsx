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

// --- Internal Sub-Components ---

const SectionHeader = ({ title, icon: Icon, isExpanded, onToggle }) => (
  <div className="panel-section-header" onClick={onToggle}>
    <h3 className="panel-section-header-h3">
      <Icon size={16} />
      <span>{title}</span>
    </h3>
    <button className={`toggle-button ${isExpanded ? "expanded" : ""}`}>
      <ChevronDown size={20} />
    </button>
  </div>
);

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

const BaseLayersSection = ({
  baseLayerStates,
  onBaseMapChange,
  isExpanded,
}) => {
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

  if (!isExpanded) return null;

  return (
    <div className="property-grid">
      {baseMaps.map(
        ({ key, name, icon }) =>
          baseLayerStates[key] && (
            <button
              key={key}
              className={`basemap-option ${
                baseLayerStates[key].visible ? "active" : ""
              }`}
              onClick={() => onBaseMapChange(key)}
            >
              {icon}
              <span>{name}</span>
            </button>
          )
      )}
    </div>
  );
};

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
          <input
            type="checkbox"
            checked={layer.visible}
            onChange={() => onVisibilityChange(layer.id, !layer.visible)}
          />
          <span className="layer-name" title={layer.name}>
            {layer.name}
          </span>
        </label>
        <div className="layer-actions">
          <button onClick={() => onZoom(layer.id)} title="Zoom to Layer">
            <ZoomIn size={16} />
          </button>
          <button onClick={() => onRemove(layer.id)} title="Remove Layer">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <OpacitySlider
        opacity={layer.opacity}
        onOpacityChange={(value) => onOpacityChange(layer.id, value)}
        disabled={!layer.visible}
      />
    </div>
  );
};

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
      {layers.length > 0 ? (
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
  importedLayers,
  setImportedLayers,
  mapInstance,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    baseLayers: true,
    importedLayers: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // --- Handlers for Imported Layers ---
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

  return (
    <div className={`panel ${isVisible ? "visible" : ""}`}>
      {/* Base Layers Section */}
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

      {/* Imported Layers Section */}
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
