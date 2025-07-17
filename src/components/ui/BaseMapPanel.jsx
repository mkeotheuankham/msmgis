import React from "react";
import {
  Layers,
  Map as StreetMapIcon,
  Globe,
  Mountain,
  Image,
  MapPin,
} from "lucide-react";

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

const BaseMapPanel = ({
  isVisible,
  baseLayerStates,
  onBaseMapChange,
  onBaseMapOpacityChange,
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

  return (
    <div className={`panel ${isVisible ? "visible" : ""}`}>
      <div className="panel-section">
        <div className="panel-section-header static">
          <h3 className="panel-section-header-h3">
            <Layers size={16} />
            <span>Base Maps</span>
          </h3>
        </div>
        <div className="property-grid">
          {baseMaps.map(({ key, name, icon }) => {
            const layer = baseLayerStates[key];
            if (!layer) return null;
            return (
              <div key={key} className="layer-control-item">
                <button
                  className={`basemap-option ${layer.visible ? "active" : ""}`}
                  onClick={() => onBaseMapChange(key)}
                >
                  {icon}
                  <span>{name}</span>
                </button>
                <OpacitySlider
                  opacity={layer.opacity}
                  onOpacityChange={(value) =>
                    onBaseMapOpacityChange(key, value)
                  }
                  disabled={!layer.visible}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BaseMapPanel;
