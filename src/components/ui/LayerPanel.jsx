import React, { useState } from "react";
import {
  Layers,
  ChevronDown,
  Trash2,
  ZoomIn,
  Eye,
  EyeOff,
  Palette,
  Image as ImageIcon,
} from "lucide-react";
import VectorSource from "ol/source/Vector";

// --- Reusable Sub-Components ---

const SectionHeader = ({ title, icon, isExpanded, onToggle }) => {
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

// --- Layer Control Components ---

const VectorLayerControls = ({
  layer,
  onVisibilityChange,
  onOpacityChange,
  onRemove,
  onZoom,
  onStyleEdit,
}) => (
  <div className="layer-control-item">
    <div className="layer-control-header">
      <span className="layer-name" title={layer.name}>
        {layer.name}
      </span>
      <div className="layer-actions">
        <button onClick={() => onStyleEdit(layer.id)} title="Edit Style">
          <Palette size={16} />
        </button>
        <button
          onClick={() => onVisibilityChange(layer.id, !layer.visible)}
          title={layer.visible ? "Hide Layer" : "Show Layer"}
        >
          {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
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

const ImageLayerControls = ({
  layer,
  onVisibilityChange,
  onOpacityChange,
  onRemove,
  onZoom,
}) => (
  <div className="layer-control-item">
    <div className="layer-control-header">
      <span className="layer-name" title={layer.name}>
        {layer.name}
      </span>
      <div className="layer-actions">
        <button
          onClick={() => onVisibilityChange(layer.id, !layer.visible)}
          title={layer.visible ? "Hide Layer" : "Show Layer"}
        >
          {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
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

// --- Main Layer Panel Component ---

const LayerPanel = ({
  isVisible,
  importedLayers,
  setImportedLayers,
  imageLayers,
  setImageLayers,
  mapInstance,
  onStyleEdit,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    vectors: true,
    images: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // --- Handlers for Vector Layers ---
  const handleVectorVisibilityChange = (id, visible) =>
    setImportedLayers((layers) =>
      layers.map((l) => (l.id === id ? { ...l, visible } : l))
    );
  const handleVectorOpacityChange = (id, opacity) =>
    setImportedLayers((layers) =>
      layers.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  const handleVectorRemove = (id) =>
    setImportedLayers((layers) => layers.filter((l) => l.id !== id));
  const handleVectorZoom = (id) => {
    if (!mapInstance) return;
    const layerToZoom = importedLayers.find((l) => l.id === id);
    if (
      layerToZoom &&
      layerToZoom.features &&
      layerToZoom.features.length > 0
    ) {
      const source = new VectorSource({ features: layerToZoom.features });
      mapInstance
        .getView()
        .fit(source.getExtent(), {
          padding: [100, 100, 100, 100],
          duration: 1000,
        });
    }
  };

  // --- Handlers for Image Layers ---
  const handleImageVisibilityChange = (id, visible) =>
    setImageLayers((layers) =>
      layers.map((l) => (l.id === id ? { ...l, visible } : l))
    );
  const handleImageOpacityChange = (id, opacity) =>
    setImageLayers((layers) =>
      layers.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  const handleImageRemove = (id) =>
    setImageLayers((layers) => layers.filter((l) => l.id !== id));
  const handleImageZoom = (id) => {
    if (!mapInstance) return;
    const layerToZoom = imageLayers.find((l) => l.id === id);
    if (layerToZoom) {
      mapInstance
        .getView()
        .fit(layerToZoom.extent, { padding: [50, 50, 50, 50], duration: 1000 });
    }
  };

  const styles = `
    .panel {
      position: absolute; top: 0; right: 0; bottom: 0;
      width: 300px;
      background-color: rgba(26, 29, 33, 0.8); /* Semi-transparent background */
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      overflow-y: auto;
      display: flex; flex-direction: column;
      gap: 1rem; padding: 1rem; z-index: 10;
      transform: translateX(100%);
      transition: transform 0.3s ease-in-out;
    }
    .panel.visible {
      transform: translateX(0);
    }
    /* Custom Scrollbar */
    .panel::-webkit-scrollbar { width: 6px; }
    .panel::-webkit-scrollbar-track { background: transparent; }
    .panel::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.2); border-radius: 3px; }
    .panel::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.4); }

    .panel-section {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .panel-section-header {
      display: flex; justify-content: space-between; align-items: center;
      cursor: pointer; padding: 0.75rem 1rem;
      color: #f0f0f0;
    }
    .panel-section-header-h3 {
      margin: 0; font-size: 1.05rem; font-weight: 600;
      display: flex; align-items: center; gap: 8px;
    }
    .toggle-button {
      background: none; border: none; color: #f0f0f0;
      cursor: pointer; padding: 0; display: flex;
      align-items: center; justify-content: center;
      transition: transform 0.2s ease-in-out;
    }
    .toggle-button.expanded {
        transform: rotate(0deg);
    }
    .toggle-button:not(.expanded) {
      transform: rotate(-90deg);
    }
    .layer-manager-container {
      display: flex; flex-direction: column; gap: 0.75rem;
      padding: 0 1rem 1rem 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .layer-control-item {
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 6px; padding: 0.75rem;
      display: flex; flex-direction: column; gap: 0.75rem;
    }
    .layer-control-header {
      display: flex; justify-content: space-between; align-items: center;
    }
    .layer-name {
      font-size: 0.9rem; font-weight: 500; color: #f0f0f0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      flex-grow: 1; margin-right: 1rem;
    }
    .layer-actions {
      display: flex; align-items: center; gap: 0.5rem;
    }
    .layer-actions button {
      background: transparent; border: none; color: #a0a0a0;
      cursor: pointer; padding: 0.25rem; display: flex;
      align-items: center; border-radius: 4px;
      transition: background-color 0.2s, color 0.2s;
    }
    .layer-actions button:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: #00aaff;
    }
    .opacity-slider-container {
      display: flex; align-items: center; gap: 8px; width: 100%;
    }
    .opacity-slider { flex-grow: 1; }
    .opacity-value {
      font-size: 0.8rem; color: #a0a0a0; min-width: 35px; text-align: right;
    }
    .no-items-message {
      font-style: italic; color: #a0a0a0; text-align: center;
      padding: 15px 0;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className={`panel ${isVisible ? "visible" : ""}`}>
        {/* Vector Layers Section */}
        <div className="panel-section">
          <SectionHeader
            title="Imported Layers"
            icon={Layers}
            isExpanded={expandedSections.vectors}
            onToggle={() => toggleSection("vectors")}
          />
          {expandedSections.vectors && (
            <div className="layer-manager-container">
              {importedLayers && importedLayers.length > 0 ? (
                importedLayers.map((layer) => (
                  <VectorLayerControls
                    key={layer.id}
                    layer={layer}
                    onVisibilityChange={handleVectorVisibilityChange}
                    onOpacityChange={handleVectorOpacityChange}
                    onRemove={handleVectorRemove}
                    onZoom={handleVectorZoom}
                    onStyleEdit={onStyleEdit}
                  />
                ))
              ) : (
                <p className="no-items-message">No vector data imported yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Image Layers Section */}
        <div className="panel-section">
          <SectionHeader
            title="Image Layers"
            icon={ImageIcon}
            isExpanded={expandedSections.images}
            onToggle={() => toggleSection("images")}
          />
          {expandedSections.images && (
            <div className="layer-manager-container">
              {imageLayers && imageLayers.length > 0 ? (
                imageLayers.map((layer) => (
                  <ImageLayerControls
                    key={layer.id}
                    layer={layer}
                    onVisibilityChange={handleImageVisibilityChange}
                    onOpacityChange={handleImageOpacityChange}
                    onRemove={handleImageRemove}
                    onZoom={handleImageZoom}
                  />
                ))
              ) : (
                <p className="no-items-message">No images imported yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LayerPanel;
