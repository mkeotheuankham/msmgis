// ນຳເຂົ້າ React hooks (useState, useEffect) ແລະ icons ທີ່ຈຳເປັນ
import React, { useState, useEffect } from "react";
import { Download, X, FileJson, FileArchive, FileText } from "lucide-react";

// ສ້າງ functional component ຊື່ ExportDataModal
// Component ນີ້ຮັບ props ຕ່າງໆຈາກ App.jsx
const ExportDataModal = ({
  isVisible, // ສະຖານະການສະແດງ/ເຊື່ອງ modal
  onClose, // Function ເພື່ອປິດ modal
  onExport, // Function ທີ່ເອີ້ນເມື່ອກົດປຸ່ມ export
  mapInstance, // instance ຂອງແຜນທີ່ OpenLayers
  importedLayers, // Array ຂອງເລເຢີທີ່ນຳເຂົ້າມາ
}) => {
  // ປະກາດ state ຕ່າງໆທີ່ໃຊ້ພາຍໃນ component ນີ້
  const [selectedLayerId, setSelectedLayerId] = useState("editorLayer"); // ເກັບ ID ຂອງເລເຢີທີ່ຖືກເລືອກເພື່ອ export
  const [exportFormat, setExportFormat] = useState("geojson"); // ເກັບ format ຂອງໄຟລ໌ທີ່ຈະ export
  const [exportableLayers, setExportableLayers] = useState([]); // ເກັບ array ຂອງເລເຢີທັງໝົດທີ່ສາມາດ export ໄດ້

  // useEffect hook: ຈະເຮັດວຽກທຸກຄັ້ງທີ່ isVisible, mapInstance, ຫຼື importedLayers ປ່ຽນແປງ
  // ໃຊ້ເພື່ອສ້າງລາຍການເລເຢີທີ່ສາມາດ export ໄດ້ ເມື່ອ modal ເປີດຂຶ້ນມາ
  useEffect(() => {
    if (isVisible) {
      // ຊອກຫາ editorLayer (ເລເຢີທີ່ໃຊ້ແຕ້ມ)
      const editorLayer = mapInstance
        .getLayers()
        .getArray()
        .find((l) => l.get("name") === "editorLayer");
      // ເອົາ features ທັງໝົດຈາກ editorLayer
      const editorFeatures = editorLayer
        ? editorLayer.getSource().getFeatures()
        : [];

      let layers = [];
      // ຖ້າ editorLayer ມີ features, ໃຫ້ເພີ່ມມັນເຂົ້າໄປໃນລາຍການທີ່ຈະ export
      if (editorFeatures.length > 0) {
        layers.push({
          id: "editorLayer",
          name: "Drawn Features (Editor Layer)",
        });
      }

      // ແປງ array ຂອງ importedLayers ໃຫ້ເປັນ format ທີ່ງ່າຍຕໍ່ການສະແດງຜົນ
      const imported = importedLayers.map((l) => ({ id: l.id, name: l.name }));
      // ລວມ editorLayer ແລະ imported layers ເຂົ້າກັນ
      setExportableLayers([...layers, ...imported]);

      // ຕັ້ງຄ່າເລເຢີທີ່ຖືກເລືອກເປັນຄ່າເລີ່ມຕົ້ນ
      if (layers.length > 0) {
        setSelectedLayerId("editorLayer"); // ຖ້າມີข้อมูลใน editor layer, ให้เลือกเป็นค่าเริ่มต้น
      } else if (imported.length > 0) {
        setSelectedLayerId(imported[0].id); // ຖ້າບໍ່, ໃຫ້ເລືອກ imported layer ທຳອິດ
      }
    }
  }, [isVisible, mapInstance, importedLayers]); // Dependency array

  // ຖ້າ isVisible ເປັນ false, ບໍ່ຕ້ອງ render ຫຍັງ
  if (!isVisible) return null;

  // Function ທີ່ເອີ້ນເມື່ອກົດປຸ່ມ "Export"
  const handleExportClick = () => {
    if (!selectedLayerId) {
      alert("Please select a layer to export.");
      return;
    }
    // ເອີ້ນ function onExport ທີ່ສົ່ງມາຈາກ props, ພ້ອມສົ່ງ ID ແລະ format ທີ່ເລືອກ
    onExport(selectedLayerId, exportFormat);
    onClose(); // ປິດ modal
  };

  // ສ່ວນຂອງ UI ທີ່ component ຈະ render ອອກມາ
  return (
    <div className="floating-panel-backdrop" onClick={onClose}>
      <div
        className="floating-panel export-data-modal"
        onClick={(e) => e.stopPropagation()} // ປ້ອງກັນບໍ່ໃຫ້ event click ລາມໄປຮອດ backdrop
      >
        <div className="panel-header">
          <h3>
            <Download size={18} /> Export Data
          </h3>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>
        <div className="panel-content">
          {/* ສ່ວນທີ 1: ເລືອກເລເຢີ */}
          <div className="export-group">
            <h4>1. Select Layer to Export</h4>
            <select
              value={selectedLayerId}
              onChange={(e) => setSelectedLayerId(e.target.value)}
              className="export-select"
            >
              {exportableLayers.length > 0 ? (
                // Loop ຜ່ານ exportableLayers ເພື່ອສ້າງ <option>
                exportableLayers.map((layer) => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name}
                  </option>
                ))
              ) : (
                // ຖ້າບໍ່ມີເລເຢີ, ໃຫ້ສະແດງຂໍ້ຄວາມນີ້
                <option disabled>No exportable layers found</option>
              )}
            </select>
          </div>
          {/* ສ່ວນທີ 2: ເລືອກ Format */}
          <div className="export-group">
            <h4>2. Select Export Format</h4>
            <div className="format-buttons">
              <button
                className={`format-button ${
                  exportFormat === "geojson" ? "active" : ""
                }`}
                onClick={() => setExportFormat("geojson")}
              >
                <FileJson size={16} /> GeoJSON
              </button>
              <button
                className={`format-button ${
                  exportFormat === "kml" ? "active" : ""
                }`}
                onClick={() => setExportFormat("kml")}
              >
                <FileArchive size={16} /> KML
              </button>
              <button
                className={`format-button ${
                  exportFormat === "csv" ? "active" : ""
                }`}
                onClick={() => setExportFormat("csv")}
              >
                <FileText size={16} /> CSV (Points Only)
              </button>
            </div>
          </div>
          {/* ປຸ່ມ Export ຫຼັກ */}
          <button
            className="export-action-button"
            onClick={handleExportClick}
            disabled={exportableLayers.length === 0} // ປິດປຸ່ມຖ້າບໍ່ມີເລເຢີໃຫ້ export
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDataModal;
