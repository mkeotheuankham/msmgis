import React from "react";
import RibbonToolbar from "./components/RibbonToolbar";
import MapComponent from "./components/MapComponent";
import StatusBar from "./components/StatusBar";
import LayerPanel from "./components/ui/LayerPanel";
import BaseMapPanel from "./components/ui/BaseMapPanel";
import ImportDataModal from "./components/ui/ImportDataModal";
import AttributePanel from "./components/ui/AttributePanel";
import StyleEditorModal from "./components/ui/StyleEditorModal";
import ExportDataModal from "./components/ui/ExportDataModal";
import ImageLayerModal from "./components/ui/ImageLayerModal";
import ImageEditorModal from "./components/ui/ImageEditorModal";
import AnalysisPanel from "./components/ui/AnalysisPanel";
import CoordinateBar from "./components/ui/CoordinateBar";
import "./App.css";

// Note: The proj4 setup has been moved to main.jsx to ensure it runs only once.
// The useAppContext hook is also no longer needed in this file.

function App() {
  // App component is now purely for layout and structure.
  // All state and logic are handled in the AppProvider and consumed by child components.

  return (
    <div className="app-container">
      <RibbonToolbar />
      <div className="main-content">
        {/* Components now get what they need from the context, no more props needed here */}
        <MapComponent />
        <CoordinateBar />
        <LayerPanel />
        <BaseMapPanel />
        <AnalysisPanel />
      </div>
      <ImportDataModal />
      <ExportDataModal />
      <ImageLayerModal />
      <ImageEditorModal />
      <AttributePanel />
      <StyleEditorModal />
      <StatusBar />
    </div>
  );
}

export default App;
