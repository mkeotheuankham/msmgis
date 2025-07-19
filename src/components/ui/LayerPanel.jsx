// ນຳເຂົ້າ React hooks ແລະ icons ທີ່ຈຳເປັນ
import React, { useState } from "react";
import "./Panels.css";
import {
  Layers,
  ChevronDown,
  Trash2,
  ZoomIn,
  Eye,
  EyeOff,
  Palette,
} from "lucide-react";
// ນຳເຂົ້າ VectorSource ຈາກ OpenLayers ເພື່ອໃຊ້ໃນການຄຳນວນ extent
import VectorSource from "ol/source/Vector";

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

// Component ຫຼັກສຳລັບຈັດການ ແລະ ສະແດງລາຍການເລເຢີທີ່ນຳເຂົ້າມາ
const LayerManager = ({ layers, setLayers, mapInstance, onStyleEdit }) => {
  // Function ຈັດການການປ່ຽນແປງສະຖານະການເບິ່ງເຫັນ (ເປີດ/ປິດ) ຂອງເລເຢີ
  const handleVisibilityChange = (id, visible) => {
    setLayers((currentLayers) =>
      currentLayers.map((l) => (l.id === id ? { ...l, visible } : l))
    );
  };

  // Function ຈັດການການປ່ຽນແປງຄ່າຄວາມໂປ່ງໃສ (opacity) ຂອງເລເຢີ
  const handleOpacityChange = (id, opacity) => {
    setLayers((currentLayers) =>
      currentLayers.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  };

  // Function ຈັດການການລຶບເລເຢີ
  const handleRemoveLayer = (id) => {
    setLayers((currentLayers) => currentLayers.filter((l) => l.id !== id));
  };

  // Function ຈັດການການຊູມໄປຫາຂອບເຂດຂອງເລເຢີ
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

  // ຖ້າບໍ່ມີເລເຢີທີ່ນຳເຂົ້າມາ, ໃຫ້ສະແດງຂໍ້ຄວາມແຈ້ງເຕືອນ
  if (layers.length === 0) {
    return <p className="no-items-message">No data imported yet.</p>;
  }

  // ສ່ວນ UI ຂອງ LayerManager
  return (
    <div className="layer-manager-container">
      {/* Loop ຜ່ານທຸກເລເຢີໃນ array ເພື່ອສ້າງລາຍການຄວບຄຸມ */}
      {layers.map((layer) => (
        <div key={layer.id} className="layer-control-item">
          <div className="layer-control-header">
            <span className="layer-name" title={layer.name}>
              {layer.name}
            </span>
            <div className="layer-actions">
              {/* ປຸ່ມສຳລັບແກ້ໄຂ Style */}
              <button onClick={() => onStyleEdit(layer.id)} title="Edit Style">
                <Palette size={16} />
              </button>
              {/* ປຸ່ມສຳລັບເປີດ/ປິດການສະແດງຜົນ */}
              <button
                onClick={() => handleVisibilityChange(layer.id, !layer.visible)}
                title={layer.visible ? "Hide Layer" : "Show Layer"}
              >
                {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              {/* ປຸ່ມສຳລັບຊູມ */}
              <button
                onClick={() => handleZoomToLayer(layer.id)}
                title="Zoom to Layer"
              >
                <ZoomIn size={16} />
              </button>
              {/* ປຸ່ມສຳລັບລຶບ */}
              <button
                onClick={() => handleRemoveLayer(layer.id)}
                title="Remove Layer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          {/* ແຖບເລື່ອນ Opacity */}
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

// Component ຫຼັກຂອງ Layer Panel (ແຜງດ້ານຂ້າງ)
const LayerPanel = ({
  isVisible,
  importedLayers,
  setImportedLayers,
  mapInstance,
  onStyleEdit,
}) => {
  // State ສຳລັບຄວບຄຸມການຍຸບ/ຂະຫຍາຍຂອງສ່ວນ "Imported Layers"
  const [isImportedLayersExpanded, setIsImportedLayersExpanded] =
    useState(true);

  // ສ່ວນ UI ຫຼັກຂອງ Panel, ຈະເພີ່ມ class 'visible' ເພື່ອໃຫ້ມັນເລື່ອນເຂົ້າມາ
  return (
    <div className={`panel ${isVisible ? "visible" : ""}`}>
      <div className="panel-section">
        <SectionHeader
          title="Imported Layers"
          icon={Layers}
          isExpanded={isImportedLayersExpanded}
          onToggle={() => setIsImportedLayersExpanded((prev) => !prev)}
        />
        {/* ກວດສອບວ່າຖ້າ section ຖືກຂະຫຍາຍຢູ່, ຈຶ່ງຈະ render LayerManager */}
        {isImportedLayersExpanded && (
          <LayerManager
            layers={importedLayers}
            setLayers={setImportedLayers}
            mapInstance={mapInstance}
            onStyleEdit={onStyleEdit}
          />
        )}
      </div>
    </div>
  );
};

export default LayerPanel;
