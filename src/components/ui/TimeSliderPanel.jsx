import React, { useState, useEffect } from "react";
import Panel from "./Panel";
import "./Panels.css";

// Helper function to get the number of days in a given month and year
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

// Helper function to convert a date string (YYYY-MM-DD) to a numerical value for the slider
const dateToValue = (date) => {
  // Add a check to handle undefined or invalid date strings
  if (typeof date !== "string" || date.split("-").length !== 3) {
    const today = new Date();
    return today.getMonth() * 31 + today.getDate(); // Return a default value
  }
  const [year, month, day] = date.split("-").map(Number);
  let totalDays = 0;
  for (let m = 1; m < month; m++) {
    totalDays += getDaysInMonth(year, m);
  }
  return totalDays + day;
};

// Helper function to convert a slider value back to a date string
const valueToDate = (value, year) => {
  let day = value;
  let month = 1;
  while (day > getDaysInMonth(year, month)) {
    day -= getDaysInMonth(year, month);
    month++;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
};

const TimeSliderPanel = ({ isVisible, selectedDate, onDateChange }) => {
  // Use a default date if the prop is not provided to prevent crashes
  const currentDate = selectedDate || new Date().toISOString().split("T")[0];

  const [year, setYear] = useState(parseInt(currentDate.split("-")[0]));
  const [maxDays, setMaxDays] = useState(365);

  useEffect(() => {
    // Update max days for leap years
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    setMaxDays(isLeap ? 366 : 365);
  }, [year]);

  const handleSliderChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    const newDate = valueToDate(newValue, year);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    if (!isNaN(newYear)) {
      setYear(newYear);
      // Also update the date with the new year
      const currentValue = dateToValue(currentDate);
      const newDate = valueToDate(currentValue, newYear);
      if (onDateChange) {
        onDateChange(newDate);
      }
    }
  };

  if (!isVisible) {
    return null;
  }

  const sliderValue = dateToValue(currentDate);

  return (
    <div className="time-slider-panel-container">
      <Panel
        title="Time Slider"
        isVisible={isVisible}
        style={{ width: "60%", margin: "0 auto" }}
      >
        <div className="time-slider-controls">
          <label htmlFor="year-input">Year:</label>
          <input
            id="year-input"
            type="number"
            value={year}
            onChange={handleYearChange}
            className="time-slider-year-input"
          />
          <input
            type="range"
            min="1"
            max={maxDays}
            value={sliderValue}
            onChange={handleSliderChange}
            className="time-slider"
          />
          <span className="time-slider-date-display">{currentDate}</span>
        </div>
      </Panel>
    </div>
  );
};

export default TimeSliderPanel;
