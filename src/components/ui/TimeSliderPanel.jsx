import React, { useState, useEffect, useRef } from "react";
import "./Panels.css";
import { Clock, Play, Pause } from "lucide-react";

const styles = {
  panel: (isVisible) => ({
    position: "absolute",
    bottom: "50px", // Position above the status bar
    left: "50%",
    transform: "translateX(-50%)",
    width: "500px",
    maxWidth: "90%",
    backgroundColor: "rgba(37, 37, 38, 0.9)",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(60, 60, 60, 0.8)",
    borderRadius: "8px",
    padding: "12px 16px",
    zIndex: 1010,
    display: isVisible ? "flex" : "none",
    flexDirection: "column",
    gap: "10px",
    boxShadow: "0 -4px 15px rgba(0, 0, 0, 0.3)",
  }),
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#e0e0e0",
    fontSize: "14px",
    fontWeight: "600",
  },
  sliderContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  slider: {
    flexGrow: 1,
  },
  dateDisplay: {
    color: "#9aff9a",
    fontFamily: "monospace",
    fontSize: "14px",
    minWidth: "120px",
    textAlign: "center",
    background: "rgba(0,0,0,0.3)",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  playButton: {
    background: "transparent",
    border: "none",
    color: "#e0e0e0",
    cursor: "pointer",
  },
};

const TimeSliderPanel = ({ isVisible, selectedDate, onDateChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);

  // Convert date string 'YYYY-MM-DD' to a number for the slider
  const dateToValue = (dateStr) => {
    const [year, month] = dateStr.split("-").map(Number);
    return (year - 2015) * 12 + (month - 1);
  };

  // Convert slider value back to a date string
  const valueToDate = (value) => {
    const totalMonths = parseInt(value, 10);
    const year = 2015 + Math.floor(totalMonths / 12);
    const month = (totalMonths % 12) + 1;
    return `${year}-${String(month).padStart(2, "0")}-01`;
  };

  const handleSliderChange = (e) => {
    const newDate = valueToDate(e.target.value);
    onDateChange(newDate);
  };

  // Calculate the maximum number of months from Jan 2015 to the current month/year
  const maxMonths =
    (new Date().getFullYear() - 2015) * 12 + new Date().getMonth();

  // Effect for the play/pause functionality
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const currentValue = dateToValue(selectedDate);
        // If it reaches the end, loop back to the beginning
        const nextValue = currentValue >= maxMonths ? 0 : currentValue + 1;
        onDateChange(valueToDate(nextValue));
      }, 1500); // Change date every 1.5 seconds
    } else {
      clearInterval(intervalRef.current);
    }
    // Cleanup function to clear the interval when the component unmounts or isPlaying changes
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, selectedDate, onDateChange, maxMonths]);

  return (
    <div style={styles.panel(isVisible)}>
      <div style={styles.header}>
        <Clock size={16} />
        <span>Historical Imagery (Sentinel-2)</span>
      </div>
      <div style={styles.sliderContainer}>
        <button
          style={styles.playButton}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <input
          type="range"
          min="0"
          max={maxMonths}
          value={dateToValue(selectedDate)}
          onChange={handleSliderChange}
          style={styles.slider}
        />
        <div style={styles.dateDisplay}>
          {new Date(selectedDate).toLocaleDateString("en-CA", {
            year: "numeric",
            month: "short",
          })}
        </div>
      </div>
    </div>
  );
};

export default TimeSliderPanel;
