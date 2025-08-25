import { useContext } from "react";
import { AppContext } from "../context/AppContext"; // Import AppContext ຈາກໄຟລ໌ເກົ່າ

// ຍ້າຍ hook ມາໄວ້ທີ່ນີ້
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
