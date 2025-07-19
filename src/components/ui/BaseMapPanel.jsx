// ນຳເຂົ້າ React library ແລະ icons ທີ່ຈຳເປັນ
import React from "react";
import "./Panels.css";
import {
  Layers,
  Map as StreetMapIcon,
  Globe,
  Mountain,
  Image,
  MapPin,
} from "lucide-react";

// Component ສຳລັບສະແດງແຖບເລື່ອນປັບຄວາມໂປ່ງໃສ (Opacity Slider)
// ເປັນ sub-component ທີ່ນຳໄປໃຊ້ຄືນໄດ້
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

// Component ຫຼັກຂອງ BaseMap Panel (ແຜງດ້ານຂ້າງສຳລັບເລືອກແຜນທີ່ພື້ນຫຼັງ)
const BaseMapPanel = ({
  isVisible, // ສະຖານະການສະແດງ/ເຊື່ອງ panel
  baseLayerStates, // Object ທີ່ເກັບສະຖານະ (visible, opacity) ຂອງທຸກ base layer
  onBaseMapChange, // Function ທີ່ເອີ້ນເມື່ອມີການເລືອກ base map
  onBaseMapOpacityChange, // Function ທີ່ເອີ້ນເມື່ອມີການປັບ opacity
}) => {
  // Array ຂອງ object ທີ່ກຳນົດຂໍ້ມູນຂອງແຕ່ລະ base map ທີ່ມີໃຫ້ເລືອກ
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

  // ສ່ວນຂອງ UI ທີ່ component ຈະ render ອອກມາ
  return (
    // Container ຫຼັກຂອງ panel, ຈະເພີ່ມ class 'visible' ເພື່ອໃຫ້ມັນເລື່ອນເຂົ້າມາ
    <div className={`panel ${isVisible ? "visible" : ""}`}>
      <div className="panel-section">
        {/* ຫົວຂໍ້ຂອງ panel (ແບບ static, ຄລິກບໍ່ໄດ້) */}
        <div className="panel-section-header static">
          <h3 className="panel-section-header-h3">
            <Layers size={16} />
            <span>Base Maps</span>
          </h3>
        </div>
        {/* Container ສຳລັບລາຍການ base maps */}
        <div className="property-grid">
          {/* Loop ຜ່ານ array baseMaps ເພື່ອສ້າງລາຍການຄວບຄຸມສຳລັບແຕ່ລະ base map */}
          {baseMaps.map(({ key, name, icon }) => {
            // ເອົາສະຖານະປັດຈຸບັນຂອງ layer ຈາກ props
            const layer = baseLayerStates[key];
            // ຖ້າບໍ່ມີข้อมูล layer, ບໍ່ຕ້ອງ render
            if (!layer) return null;
            return (
              <div key={key} className="layer-control-item">
                {/* ປຸ່ມສຳລັບເລືອກ/ຍົກເລີກ base map */}
                <button
                  className={`basemap-option ${layer.visible ? "active" : ""}`}
                  onClick={() => onBaseMapChange(key)}
                >
                  {icon}
                  <span>{name}</span>
                </button>
                {/* ແຖບເລື່ອນ Opacity */}
                <OpacitySlider
                  opacity={layer.opacity}
                  onOpacityChange={(value) =>
                    onBaseMapOpacityChange(key, value)
                  }
                  disabled={!layer.visible} // ປິດການໃຊ້ງານຖ້າ layer ບໍ່ໄດ້ສະແດງຜົນ
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ສົ່ງອອກ component ເພື່ອໃຫ້ໄຟລ໌ອື່ນສາມາດນຳໄປໃຊ້ໄດ້
export default BaseMapPanel;
