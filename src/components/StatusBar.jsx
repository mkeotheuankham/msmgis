import React from "react";
import { Grid, Globe } from "lucide-react"; // Import icons

// 1. Import the context hook
import { useAppContext } from "../hooks/useAppContext";

const StatusBar = () => {
  // 2. Get all necessary state and functions from the context
  const {
    graticuleEnabled,
    setGraticuleEnabled,
    graticuleType,
    setGraticuleType,
    showGraticuleOptions,
    setShowGraticuleOptions,
  } = useAppContext();

  // 3. Define handlers inside the component
  const handleGraticuleTypeChange = (type) => {
    setGraticuleType(type);
    setGraticuleEnabled(true);
    setShowGraticuleOptions(false);
  };

  const handleGraticuleToggle = () => {
    setGraticuleEnabled((prev) => !prev);
    setShowGraticuleOptions(false);
  };

  return (
    <>
      <style>{`
        /* Status Bar */
        .status-bar {
          background: var(--color-dark-surface);
          border-top: 1px solid var(--color-dark-border);
          padding: var(--spacing-xs) var(--spacing-md);
          font-size: var(--font-size-md);
          color: var(--color-text-light);
          display: flex;
          gap: var(--spacing-xl);
          box-shadow: 0 -2px var(--spacing-sm) var(--color-shadow);
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .status-item span {
          color: inherit;
        }

        .coordinates {
          background: rgba(40, 40, 40, 0.7);
          padding: var(--spacing-xxs) 6px;
          border: 1px solid var(--color-dark-border-light);
          border-radius: var(--border-radius-sm);
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
          font-size: var(--font-size-sm);
          color: var(--color-text-coordinates);
        }

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
          bottom: calc(100% + var(--spacing-xs));
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
          z-index: 1000;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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
          background-color: rgba(0, 153, 255, 0.2);
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
        <div className="status-item graticule-button-container">
          <button
            className={`graticule-toggle-button ${
              graticuleEnabled ? "active" : ""
            }`}
            onClick={() => {
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
