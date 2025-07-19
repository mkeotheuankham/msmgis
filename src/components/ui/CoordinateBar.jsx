import React, { useEffect, useState, useRef, useCallback } from "react"; // import hooks ທີ່ຈຳເປັນຈາກ React
import { toLonLat } from "ol/proj"; // import toLonLat ຈາກ OpenLayers ສຳລັບປ່ຽນ coordinate
import proj4 from "proj4"; // import proj4 ສຳລັບການປ່ຽນລະບົບພິກັດ UTM
import { unByKey } from "ol/Observable"; // import unByKey ຈາກ OpenLayers ສຳລັບການລຶບ event listener
import { MapPin, Copy, History, X, Compass, Trash2 } from "lucide-react"; // import icons ຕ່າງໆຈາກ lucide-react

// Helper functions for UTM conversion
const getUtmZone = (lon) => {
  // ຄິດໄລ່ UTM zone ຈາກຄ່າ longitude
  return Math.floor((lon + 180) / 6) + 1;
};

const getUtmProjString = (zone, isNorth) => {
  // ສ້າງ string định nghĩa projection ສຳລັບ UTM
  const hemi = isNorth ? "" : " +south"; // ກຳນົດ hemisphere (North/South)
  return `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs${hemi}`;
};

const CoordinateBar = ({ map }) => {
  // ຮັບ map object ຈາກ props
  const [isPanelVisible, setIsPanelVisible] = useState(false); // state ສຳລັບຄວບຄຸມການເບິ່ງເຫັນຂອງ panel
  const [coords, setCoords] = useState({
    // state ສຳລັບເກັບຄ່າພິກັດປັດຈຸບັນ
    easting: null,
    northing: null,
    zone: null,
    hemi: null,
    lat: null,
    lon: null,
  });
  const [copySuccess, setCopySuccess] = useState(""); // state ສຳລັບສະແດງຂໍ້ຄວາມສຳເລັດການຄັດລອກ
  const [history, setHistory] = useState([]); // state ສຳລັບເກັບປະຫວັດພິກັດທີ່ຄລິກ
  const historyCounterRef = useRef(1); // useRef ເກັບ counter ສຳລັບລຳດັບໃນປະຫວັດ
  const panelRef = useRef(null); // useRef ເກັບ reference ຂອງ panel UI

  const handleClosePanel = () => {
    // function ສຳລັບປິດ panel
    setIsPanelVisible(false);
  };

  const formatCoords = useCallback((coordObj) => {
    // useCallback ເພື່ອ format ຄ່າ Lon/Lat
    if (!coordObj.lon || !coordObj.lat) return "N/A";
    return `Lon/Lat: ${coordObj.lon}, ${coordObj.lat}`;
  }, []);

  const copyToClipboard = useCallback(
    // useCallback ສຳລັບຄັດລອກ text ໄປທີ່ clipboard
    async (text) => {
      let message = "ຄັດລອກສຳເລັດ!";
      try {
        if (navigator.clipboard && window.isSecureContext) {
          // ໃຊ້ navigator.clipboard API ຖ້າຮອງຮັບ
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback ສຳລັບ browser ເກົ່າ ຫຼື ບໍ່ປອດໄພ
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
      } catch {
        message = "ຄັດລອກບໍ່ສຳເລັດ!";
      }
      setCopySuccess(message); // ສະແດງຂໍ້ຄວາມສຳເລັດ/ລົ້ມເຫຼວ
      setTimeout(() => setCopySuccess(""), 1500); // ລ້າງຂໍ້ຄວາມຫຼັງ 1.5 ວິນາທີ
    },
    []
  );

  const handleAddHistory = useCallback(() => {
    // useCallback ສຳລັບເພີ່ມພິກັດປັດຈຸບັນເຂົ້າໃນປະຫວັດ
    if (coords.lon !== null) {
      const newHistoryItem = {
        ...coords,
        id: Date.now(), // ID ທີ່ເປັນເອກະລັກ
        number: historyCounterRef.current, // ລຳດັບໃນປະຫວັດ
      };
      setHistory((prev) => [newHistoryItem, ...prev]); // ເພີ່ມລາຍການໃໝ່ເຂົ້າໄປໃນຕົ້ນ array
      historyCounterRef.current += 1; // ເພີ່ມ counter
      setCopySuccess("ພິກັດຖືກບັນທຶກແລ້ວ!");
      setTimeout(() => setCopySuccess(""), 1500);
    }
  }, [coords]); // Dependency: coords

  const handleClearHistory = () => {
    // function ສຳລັບລ້າງປະຫວັດທັງໝົດ
    setHistory([]); // ລ້າງ array ປະຫວັດ
    historyCounterRef.current = 1; // reset counter
  };

  useEffect(() => {
    // useEffect ສຳລັບຈັດການ pointermove event ໃນແຜນທີ່
    if (!map) return;
    const handlePointerMove = (evt) => {
      const lonLat = toLonLat(evt.coordinate); // ປ່ຽນ coordinate ຂອງ mouse ເປັນ Lon/Lat
      const lon = lonLat[0];
      const lat = lonLat[1];
      const zone = getUtmZone(lon); // ຄິດໄລ່ UTM zone
      const isNorth = lat >= 0; // ກວດສອບ hemisphere
      const utmProjDef = `EPSG:${isNorth ? "326" : "327"}${zone}`; // ສ້າງ definition string ສຳລັບ projection
      if (!proj4.defs[utmProjDef]) {
        proj4.defs(utmProjDef, getUtmProjString(zone, isNorth)); // ເພີ່ມ definition ຖ້າຍັງບໍ່ມີ
      }
      const [easting, northing] = proj4("EPSG:4326", utmProjDef, lonLat); // ປ່ຽນ Lon/Lat ເປັນ UTM
      setCoords({
        // update state ຂອງ coords
        easting: easting.toFixed(2),
        northing: northing.toFixed(2),
        zone,
        hemi: isNorth ? "N" : "S",
        lat: lat.toFixed(5),
        lon: lon.toFixed(5),
      });
    };
    const pointerMoveKey = map.on("pointermove", handlePointerMove); // ລົງທະບຽນ event listener
    return () => unByKey(pointerMoveKey); // cleanup function: ລຶບ event listener ເມື່ອ component unmount
  }, [map]); // Dependency: map

  useEffect(() => {
    // useEffect ສຳລັບຈັດການ click event ໃນແຜນທີ່
    if (!map) return;
    const handleMapClick = (evt) => {
      if (!isPanelVisible) return; // ຖ້າ panel ບໍ່ເຫັນ, ບໍ່ຕ້ອງເຮັດຫຍັງ
      if (
        panelRef.current &&
        panelRef.current.contains(evt.originalEvent.target)
      )
        return; // ຖ້າຄລິກພາຍໃນ panel, ບໍ່ຕ້ອງເຮັດຫຍັງ
      handleAddHistory(); // ເພີ່ມພິກັດເຂົ້າໃນປະຫວັດ
    };
    const clickKey = map.on("click", handleMapClick); // ລົງທະບຽນ event listener
    return () => unByKey(clickKey); // cleanup function: ລຶບ event listener ເມື່ອ component unmount
  }, [map, isPanelVisible, handleAddHistory]); // Dependencies: map, isPanelVisible, handleAddHistory

  const handleRemoveHistoryItem = (id) =>
    // function ສຳລັບລຶບລາຍການໃນປະຫວັດ
    setHistory((prev) => prev.filter((item) => item.id !== id));
  const handleCopyHistoryItem = (item) =>
    // function ສຳລັບຄັດລອກ Lon/Lat ຈາກລາຍການໃນປະຫວັດ
    copyToClipboard(formatCoords(item));
  const handleCopyUtmHistoryItem = (item) =>
    // function ສຳລັບຄັດລອກ UTM ຈາກລາຍການໃນປະຫວັດ
    copyToClipboard(
      `UTM Zone ${item.zone}${item.hemi}: ${item.easting}E, ${item.northing}N`
    );

  return (
    // ສ່ວນ UI ຂອງ component
    <div className="coordinate-widget-container">
      {copySuccess && <div className="copy-success-message">{copySuccess}</div>}
      {/* ສະແດງຂໍ້ຄວາມສຳເລັດການຄັດລອກ */}
      {/* The panel is now conditionally rendered inside the flex container */}
      {isPanelVisible && (
        <div ref={panelRef} className="coordinate-bar">
          <div className="coordinate-bar-header">
            <h3>Coordinate Tools</h3> {/* ຫົວຂໍ້ */}
            <button
              onClick={handleClosePanel} // ເມື່ອຄລິກ, ປິດ panel
              className="close-panel-button"
              title="ປິດ"
            >
              <X size={20} /> {/* icon X */}
            </button>
          </div>

          <div className="coordinate-details">
            <div className="current-coords-section">
              <h4>ພິກັດປັດຈຸບັນ</h4> {/* ຫົວຂໍ້: ພິກັດປັດຈຸບັນ */}
              <div className="coord-row">
                <span>
                  {coords.lon ? formatCoords(coords) : "ເລື່ອນເມົ້າເທິງແຜນທີ່"}{" "}
                  {/* ສະແດງ Lon/Lat ຫຼື ຂໍ້ຄວາມແນະນຳ */}
                </span>
                <button
                  onClick={() => copyToClipboard(formatCoords(coords))} // ຄັດລອກ Lon/Lat
                  title="ຄັດລອກ Lon/Lat"
                >
                  <Copy size={16} /> {/* icon Copy */}
                </button>
              </div>
              <div className="coord-row">
                <span>
                  {coords.easting
                    ? `UTM: ${coords.easting}E, ${coords.northing}N`
                    : "..."}{" "}
                  {/* ສະແດງ UTM ຫຼື "..." */}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `UTM Zone ${coords.zone}${coords.hemi}: ${coords.easting}E, ${coords.northing}N`
                    )
                  } // ຄັດລອກ UTM
                  title="ຄັດລອກ UTM"
                >
                  <Copy size={16} /> {/* icon Copy */}
                </button>
              </div>
              <div className="coord-row-small">
                <span>
                  {coords.zone ? `Zone ${coords.zone}${coords.hemi}` : ""}{" "}
                  {/* ສະແດງ UTM Zone */}
                </span>
              </div>
            </div>
            <div className="history-section">
              <div className="history-section-header">
                <h4>ປະຫວັດການຄລິກ</h4> {/* ຫົວຂໍ້: ປະຫວັດການຄລິກ */}
                {history.length > 0 && ( // ຖ້າມີປະຫວັດ, ສະແດງປຸ່ມລ້າງປະຫວັດ
                  <button
                    onClick={handleClearHistory} // ລ້າງປະຫວັດທັງໝົດ
                    className="clear-history-button"
                    title="ລ້າງປະຫວັດທັງໝົດ"
                  >
                    <Trash2 size={14} /> {/* icon Trash */}
                    <span>ລ້າງທັງໝົດ</span>
                  </button>
                )}
              </div>
              <div className="history-list">
                {history.length > 0 ? ( // ຖ້າມີປະຫວັດ, loop ສະແດງລາຍການ
                  history.map((item) => (
                    <div key={item.id} className="history-item">
                      <span className="history-item-number">
                        {item.number}.{/* ລຳດັບ */}
                      </span>
                      <div className="history-item-coords">
                        <span>{formatCoords(item)}</span>{" "}
                        {/* ສະແດງ Lon/Lat ຂອງລາຍການປະຫວັດ */}
                        <span className="history-item-utm">
                          UTM: {item.easting}E, {item.northing}N{" "}
                          {/* ສະແດງ UTM ຂອງລາຍການປະຫວັດ */}
                        </span>
                      </div>
                      <div className="history-item-actions">
                        <button
                          onClick={() => handleCopyHistoryItem(item)}
                          title="ຄັດລອກ Lon/Lat"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => handleCopyUtmHistoryItem(item)}
                          title="ຄັດລອກ UTM"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => handleRemoveHistoryItem(item.id)}
                          className="remove-btn"
                          title="ລຶບ"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  // ຖ້າບໍ່ມີປະຫວັດ
                  <div className="empty">ຄລິກເທິງແຜນທີ່ເພື່ອບັນທຶກພິກັດ</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* The FAB is now always rendered, and its click toggles the panel */}
      <button
        onClick={() => setIsPanelVisible((prev) => !prev)} // Toggle visibility
        className="coordinate-fab"
        title={isPanelVisible ? "ປິດແຖບພິກັດ" : "ເປີດແຖບພິກັດ"}
      >
        {isPanelVisible ? <X size={20} /> : <Compass size={20} />}{" "}
        {/* Change icon based on visibility */}
      </button>
      <style jsx>{`
        /* CSS Variables - Defined directly in the component for self-containment */
        :root {
          --header-height: 50px;
          --color-primary-bg: #1e1e1e;
          --color-secondary-bg: rgba(45, 45, 45, 0.95);
          --color-inset-bg: rgba(0, 0, 0, 0.25);
          --color-text-light: #f0f0f0;
          --color-text-muted: #a0a0a0;
          --color-border-light: rgba(255, 255, 255, 0.1);
          --color-shadow-dark: rgba(0, 0, 0, 0.5);
          --color-accent-blue: #007acc;
          --color-accent-blue-hover: #0095f7;

          /* New/Adjusted variables for CoordinateBar compactness */
          --panel-width: 300px; /* Compact width */
          --panel-padding: 0.75rem; /* Reduced padding */
          --font-size-panel-header: 1rem; /* Slightly smaller header */
          --font-size-coords: 0.85rem; /* Smaller coordinate text */
          --font-size-history-item: 0.8rem; /* Smaller history item text */
          --font-size-history-utm: 0.7rem; /* Even smaller UTM history */
          --fab-size: 44px;
          --gap-fab-panel: 0.75rem; /* Gap between FAB and panel */
        }

        .coordinate-widget-container {
          position: absolute;
          bottom: 30px; /* ປັບຄ່າ bottom ໃຫ້ຕິດກັບ StatusBar */
          left: 1rem;
          z-index: 1001;
          display: flex;
          flex-direction: column; /* Stack items vertically */
          align-items: flex-start; /* Align contents to the left */
          gap: var(--gap-fab-panel); /* Gap between panel and FAB */
        }

        .coordinate-fab {
          width: var(--fab-size);
          height: var(--fab-size);
          border-radius: 50%;
          background-color: var(--color-accent-blue);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px var(--color-shadow-dark);
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          flex-shrink: 0;
          order: 2; /* Ensure FAB is always at the bottom */
        }
        .coordinate-fab:hover {
          background-color: var(--color-accent-blue-hover);
          transform: scale(1.05);
        }

        .coordinate-bar {
          order: 1; /* Ensure panel is above FAB when visible */
          background-color: rgba(30, 30, 30, 0.75);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
          padding: var(--panel-padding);
          width: var(--panel-width);
          max-height: calc(
            100vh - 2rem - var(--fab-size) - var(--gap-fab-panel) - 1rem
          ); /* Adjust max-height based on FAB and bottom margin */
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: var(--panel-padding);

          /* Animation for appearance */
          transform-origin: bottom left;
          animation: fadeInScale 0.3s ease-out forwards;
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .coordinate-bar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--color-border-light);
          margin-bottom: 0.5rem;
        }

        .coordinate-bar-header h3 {
          margin: 0;
          font-size: var(--font-size-panel-header);
          color: var(--color-text-light);
        }

        .close-panel-button {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .close-panel-button:hover {
          color: white;
        }

        .coordinate-details {
          display: flex;
          flex-direction: column;
          gap: var(--panel-padding);
        }

        .current-coords-section,
        .history-section {
          background-color: var(--color-inset-bg);
          border-radius: 8px;
          padding: 10px 14px;
          border: 1px solid var(--color-border-light);
          box-shadow: 0 4px 15px var(--color-shadow-dark);
        }

        .current-coords-section h4,
        .history-section h4 {
          margin-top: 0;
          margin-bottom: 0.6rem;
          font-size: 0.95rem;
          color: var(--color-text-light);
        }

        .coord-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.4rem;
          font-size: var(--font-size-coords);
          color: var(--color-text-light);
        }

        .coord-row-small {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          text-align: right;
          margin-top: -0.2rem;
        }

        .coord-row button {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          margin-left: 8px;
          display: flex;
          align-items: center;
          transition: color 0.2s ease;
        }
        .coord-row button:hover {
          color: var(--color-accent-blue);
        }

        .copy-success-message {
          position: absolute;
          /* Positioning is now relative to the viewport/map, not widget-container flex flow */
          bottom: calc(
            30px + var(--fab-size) + var(--gap-fab-panel) + 0.5rem
          ); /* ປັບຄ່າ bottom ໃຫ້ສອດຄ່ອງກັນ */
          left: 1rem; /* Align with widget container left */
          transform: translateX(
            0
          ); /* Remove transform as it's aligned to left */
          background-color: #4caf50;
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          font-size: 0.8rem;
          white-space: nowrap;
          animation: fadeOut 2s forwards;
          z-index: 1002;
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
            visibility: hidden;
          }
        }

        .history-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.6rem;
        }

        .clear-history-button {
          background: none;
          border: none;
          color: #ff6b6b;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          transition: color 0.2s ease;
        }
        .clear-history-button:hover {
          color: #ff3b3b;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .history-item {
          background-color: rgba(0, 0, 0, 0.15);
          border-radius: 6px;
          padding: 6px 10px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-size: var(--font-size-history-item);
          border: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
        }

        .history-item-number {
          position: absolute;
          top: 6px;
          left: 6px;
          font-size: 0.65rem;
          color: var(--color-text-muted);
        }

        .history-item-coords {
          display: flex;
          flex-direction: column;
          margin-left: 18px;
          color: var(--color-text-light);
        }

        .history-item-utm {
          font-size: var(--font-size-history-utm);
          color: var(--color-text-muted);
        }

        .history-item-actions {
          display: flex;
          gap: 6px;
          margin-top: 4px;
          justify-content: flex-end;
        }

        .history-item-actions button {
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 3px 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          margin-left: 0;
        }
        .history-item-actions button:hover {
          background-color: rgba(255, 255, 255, 0.15);
          color: var(--color-text-light);
        }
        .history-item-actions button.remove-btn:hover {
          background-color: #ff6b6b;
          color: white;
        }

        .empty {
          text-align: center;
          font-style: italic;
          color: var(--color-text-muted);
          padding: 15px 0;
        }
      `}</style>
    </div>
  );
};

export default CoordinateBar;
