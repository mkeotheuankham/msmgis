// ນຳເຂົ້າ React hooks ທີ່ຈຳເປັນ: useState, useEffect, useRef
import React, { useState, useEffect, useRef } from "react";
// ນຳເຂົ້າ CSS file (ໃນກໍລະນີນີ້ບໍ່ໄດ້ໃຊ້ ແຕ່ເປັນ good practice)
import "./Panels.css";
// ນຳເຂົ້າ icons ຈາກ lucide-react
import { Clock, Play, Pause } from "lucide-react";

// Object ເກັບ style ແບບ inline, ໃຊ້ JavaScript object ແທນ CSS file
// ວິທີນີ້ຊ່ວຍໃຫ້ style ຜູກຕິດກັບ component ໂດຍກົງ
const styles = {
  // Function ທີ່ return style object ສຳລັບ panel ຫຼັກ
  // ຮັບ isVisible ເປັນ parameter ເພື່ອປ່ຽນ display property
  panel: (isVisible) => ({
    position: "absolute", // ຕັ້ງຕຳແໜ່ງແບບลอยตัว
    bottom: "50px", // ຢູ່ເໜືອ status bar
    left: "50%", // ຈັດກึ่งກາງແນວນອນ
    transform: "translateX(-50%)", // ປັບตำแหน่งให้อยู่กึ่งกลางແທ້ໆ
    width: "500px",
    maxWidth: "90%", // ສຳລັບຈໍນ້ອຍ
    backgroundColor: "rgba(37, 37, 38, 0.9)",
    backdropFilter: "blur(5px)", // ເຮັດໃຫ້ພື້ນຫຼັງເບລอ
    border: "1px solid rgba(60, 60, 60, 0.8)",
    borderRadius: "8px",
    padding: "12px 16px",
    zIndex: 1010,
    display: isVisible ? "flex" : "none", // ສະແດງ/ເຊື່ອງ panel
    flexDirection: "column",
    gap: "10px",
    boxShadow: "0 -4px 15px rgba(0, 0, 0, 0.3)",
  }),
  // Style ສຳລັບຫົວຂໍ້ panel
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#e0e0e0",
    fontSize: "14px",
    fontWeight: "600",
  },
  // Style ສຳລັບ container ຂອງແຖບເລື່ອນ
  sliderContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  // Style ສຳລັບແຖບເລື່ອນເອງ
  slider: {
    flexGrow: 1, // ໃຫ້ແຖບເລື່ອນຂະຫຍາຍເຕັມພື້ນທີ່ທີ່ເຫຼືອ
  },
  // Style ສຳລັບສ່ວນສະແດງວັນທີ
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
  // Style ສຳລັບປຸ່ມ Play/Pause
  playButton: {
    background: "transparent",
    border: "none",
    color: "#e0e0e0",
    cursor: "pointer",
  },
};

// ສ້າງ functional component ຊື່ TimeSliderPanel
const TimeSliderPanel = ({ isVisible, selectedDate, onDateChange }) => {
  // State ສຳລັບຄວບຄຸມການຫຼິ້ນອັດຕະໂນມັດ (play/pause)
  const [isPlaying, setIsPlaying] = useState(false);
  // useRef ສຳລັບເກັບ ID ຂອງ setInterval ເພື່ອຈະສາມາດຍົກເລີກມັນໄດ້
  const intervalRef = useRef(null);

  // Function ແປງຄ່າວັນທີ (string 'YYYY-MM-DD') ເປັນຕົວເລກສຳລັບແຖບເລື່ອນ
  // ຄິດໄລ່ຈຳນວນເດືອນທັງໝົດນັບແຕ່ปี 2015
  const dateToValue = (dateStr) => {
    const [year, month] = dateStr.split("-").map(Number);
    return (year - 2015) * 12 + (month - 1);
  };

  // Function ແປງຄ່າຈາກແຖບເລື່ອນ (ຕົວເລກ) ກັບເປັນ string ວັນທີ
  const valueToDate = (value) => {
    const totalMonths = parseInt(value, 10);
    const year = 2015 + Math.floor(totalMonths / 12);
    const month = (totalMonths % 12) + 1;
    // ໃຊ້ padStart ເພື່ອໃຫ້ເດືອນມີ 2 ຫຼັກສະເໝີ (ເຊັ່ນ: 01, 02, ..., 12)
    return `${year}-${String(month).padStart(2, "0")}-01`;
  };

  // Function ຈັດການເມື່ອມີການເລື່ອນແຖບ slider
  const handleSliderChange = (e) => {
    const newDate = valueToDate(e.target.value);
    onDateChange(newDate); // ເອີ້ນ function ຈາກ props ເພື່ອອັບເດດວັນທີໃນ App.jsx
  };

  // ຄຳນວນຄ່າສູງສຸດຂອງແຖບເລື່ອນ (ຈຳນວນເດືອນທັງໝົດຈາກ ມັງກອນ 2015 ຫາເດືອນປັດຈຸບັນ)
  const maxMonths =
    (new Date().getFullYear() - 2015) * 12 + new Date().getMonth();

  // useEffect hook ສຳລັບຈັດການການຫຼິ້ນ/ຢຸດ ອັດຕະໂນມັດ
  useEffect(() => {
    // ຖ້າ isPlaying ເປັນ true
    if (isPlaying) {
      // ຕັ້ງ interval ໃຫ້ເຮັດວຽກທຸກໆ 1.5 ວິນາທີ
      intervalRef.current = setInterval(() => {
        const currentValue = dateToValue(selectedDate);
        // ຖ້າຮອດຄ່າສູງສຸດແລ້ວ, ໃຫ້ວົນກັບไปที่ค่าเริ่มต้น (0), ຖ້າບໍ່, ໃຫ້ເພີ່ມຂຶ້ນ 1
        const nextValue = currentValue >= maxMonths ? 0 : currentValue + 1;
        onDateChange(valueToDate(nextValue)); // ອັບເດດວັນທີ
      }, 1500); // ປ່ຽນວັນທີທຸກໆ 1.5 ວິນາທີ
    } else {
      // ຖ້າ isPlaying ເປັນ false, ໃຫ້ຍົກເລີກ interval
      clearInterval(intervalRef.current);
    }
    // Cleanup function: ຈະຖືກເອີ້ນເມື່ອ component unmount ຫຼື isPlaying ປ່ຽນ
    // ເພື່ອຮັບປະກັນວ່າບໍ່ມີ interval ເກົ່າຄ້າງຢູ່
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, selectedDate, onDateChange, maxMonths]); // dependencies: effect ຈະເຮັດວຽກໃໝ່ເມື່ອຄ່າໃດຄ່າໜຶ່ງໃນນີ້ປ່ຽນ

  // ສ່ວນຂອງ UI ທີ່ component ຈະ render ອອກມາ
  return (
    <div style={styles.panel(isVisible)}>
      <div style={styles.header}>
        <Clock size={16} />
        <span>Historical Imagery (Sentinel-2)</span>
      </div>
      <div style={styles.sliderContainer}>
        {/* ປຸ່ມ Play/Pause */}
        <button
          style={styles.playButton}
          onClick={() => setIsPlaying(!isPlaying)} // ຄລິກເພື່ອປ່ຽນສະຖານະ isPlaying
        >
          {/* ສະແດງ icon Pause ຖ້າ isPlaying ເປັນ true, ສະແດງ Play ຖ້າເປັນ false */}
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        {/* ແຖບເລື່ອນ */}
        <input
          type="range"
          min="0"
          max={maxMonths}
          value={dateToValue(selectedDate)} // ຄ່າປັດຈຸບັນຂອງ slider
          onChange={handleSliderChange} // event handler ເມື່ອເລື່ອນ
          style={styles.slider}
        />
        {/* ສ່ວນສະແດງວັນທີທີ່ເລືອກ */}
        <div style={styles.dateDisplay}>
          {/* Format ວັນທີໃຫ້ເປັນຮູບແບບ "เดือนย่อ ปี" (ເຊັ່ນ: Jan 2024) */}
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
