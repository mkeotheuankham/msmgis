// ນຳເຂົ້າ React library ແລະ icons ທີ່ຈຳເປັນ
import React from "react";
import { Trash2, ZoomIn, Eye, EyeOff } from "lucide-react";

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
const LayerManager = ({ layers, setLayers, mapInstance }) => {
  // Function ຈັດການການປ່ຽນແປງສະຖານະການເບິ່ງເຫັນ (ເປີດ/ປິດ) ຂອງເລເຢີ
  const handleVisibilityChange = (id, visible) => {
    // ອັບເດດ state 'layers'
    setLayers((currentLayers) =>
      // ໃຊ້ .map ເພື່ອສ້າງ array ໃໝ່
      currentLayers.map((l) =>
        // ຖ້າ id ຂອງເລເຢີກົງກັນ, ໃຫ້ອັບເດດ property 'visible', ຖ້າບໍ່ກົງໃຫ້ຄືນຄ່າເກົ່າ
        l.id === id ? { ...l, visible } : l
      )
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
    // ໃຊ້ .filter ເພື່ອສ້າງ array ໃໝ່ທີ່ບໍ່ມີເລເຢີທີ່ມີ id ກົງກັນ
    setLayers((currentLayers) => currentLayers.filter((l) => l.id !== id));
  };

  // Function ຈັດການການຊູມໄປຫາຂອບເຂດຂອງເລເຢີ
  const handleZoomToLayer = (id) => {
    if (!mapInstance) return; // ກວດສອບວ່າມີ map instance ຫຼືບໍ່
    // ຊອກຫາເລເຢີທີ່ມີ id ກົງກັນ
    const layerToZoom = layers.find((l) => l.id === id);
    // ກວດສອບວ່າເລເຢີມີຢູ່ ແລະ ມີ features
    if (layerToZoom && layerToZoom.features.length > 0) {
      // ສ້າງ VectorSource ຊົ່ວຄາວເພື່ອຄຳນວນຂອບເຂດ (extent)
      const source = new VectorSource({ features: layerToZoom.features });
      const extent = source.getExtent();
      // ສັ່ງໃຫ້ແຜນທີ່ซูมไปหาขอบเขตนั้น
      mapInstance.getView().fit(extent, {
        padding: [100, 100, 100, 100], // ເພີ່ມ padding ຮອບຂອບເຂດ
        duration: 1000, // ໄລຍະເວລາຂອງ animation
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
              {/* ປຸ່ມສຳລັບເປີດ/ປິດການສະແດງຜົນ */}
              <button
                onClick={() => handleVisibilityChange(layer.id, !layer.visible)}
                title={layer.visible ? "Hide Layer" : "Show Layer"}
              >
                {/* ສະແດງ icon ຕາມສະຖານະ visible */}
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

// ສົ່ງອອກ component ເພື່ອໃຫ້ໄຟລ໌ອື່ນສາມາດນຳໄປໃຊ້ໄດ້
export default LayerManager;
