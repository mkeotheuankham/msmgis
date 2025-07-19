// ນຳເຂົ້າ React hooks ທີ່ຈຳເປັນ: useState ສຳລັບຈັດການ state ແລະ useEffect ສຳລັບ lifecycle events
import React, { useState, useEffect } from "react";
// ນຳເຂົ້າ CSS file ສຳລັບ modal
import "./Modals.css";
// ນຳເຂົ້າ icons ຈາກ lucide-react
import { Palette, X } from "lucide-react";

// ສ້າງ functional component ຊື່ StyleEditorModal
// Component ນີ້ຮັບ props: layer (object ຂອງ layer ທີ່ກຳລັງແກ້ໄຂ), isVisible, onClose, onSave
const StyleEditorModal = ({ layer, isVisible, onClose, onSave }) => {
  // ປະກາດ state ສຳລັບເກັບຄ່າ style ຕ່າງໆ ໂດຍໃຊ້ useState hook
  // ພ້ອມກຳນົດຄ່າເລີ່ມຕົ້ນ (default values)
  const [fillColor, setFillColor] = useState("#ff00ff"); // ສີພື້ນ
  const [strokeColor, setStrokeColor] = useState("#ff00ff"); // ສີເສັ້ນຂອບ
  const [strokeWidth, setStrokeWidth] = useState(3); // ຄວາມໜາເສັ້ນຂອບ
  const [pointColor, setPointColor] = useState("#ff00ff"); // ສີຂອງຈຸດ
  const [pointSize, setPointSize] = useState(7); // ຂະໜາດຂອງຈຸດ

  // useEffect hook: ຈະເຮັດວຽກທຸກຄັ້ງທີ່ຄ່າໃນ dependency array ([isVisible, layer]) ປ່ຽນແປງ
  // ໃຊ້ເພື່ອອັບເດດ state ຂອງ modal ໃຫ້ກົງກັບ style ປັດຈຸບັນຂອງ layer ທີ່ສົ່ງເຂົ້າມາ
  useEffect(() => {
    // ກວດສອບວ່າ: modal ກຳລັງສະແດງຜົນ (isVisible), ມີ layer object, ແລະ layer ນັ້ນມີ style อยู่แล้ว
    if (isVisible && layer && layer.style) {
      // ຕັ້ງຄ່າ state ຂອງ style ຕ່າງໆ ຈາກ layer.style ທີ່ມີຢູ່
      // ໃຊ້ || ເພື່ອກຳນົດຄ່າ default ຖ້າ property ນັ້ນບໍ່ມີໃນ object
      setFillColor(layer.style.fillColor || "#ff00ff");
      setStrokeColor(layer.style.strokeColor || "#ff00ff");
      setStrokeWidth(layer.style.strokeWidth || 3);
      setPointColor(layer.style.pointColor || "#ff00ff");
      setPointSize(layer.style.pointSize || 7);
    } else if (isVisible && layer && !layer.style) {
      // ກໍລະນີທີ່ modal ສະແດງຜົນ ແລະ ມີ layer, ແຕ່ layer ນັ້ນຍັງບໍ່ມີ style
      // ໃຫ້ຕັ້ງຄ່າ state ເປັນຄ່າ default
      setFillColor("#ff00ff");
      setStrokeColor("#ff00ff");
      setStrokeWidth(3);
      setPointColor("#ff00ff");
      setPointSize(7);
    }
  }, [isVisible, layer]); // Dependency array

  // ຖ້າ modal ບໍ່ໄດ້ຖືກສັ່ງໃຫ້ສະແດງ (isVisible=false) ຫຼື ບໍ່ມີ layer object, ໃຫ້ return null (ບໍ່ render ຫຍັງ)
  if (!isVisible || !layer) return null;

  // Function ຈັດການການກົດປຸ່ມ Save
  const handleSave = () => {
    // ເອີ້ນ function onSave ທີ່ສົ່ງມາຈາກ props, ພ້ອມສົ່ງ layer.id ແລະ object ຂອງ style ໃໝ່ກັບໄປ
    onSave(layer.id, {
      fillColor,
      strokeColor,
      strokeWidth,
      pointColor,
      pointSize,
    });
    onClose(); // ເອີ້ນ function onClose ເພື່ອປິດ modal
  };

  // ສ່ວນຂອງ UI ທີ່ component ຈະ render ອອກມາ
  return (
    // Backdrop (ພື້ນຫຼັງສີດຳໂປ່ງໃສ)
    <div className="floating-panel-backdrop" onClick={onClose}>
      {/* ตัว Modal Panel */}
      <div
        className="floating-panel style-editor-panel"
        onClick={(e) => e.stopPropagation()} // ປ້ອງກັນບໍ່ໃຫ້ event click ລາມໄປຮອດ backdrop (ເຊິ່ງຈະເຮັດໃຫ້ modal ປິດ)
      >
        {/* ຫົວຂໍ້ຂອງ Modal */}
        <div className="panel-header">
          <h3>
            <Palette size={18} /> Edit Layer Style
          </h3>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>
        {/* ເນື້ອໃນຂອງ Modal */}
        <div className="panel-content">
          {/* ກຸ່ມຄວບຄຸມ Style ສຳລັບ Polygon ແລະ Line */}
          <div className="style-group">
            <h4>Polygon & Line</h4>
            <div className="style-control">
              <label>Fill Color</label>
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
              />
            </div>
            <div className="style-control">
              <label>Stroke Color</label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
              />
            </div>
            <div className="style-control">
              <label>Stroke Width ({strokeWidth}px)</label>
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
              />
            </div>
          </div>
          {/* ກຸ່ມຄວບຄຸມ Style ສຳລັບ Point */}
          <div className="style-group">
            <h4>Point</h4>
            <div className="style-control">
              <label>Point Color</label>
              <input
                type="color"
                value={pointColor}
                onChange={(e) => setPointColor(e.target.value)}
              />
            </div>
            <div className="style-control">
              <label>Point Size ({pointSize}px)</label>
              <input
                type="range"
                min="2"
                max="15"
                value={pointSize}
                onChange={(e) => setPointSize(Number(e.target.value))}
              />
            </div>
          </div>
          {/* ປຸ່ມບັນທຶກ */}
          <button className="save-style-button" onClick={handleSave}>
            Save Style
          </button>
        </div>
      </div>
    </div>
  );
};

// ສົ່ງອອກ component ເພື່ອໃຫ້ໄຟລ໌ອື່ນສາມາດນຳໄປໃຊ້ໄດ້
export default StyleEditorModal;
