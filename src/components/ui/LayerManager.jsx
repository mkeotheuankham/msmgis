import React from "react";
import { Trash2, ZoomIn, Eye, EyeOff } from "lucide-react";

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

const LayerManager = ({ layers, setLayers, mapInstance }) => {
  const handleVisibilityChange = (id, visible) => {
    setLayers((currentLayers) =>
      currentLayers.map((l) => (l.id === id ? { ...l, visible } : l))
    );
  };

  const handleOpacityChange = (id, opacity) => {
    setLayers((currentLayers) =>
      currentLayers.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  };

  const handleRemoveLayer = (id) => {
    setLayers((currentLayers) => currentLayers.filter((l) => l.id !== id));
  };

  const handleZoomToLayer = (id) => {
    if (!mapInstance) return;
    const layerToZoom = layers.find((l) => l.id === id);
    if (layerToZoom && layerToZoom.features.length > 0) {
      const source = new VectorSource({ features: layerToZoom.features });
      const extent = source.getExtent();
      mapInstance.getView().fit(extent, {
        padding: [100, 100, 100, 100],
        duration: 1000,
      });
    }
  };

  if (layers.length === 0) {
    return <p className="no-items-message">No data imported yet.</p>;
  }

  return (
    <div className="layer-manager-container">
      {layers.map((layer) => (
        <div key={layer.id} className="layer-control-item">
          <div className="layer-control-header">
            <span className="layer-name" title={layer.name}>
              {layer.name}
            </span>
            <div className="layer-actions">
              <button
                onClick={() => handleVisibilityChange(layer.id, !layer.visible)}
                title={layer.visible ? "Hide Layer" : "Show Layer"}
              >
                {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
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
      ))}
    </div>
  );
};

export default LayerManager;
