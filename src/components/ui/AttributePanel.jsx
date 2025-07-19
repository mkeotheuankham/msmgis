// ນຳເຂົ້າ React hooks (useEffect, useRef) ແລະ icons ທີ່ຈຳເປັນ
import React, { useEffect, useRef } from "react";
import "./Panels.css";
import { X, Info } from "lucide-react";

// Component ສຳລັບສະແດງໜ້າຕ່າງຂໍ້ມູນ (Attribute) ຂອງ feature ທີ່ຖືກເລືອກ
const AttributePanel = ({ info, onClose, map }) => {
  // ໃຊ້ useRef ເພື່ອເກັບ reference ໄປຫາ DOM element ຂອງ panel
  // ເພື່ອຈະສາມາດອ່ານຂະໜາດ ແລະ ກໍານົດຕໍາແໜ່ງໄດ້
  const panelRef = useRef(null);

  // useEffect hook ນີ້ຈະເຮັດວຽກເມື່ອ `info` ຫຼື `map` ປ່ຽນແປງ
  // ໃຊ້ສຳລັບຈັດຕຳແໜ່ງຂອງ panel ໃຫ້ສະແດງຢູ່ໃກ້ໆກັບຈຸດທີ່ຄລິກເທິງແຜນທີ່
  useEffect(() => {
    // ກວດສອບວ່າ props ທີ່ຈຳເປັນ (info, map) ແລະ panelRef ມີຄົບຖ້ວນບໍ່, ຖ້າບໍ່ຄົບກໍອອກຈາກ function
    if (!info || !map || !panelRef.current) return;

    // ໂລຈິກນີ້ໃຊ້ຄຳນວນຕຳແໜ່ງຂອງ panel ໂດຍອີງໃສ່ຈຸດທີ່ຄລິກເທິງແຜນທີ່ (pixel)
    // ແລະ ຮັບປະກັນວ່າ panel ຈະບໍ່ລົ້ນອອກຈາກຂອບເຂດຂອງແຜນທີ່
    const pixel = map.getPixelFromCoordinate(info.coordinate); // ແປງພິກັດແຜນທີ່ເປັນພິກັດໜ້າຈໍ (pixel)
    const mapSize = map.getSize(); // ເອົາຂະໜາດຂອງແຜນທີ່ (ກວ້າງ, ສູງ)
    const panelElement = panelRef.current; // DOM element ຂອງ panel

    // ຄຳນວນຕຳແໜ່ງເລີ່ມຕົ້ນຂອງ panel (ດ້ານຂວາເທິງຂອງຈຸດທີ່ຄລິກ)
    let left = pixel[0] + 20;
    let top = pixel[1] - 20;

    // ປັບຕຳແໜ່ງຖ້າ panel ຈະລົ້ນອອກຈາກຂອບເຂດ
    // ຖ້າຂອບຂວາຂອງ panel ເກີນຂອບຂວາຂອງແຜນທີ່, ໃຫ້ຍ້າຍ panel ໄປຢູ່ດ້ານຊ້າຍຂອງຈຸດທີ່ຄລິກ
    if (left + panelElement.offsetWidth > mapSize[0] - 10) {
      left = pixel[0] - panelElement.offsetWidth - 20;
    }
    // ຖ້າຂອບລຸ່ມຂອງ panel ເກີນຂອບລຸ່ມຂອງແຜນທີ່, ໃຫ້ຍ້າຍ panel ຂຶ້ນເທິງ
    if (top + panelElement.offsetHeight > mapSize[1] - 10) {
      top = mapSize[1] - panelElement.offsetHeight - 10;
    }
    // ຮັບປະກັນວ່າ panel ບໍ່ລົ້ນອອກຂອບເທິງ
    if (top < 10) {
      top = 10;
    }
    // ຮັບປະກັນວ່າ panel ບໍ່ລົ້ນອອກຂອບຊ້າຍ
    if (left < 10) {
      left = 10;
    }

    // ກຳນົດຄ່າ style `left` ແລະ `top` ໃຫ້ກັບ panel element
    panelElement.style.left = `${left}px`;
    panelElement.style.top = `${top}px`;
  }, [info, map]); // Dependency array: effect ນີ້ຈະເຮັດວຽກໃໝ່ເມື່ອ `info` ຫຼື `map` ປ່ຽນແປງ

  // ຖ້າບໍ່ມີຂໍ້ມູນ (info) ຫຼື ບໍ່ມີ attributes, ໃຫ້ return null (ບໍ່ render ຫຍັງ)
  if (!info || !info.attributes) return null;

  // ກັ່ນຕອງ attributes ເພື່ອບໍ່ໃຫ້ສະແດງ property 'geometry' ທີ່ບໍ່ຈຳເປັນສຳລັບຜູ້ໃຊ້
  const attributesToShow = Object.entries(info.attributes).filter(
    ([key]) => key.toLowerCase() !== "geometry"
  );

  // ສ່ວນຂອງ UI ທີ່ component ຈະ render ອອກມາ
  return (
    // ຜູກ ref ກັບ div ຫຼັກຂອງ panel
    <div ref={panelRef} className="attribute-panel">
      {/* ຫົວຂໍ້ຂອງ panel */}
      <div className="attribute-panel-header">
        <div className="attribute-panel-title">
          <Info size={16} />
          <span>Feature Attributes</span>
        </div>
        <button onClick={onClose} className="attribute-panel-close-btn">
          <X size={18} />
        </button>
      </div>
      {/* ເນື້ອໃນຂອງ panel */}
      <div className="attribute-panel-content">
        {/* ກວດສອບວ່າມີ attributes ໃຫ້ສະແດງບໍ່ */}
        {attributesToShow.length > 0 ? (
          <div className="attribute-list">
            {/* Loop ຜ່ານ attributesToShow ເພື່ອສະແດງ key ແລະ value */}
            {attributesToShow.map(([key, value]) => (
              <div className="attribute-item" key={key}>
                <div className="attribute-key">{key}</div>
                <div className="attribute-value">{String(value) || "N/A"}</div>
              </div>
            ))}
          </div>
        ) : (
          // ຖ້າບໍ່ມີ, ໃຫ້ສະແດງຂໍ້ຄວາມນີ້
          <p className="no-items-message">
            No attributes found for this feature.
          </p>
        )}
      </div>
    </div>
  );
};

// ສົ່ງອອກ component ເພື່ອໃຫ້ໄຟລ໌ອື່ນສາມາດນຳໄປໃຊ້ໄດ້
export default AttributePanel;
