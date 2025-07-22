import React from "react";
import {
  Layers,
  Map as StreetMapIcon,
  Globe,
  Earth,
  MapPlus,
  Satellite,
  Layers2,
} from "lucide-react";

// Component ສຳລັບສະແດງແຖບເລື່ອນປັບຄວາມໂປ່ງໃສ (Opacity Slider)
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

// Component ຫຼັກຂອງ BaseMap Panel
const BaseMapPanel = ({
  isVisible,
  baseLayerStates,
  onBaseMapChange,
  onBaseMapOpacityChange,
}) => {
  const baseMaps = [
    { key: "osm", name: "Street Map", icon: StreetMapIcon },
    { key: "satellite", name: "Esri Satellite", icon: Satellite },
    { key: "googleSatellite", name: "Google Satellite", icon: Globe },
    { key: "googleHybrid", name: "Google Hybrid", icon: Earth },
    { key: "topo", name: "Stadia AlidadeSatellite", icon: MapPlus },
    { key: "carto", name: "Carto Voyager", icon: Layers2 },
  ];

  const styles = `
    .panel {
      position: absolute; top: 0; right: 0; bottom: 0;
      width: 280px; background: #2a2d32;
      border-left: 1px solid #4a4d52;
      overflow-y: auto; display: flex; flex-direction: column;
      padding: 1rem; z-index: 10;
      transform: translateX(100%);
      transition: transform 0.3s ease-in-out;
      box-shadow: -5px 0 15px rgba(0, 0, 0, 0.3);
    }
    .panel.visible {
      transform: translateX(0);
    }
    .panel-section {
      background-color: #1a1d21;
      border-radius: 8px;
      padding: 1rem;
      border: 1px solid #4a4d52;
    }
    .panel-section-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 4px 0; margin-bottom: 8px; color: #f0f0f0;
    }
    .panel-section-header.static { cursor: default; }
    .panel-section-header-h3 {
      margin: 0; font-size: 1.05rem; font-weight: 600;
      display: flex; align-items: center; gap: 8px;
    }
    .property-grid {
      padding-top: 8px; display: grid; gap: 10px;
    }
    .layer-control-item {
      background-color: #2a2d32;
      border-radius: 6px; padding: 0.75rem;
      display: flex; flex-direction: column; gap: 0.75rem;
      border: 1px solid #4a4d52;
    }
    .opacity-slider-container {
      display: flex; align-items: center; gap: 8px; width: 100%;
    }
    .opacity-slider { flex-grow: 1; }
    .opacity-value {
      font-size: 0.8rem; color: #a0a0a0; min-width: 35px; text-align: right;
    }
    .basemap-option {
      display: flex; align-items: center; gap: 0.5rem;
      background-color: transparent; border: none; color: #a0a0a0;
      padding: 0.5rem; text-align: left; width: 100%;
      cursor: pointer; border-radius: 4px;
      transition: background-color 0.2s, color 0.2s;
    }
    .basemap-option:hover {
      background-color: #3a3d42; color: #f0f0f0;
    }
    .basemap-option.active {
      background-color: #007acc; color: white; font-weight: 600;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className={`panel ${isVisible ? "visible" : ""}`}>
        <div className="panel-section">
          <div className="panel-section-header static">
            <h3 className="panel-section-header-h3">
              <Layers size={16} />
              <span>Base Maps</span>
            </h3>
          </div>
          <div className="property-grid">
            {baseMaps.map((item) => {
              const layer = baseLayerStates[item.key];
              if (!layer) return null;
              return (
                <div key={item.key} className="layer-control-item">
                  <button
                    className={`basemap-option ${
                      layer.visible ? "active" : ""
                    }`}
                    onClick={() => onBaseMapChange(item.key)}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </button>
                  <OpacitySlider
                    opacity={layer.opacity}
                    onOpacityChange={(value) =>
                      onBaseMapOpacityChange(item.key, value)
                    }
                    disabled={!layer.visible}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default BaseMapPanel;
