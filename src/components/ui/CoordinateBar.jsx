import React, { useEffect, useState, useRef, useCallback } from "react";
import { toLonLat } from "ol/proj";
import proj4 from "proj4";
import { unByKey } from "ol/Observable";
import { MapPin, Copy, History, X, Compass, Trash2 } from "lucide-react";

// 1. Import the context hook
import { useAppContext } from "../../hooks/useAppContext";

// Helper functions for UTM conversion (no changes needed)
const getUtmZone = (lon) => {
  return Math.floor((lon + 180) / 6) + 1;
};

const getUtmProjString = (zone, isNorth) => {
  const hemi = isNorth ? "" : " +south";
  return `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs${hemi}`;
};

const CoordinateBar = () => {
  // 2. Get mapInstance from the context instead of props
  const { mapInstance } = useAppContext();

  // Internal state of the component remains the same
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [coords, setCoords] = useState({
    easting: null,
    northing: null,
    zone: null,
    hemi: null,
    lat: null,
    lon: null,
  });
  const [copySuccess, setCopySuccess] = useState("");
  const [history, setHistory] = useState([]);
  const historyCounterRef = useRef(1);
  const panelRef = useRef(null);

  const handleClosePanel = () => {
    setIsPanelVisible(false);
  };

  const formatCoords = useCallback((coordObj) => {
    if (!coordObj.lon || !coordObj.lat) return "N/A";
    return `Lon/Lat: ${coordObj.lon}, ${coordObj.lat}`;
  }, []);

  const copyToClipboard = useCallback(async (text) => {
    let message = "ຄັດລອກສຳເລັດ!";
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
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
    setCopySuccess(message);
    setTimeout(() => setCopySuccess(""), 1500);
  }, []);

  const handleAddHistory = useCallback(() => {
    if (coords.lon !== null) {
      const newHistoryItem = {
        ...coords,
        id: Date.now(),
        number: historyCounterRef.current,
      };
      setHistory((prev) => [newHistoryItem, ...prev]);
      historyCounterRef.current += 1;
      setCopySuccess("ພິກັດຖືກບັນທຶກແລ້ວ!");
      setTimeout(() => setCopySuccess(""), 1500);
    }
  }, [coords]);

  const handleClearHistory = () => {
    setHistory([]);
    historyCounterRef.current = 1;
  };

  // 3. Update useEffect to use mapInstance
  useEffect(() => {
    if (!mapInstance) return;
    const handlePointerMove = (evt) => {
      const lonLat = toLonLat(evt.coordinate);
      const lon = lonLat[0];
      const lat = lonLat[1];
      const zone = getUtmZone(lon);
      const isNorth = lat >= 0;
      const utmProjDef = `EPSG:${isNorth ? "326" : "327"}${zone}`;
      if (!proj4.defs[utmProjDef]) {
        proj4.defs(utmProjDef, getUtmProjString(zone, isNorth));
      }
      const [easting, northing] = proj4("EPSG:4326", utmProjDef, lonLat);
      setCoords({
        easting: easting.toFixed(2),
        northing: northing.toFixed(2),
        zone,
        hemi: isNorth ? "N" : "S",
        lat: lat.toFixed(5),
        lon: lon.toFixed(5),
      });
    };
    const pointerMoveKey = mapInstance.on("pointermove", handlePointerMove);
    return () => unByKey(pointerMoveKey);
  }, [mapInstance]); // Dependency is now mapInstance

  // 4. Update the second useEffect to use mapInstance
  useEffect(() => {
    if (!mapInstance) return;
    const handleMapClick = (evt) => {
      if (!isPanelVisible) return;
      if (
        panelRef.current &&
        panelRef.current.contains(evt.originalEvent.target)
      )
        return;
      handleAddHistory();
    };
    const clickKey = mapInstance.on("click", handleMapClick);
    return () => unByKey(clickKey);
  }, [mapInstance, isPanelVisible, handleAddHistory]);

  const handleRemoveHistoryItem = (id) =>
    setHistory((prev) => prev.filter((item) => item.id !== id));

  const handleCopyHistoryItem = (item) => copyToClipboard(formatCoords(item));

  const handleCopyUtmHistoryItem = (item) =>
    copyToClipboard(
      `UTM Zone ${item.zone}${item.hemi}: ${item.easting}E, ${item.northing}N`
    );

  return (
    <div className="coordinate-widget-container">
      {copySuccess && <div className="copy-success-message">{copySuccess}</div>}
      {isPanelVisible && (
        <div ref={panelRef} className="coordinate-bar">
          <div className="coordinate-bar-header">
            <h3>Coordinate Tools</h3>
            <button
              onClick={handleClosePanel}
              className="close-panel-button"
              title="ປິດ"
            >
              <X size={20} />
            </button>
          </div>

          <div className="coordinate-details">
            <div className="current-coords-section">
              <h4>ພິກັດປັດຈຸບັນ</h4>
              <div className="coord-row">
                <span>
                  {coords.lon ? formatCoords(coords) : "ເລື່ອນເມົ້າເທິງແຜນທີ່"}
                </span>
                <button
                  onClick={() => copyToClipboard(formatCoords(coords))}
                  title="ຄັດລອກ Lon/Lat"
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="coord-row">
                <span>
                  {coords.easting
                    ? `UTM: ${coords.easting}E, ${coords.northing}N`
                    : "..."}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `UTM Zone ${coords.zone}${coords.hemi}: ${coords.easting}E, ${coords.northing}N`
                    )
                  }
                  title="ຄັດລອກ UTM"
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="coord-row-small">
                <span>
                  {coords.zone ? `Zone ${coords.zone}${coords.hemi}` : ""}
                </span>
              </div>
            </div>
            <div className="history-section">
              <div className="history-section-header">
                <h4>ປະຫວັດການຄລິກ</h4>
                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="clear-history-button"
                    title="ລ້າງປະຫວັດທັງໝົດ"
                  >
                    <Trash2 size={14} />
                    <span>ລ້າງທັງໝົດ</span>
                  </button>
                )}
              </div>
              <div className="history-list">
                {history.length > 0 ? (
                  history.map((item) => (
                    <div key={item.id} className="history-item">
                      <span className="history-item-number">
                        {item.number}.
                      </span>
                      <div className="history-item-coords">
                        <span>{formatCoords(item)}</span>
                        <span className="history-item-utm">
                          UTM: {item.easting}E, {item.northing}N
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
                  <div className="empty">ຄລິກເທິງແຜນທີ່ເພື່ອບັນທຶກພິກັດ</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => setIsPanelVisible((prev) => !prev)}
        className="coordinate-fab"
        title={isPanelVisible ? "ປິດແຖບພິກັດ" : "ເປີດແຖບພິກັດ"}
      >
        {isPanelVisible ? <X size={20} /> : <Compass size={20} />}
      </button>
      <style>{`
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
          /* === ການປ່ຽນແປງ === ປ່ຽນຄ່າ bottom ຈາກ 30px ເປັນ 1rem */
          bottom: 1rem; 
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
          /* === ການປ່ຽນແປງ === ປ່ຽນຄ່າ bottom ຈາກ 30px ເປັນ 1rem ເພື່ອໃຫ້ສອດຄ່ອງກັນ */
          bottom: calc(
            1rem + var(--fab-size) + var(--gap-fab-panel) + 0.5rem
          );
          left: 1rem;
          transform: translateX(
            0
          );
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
