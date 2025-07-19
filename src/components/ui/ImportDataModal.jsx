// ນຳເຂົ້າ React hooks ແລະ icons ທີ່ຈຳເປັນ
import React, { useState } from "react";
import "./Modals.css";
import { Upload, FileText, FileJson, FileArchive, X } from "lucide-react";

// ສ້າງ functional component ຊື່ ImportDataModal
// Component ນີ້ຮັບ props: isVisible (ສະແດງ/ເຊື່ອງ modal), onClose (function ເພື່ອປິດ), onFileImport (function ເພື່ອສົ່ງໄຟລ໌กลับไป)
const ImportDataModal = ({ isVisible, onClose, onFileImport }) => {
  // ປະກາດ state 'file' ເພື່ອເກັບຂໍ້ມູນໄຟລ໌ທີ່ຖືກເລືອກ, ຄ່າເລີ່ມຕົ້ນເປັນ null
  const [file, setFile] = useState(null);

  // ຖ້າ isVisible ເປັນ false, ໃຫ້ return null (ບໍ່ render ຫຍັງເລີຍ)
  if (!isVisible) return null;

  // Function ຈັດການເມື່ອມີການເລືອກໄຟລ໌ຜ່ານ input
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]; // ເອົາໄຟລ໌ທຳອິດທີ່ຖືກເລືອກ
    if (selectedFile) {
      setFile(selectedFile); // ອັບເດດ state 'file'
      onFileImport(selectedFile); // ເອີ້ນ function ຈາກ props ເພື່ອສົ່ງໄຟລ໌ກັບໄປໃຫ້ App.jsx
      onClose(); // ປິດ modal ຫຼັງຈາກເລືອກໄຟລ໌ສຳເລັດ
    }
  };

  // Function ຈັດການເມື່ອມີການລາກໄຟລ໌ມາລົງ (drop)
  const handleDrop = (e) => {
    e.preventDefault(); // ປ້ອງກັນບໍ່ໃຫ້ browser ເປີດໄຟລ໌ເອງ
    const droppedFile = e.dataTransfer.files[0]; // ເອົາໄຟລ໌ທຳອິດທີ່ຖືກລົງ
    if (droppedFile) {
      setFile(droppedFile);
      onFileImport(droppedFile);
      onClose();
    }
  };

  // Function ຈັດການເມື່ອມີການລາກໄຟລ໌ມາຢູ່ເທິງພື້ນທີ່ (drag over)
  const handleDragOver = (e) => {
    e.preventDefault(); // ປ້ອງກັນ default behavior ເພື່ອໃຫ້ສາມາດ drop ໄດ້
  };

  // ສ່ວນຂອງ UI ທີ່ component ຈະ render ອອກມາ
  return (
    // Backdrop (ພື້ນຫຼັງສີດຳໂປ່ງໃສ), ເມື່ອຄລິກຈະປິດ modal
    <div className="floating-panel-backdrop" onClick={onClose}>
      {/* ตัว Modal Panel */}
      <div
        className="floating-panel import-data-modal"
        onClick={(e) => e.stopPropagation()} // ປ້ອງກັນບໍ່ໃຫ້ event click ລາມໄປຮອດ backdrop
      >
        {/* ຫົວຂໍ້ຂອງ Modal */}
        <div className="panel-header">
          <h3>
            <Upload size={22} /> ນຳເຂົ້າຂໍ້ມູນ (Import Data)
          </h3>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>
        {/* ພື້ນທີ່ສຳລັບລາກໄຟລ໌ (Dropzone) */}
        <div
          className="dropzone"
          onClick={() => document.getElementById("fileInput").click()} // ເມື່ອຄລິກ, ໃຫ້ໄປ trigger input file ທີ່ເຊື່ອງໄວ້
          onDrop={handleDrop} // event handler ສຳລັບ drop
          onDragOver={handleDragOver} // event handler ສຳລັບ drag over
        >
          <p>ລາກໄຟລ໌ມາທີ່ນີ້ ຫຼື ຄລິກເພື່ອເລືອກ</p>
          <p>(Drag & Drop or Click to Upload)</p>
          {/* input[type="file"] ທີ່ຖືກເຊື່ອງໄວ້ */}
          <input
            type="file"
            id="fileInput"
            style={{ display: "none" }} // ເຊື່ອງ input element ນີ້
            accept=".csv,.kml,.zip,.geojson,.json" // ກຳນົດປະເພດໄຟລ໌ທີ່ຮອງຮັບ
            onChange={handleFileChange} // event handler ເມື່ອເລືອກໄຟລ໌
          />
          {/* ສ່ວນສະແດງຄຳແນະນຳ */}
          <div className="instructions">
            <p>ຮອງຮັບໄຟລ໌ປະເພດ:</p>
            <div>
              <span>
                <FileText size={16} /> CSV
              </span>
              <span>
                <FileArchive size={16} /> SHP (.zip)
              </span>
              <span>
                <FileJson size={16} /> KML/GeoJSON
              </span>
            </div>
          </div>
        </div>
        {/* ຖ້າມີໄຟລ໌ຖືກເລືອກ, ໃຫ້ສະແດງຊື່ໄຟລ໌ */}
        {file && (
          <div style={{ marginTop: "1rem", color: "#ccc" }}>
            Selected: {file.name}
          </div>
        )}
      </div>
    </div>
  );
};

// ສົ່ງອອກ component ເພື່ອໃຫ້ໄຟລ໌ອື່ນສາມາດນຳໄປໃຊ້ໄດ້
export default ImportDataModal;
