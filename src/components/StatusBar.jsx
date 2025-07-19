import React from "react";
import { Grid, Globe } from "lucide-react"; // Import icons

const StatusBar = ({
  graticuleEnabled,
  graticuleType,
  showGraticuleOptions,
  setShowGraticuleOptions,
  handleGraticuleToggle,
  handleGraticuleTypeChange,
}) => {
  return (
    <>
      <style>{`
        /* Status Bar */
        .status-bar {
          /* Set a dark, semi-transparent background */
          /* ຕັ້ງຄ່າສີພື້ນຫຼັງສີເຂັ້ມ, ເຄິ່ງໂປ່ງໃສ */
          background: var(--color-dark-surface);
          /* Add a subtle dark top border */
          /* ເພີ່ມ Top Border ສີເຂັ້ມແບບຈືດໆ */
          border-top: 1px solid var(--color-dark-border);
          /* Add internal padding */
          /* ເພີ່ມ Internal Padding */
          padding: var(--spacing-xs) var(--spacing-md);
          /* Set font size */
          /* ຕັ້ງຄ່າ Font Size */
          font-size: var(--font-size-md);
          /* *** FIX: Set a light text color for all items in the status bar *** */
          /* *** ແກ້ໄຂ: ຕັ້ງຄ່າສີຂໍ້ຄວາມໃຫ້ເປັນສີອ່ອນສຳລັບທຸກລາຍການໃນແຖບສະຖານະ *** */
          color: var(--color-text-light);
          /* Use flexbox to arrange status items horizontally */
          /* ໃຊ້ Flexbox ເພື່ອຈັດຮຽງ Status Items ຕາມແນວນອນ */
          display: flex;
          /* Add a gap between status items */
          /* ເພີ່ມຊ່ອງຫວ່າງລະຫວ່າງ Status Items */
          gap: var(--spacing-xl);
          box-shadow: 0 -2px var(--spacing-sm) var(--color-shadow); /* Subtle shadow at the top */
        }

        .status-item {
          /* Use flexbox for layout of individual status items */
          /* ໃຊ້ Flexbox ສໍາລັບ Layout ຂອງແຕ່ລະ Status Items */
          display: flex;
          /* Center align items vertically */
          /* ຈັດຕຳແໜ່ງ Items ຕາມແນວຕັ້ງ */
          align-items: center;
          /* Add a small gap between elements within the item */
          /* ເພີ່ມຊ່ອງຫວ່າງນ້ອຍໆລະຫວ່າງ Elements ພາຍໃນ Item */
          gap: var(--spacing-xs);
        }

        /* *** ADDED RULE: Ensure all text inside status items is light-colored *** */
        /* *** ເພີ່ມກົດ: ຮັບປະກັນວ່າຂໍ້ຄວາມທັງໝົດພາຍໃນລາຍການສະຖານະເປັນສີອ່ອນ *** */
        .status-item span {
          color: inherit; /* Inherit the light color from .status-bar */
        }

        /* Coordinate Display */
        .coordinates {
          /* Set a dark, semi-transparent background */
          /* ຕັ້ງຄ່າພື້ນຫຼັງສີເຂັ້ມ, ເຄິ່ງໂປ່ງໃສ */
          background: rgba(40, 40, 40, 0.7);
          /* Add internal padding */
          /* ເພີ່ມ Internal Padding */
          padding: var(--spacing-xxs) 6px;
          /* Add a subtle dark border */
          /* ເພີ່ມ Border ສີເຂັ້ມແບບຈືດໆ */
          border: 1px solid var(--color-dark-border-light);
          /* Apply border-radius for slightly rounded corners */
          /* ໃຊ້ Border-Radius ສໍາລັບມູມມົນເລັກນ້ອຍ */
          border-radius: var(--border-radius-sm);
          /* Use a monospace font for coordinates */
          /* ໃຊ້ Monospace Font ສໍາລັບ Coordinates */
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier,
            monospace;
          /* Set a smaller font size */
          /* ຕັ້ງຄ່າ Font Size ໃຫ້ໜ້ອຍລົງ */
          font-size: var(--font-size-sm);
          /* Set text color to a light, distinct color */
          /* ຕັ້ງຄ່າສີຂໍ້ຄວາມເປັນສີທີ່ສະຫວ່າງ, ແຕກຕ່າງ */
          color: var(--color-text-coordinates); /* A light green for coordinates */
        }

        /* New styles for GraticuleLayer button */
        .graticule-button-container {
          position: relative;
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .graticule-toggle-button {
          background: rgba(50, 50, 50, 0.6);
          border: 1px solid rgba(80, 80, 80, 0.7);
          border-radius: var(--border-radius-sm);
          color: var(--color-text-muted);
          font-size: var(--font-size-xs);
          padding: 4px 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all var(--transition-speed) var(--transition-ease);
        }

        .graticule-toggle-button:hover {
          background: rgba(70, 70, 70, 0.8);
          border-color: var(--color-accent-blue);
          color: var(--color-text-active);
        }

        .graticule-toggle-button.active {
          background: linear-gradient(
            to bottom,
            var(--color-active-button-gradient-start),
            var(--color-active-button-gradient-end)
          );
          border-color: var(--color-accent-blue-dark);
          color: var(--color-text-active);
          box-shadow: inset 0 1px var(--border-radius-sm) rgba(0, 0, 0, 0.3);
        }

        .graticule-options {
          position: absolute;
          bottom: calc(100% + var(--spacing-xs)); /* Position above the button */
          left: 0;
          background: var(--color-dark-surface);
          border: 1px solid var(--color-dark-border);
          border-radius: var(--border-radius-md);
          box-shadow: 0 4px 10px var(--color-shadow);
          display: flex;
          flex-direction: column;
          padding: var(--spacing-xs);
          min-width: 120px;
          animation: fadeIn 0.2s ease-out forwards;
          z-index: 1000; /* Ensure options are on top */
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .graticule-option {
          background: none;
          border: none;
          color: var(--color-text-light);
          padding: 6px 10px;
          text-align: left;
          cursor: pointer;
          font-size: var(--font-size-md);
          transition: background-color 0.2s ease, color 0.2s ease;
          border-radius: var(--border-radius-sm);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .graticule-option:hover {
          background-color: rgba(0, 153, 255, 0.2); /* Light blue background on hover */
          color: var(--color-text-active);
        }

        .graticule-option.active {
          background-color: var(--color-accent-blue);
          color: white;
        }
      `}</style>
      <div className="status-bar">
        <div className="status-item">
          <span>Coordinates:</span>
          <span className="coordinates" id="coordinates">
            0.0000°, 0.0000°
          </span>
        </div>
        <div className="status-item">
          <span>Scale:</span>
          <span id="scale">1:1,000,000</span>
        </div>
        {/* Graticule Layer Button */}
        <div className="status-item graticule-button-container">
          <button
            className={`graticule-toggle-button ${
              graticuleEnabled ? "active" : ""
            }`}
            onClick={() => {
              // Always toggle the options dropdown visibility
              setShowGraticuleOptions((prev) => !prev);
            }}
            title="Toggle Graticule Layer and Options"
          >
            <Grid size={16} />
            Graticule ({graticuleEnabled ? graticuleType : "Off"})
          </button>
          {showGraticuleOptions && (
            <div className="graticule-options">
              <button
                className={`graticule-option ${
                  graticuleType === "WGS84" && graticuleEnabled ? "active" : ""
                }`}
                onClick={() => handleGraticuleTypeChange("WGS84")}
              >
                <Globe size={14} /> WGS84
              </button>
              <button
                className={`graticule-option ${
                  graticuleType === "UTM" && graticuleEnabled ? "active" : ""
                }`}
                onClick={() => handleGraticuleTypeChange("UTM")}
              >
                <Grid size={14} /> UTM
              </button>
              <button
                className={`graticule-option off-button ${
                  !graticuleEnabled ? "active" : ""
                }`}
                onClick={handleGraticuleToggle}
              >
                <span className="mr-1">✖</span> Off
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StatusBar;
