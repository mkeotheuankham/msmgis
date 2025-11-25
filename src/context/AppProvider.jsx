import React, { useMemo } from "react";
import { AppContext } from "./AppContext";
import { useAppState } from "../hooks/app/useAppState";
import { useLayerManagement } from "../hooks/app/useLayerManagement";
import { useFileImportExport } from "../hooks/app/useFileImportExport";
import { useAnalysisTools } from "../hooks/app/useAnalysisTools";
import { useMapControl } from "../hooks/app/useMapControl";
import { useHistory } from "../hooks/app/useHistory";

export const AppProvider = ({ children }) => {
  // 1. App State
  const {
    activeTool,
    setActiveTool,
    activeTab,
    setActiveTab,
    activePanel,
    setActivePanel,
    isImportModalVisible,
    setIsImportModalVisible,
    isExportModalVisible,
    setIsExportModalVisible,
    isImageModalVisible,
    setIsImageModalVisible,
    isImageEditorModalVisible,
    setIsImageEditorModalVisible,
    isStyleEditorVisible,
    setIsStyleEditorVisible,
    selectedFeatureInfo,
    setSelectedFeatureInfo,
  } = useAppState();

  // 2. Layer Management
  const {
    importedLayers,
    setImportedLayers,
    imageLayers,
    setImageLayers,
    editingImageLayer,
    setEditingImageLayer,
    stylingLayer,
    setStylingLayer,
    baseLayerStates,
    setBaseLayerStates,
    getLayerByName,
    handleBaseMapChange,
    handleBaseMapOpacityChange,
    handleAddImageLayer,
    handleImageEdit,
    handleImageEditSave,
    handleFeatureSelect,
    handleCloseAttributeInfo,
    handleStyleEdit,
    handleStyleSave,
  } = useLayerManagement(
    setActivePanel,
    setIsImageEditorModalVisible,
    setIsStyleEditorVisible,
    setSelectedFeatureInfo
  );

  // 3. Map Control
  const {
    mapInstance,
    setMapInstance,
    graticuleEnabled,
    setGraticuleEnabled,
    graticuleType,
    setGraticuleType,
    showGraticuleOptions,
    setShowGraticuleOptions,
    handleZoomIn,
    handleZoomOut,
    handleZoomToLayer,
    handleFullExtent,
  } = useMapControl(importedLayers, imageLayers, getLayerByName);

  // 4. File Import/Export
  const { handleFileImport, handleExportData } = useFileImportExport(
    setImportedLayers,
    setActivePanel,
    mapInstance,
    importedLayers
  );

  // 5. Analysis Tools
  const {
    handleRunAreaAnalysis,
    handleRunDistanceAnalysis,
    handleRunShapeAnalysis,
  } = useAnalysisTools(setImportedLayers);

  // 6. History
  const {
    historyManagerRef,
    canUndo,
    canRedo,
    updateHistoryButtons,
    handleUndo,
    handleRedo,
  } = useHistory(mapInstance);

  const value = useMemo(
    () => ({
      activeTool,
      setActiveTool,
      activeTab,
      setActiveTab,
      mapInstance,
      setMapInstance,
      activePanel,
      setActivePanel,
      isImportModalVisible,
      setIsImportModalVisible,
      importedLayers,
      setImportedLayers,
      imageLayers,
      setImageLayers,
      isImageModalVisible,
      setIsImageModalVisible,
      isImageEditorModalVisible,
      setIsImageEditorModalVisible,
      editingImageLayer,
      setEditingImageLayer,
      isExportModalVisible,
      setIsExportModalVisible,
      graticuleEnabled,
      setGraticuleEnabled,
      graticuleType,
      setGraticuleType,
      showGraticuleOptions,
      setShowGraticuleOptions,
      selectedFeatureInfo,
      setSelectedFeatureInfo,
      isStyleEditorVisible,
      setIsStyleEditorVisible,
      stylingLayer,
      setStylingLayer,
      baseLayerStates,
      setBaseLayerStates,
      historyManagerRef,
      canUndo,
      canRedo,
      updateHistoryButtons,
      handleUndo,
      handleRedo,
      getLayerByName,
      handleZoomIn,
      handleZoomOut,
      handleZoomToLayer,
      handleFullExtent,
      handleBaseMapChange,
      handleBaseMapOpacityChange,
      handleFileImport,
      handleAddImageLayer,
      handleImageEdit,
      handleImageEditSave,
      handleExportData,
      handleFeatureSelect,
      handleCloseAttributeInfo,
      handleStyleEdit,
      handleStyleSave,
      handleRunAreaAnalysis,
      handleRunDistanceAnalysis,
      handleRunShapeAnalysis,
    }),
    [
      activeTool,
      activeTab,
      mapInstance,
      activePanel,
      isImportModalVisible,
      importedLayers,
      imageLayers,
      isImageModalVisible,
      isImageEditorModalVisible,
      editingImageLayer,
      isExportModalVisible,
      graticuleEnabled,
      graticuleType,
      showGraticuleOptions,
      selectedFeatureInfo,
      isStyleEditorVisible,
      stylingLayer,
      baseLayerStates,
      canUndo,
      canRedo,
      updateHistoryButtons,
      handleUndo,
      handleRedo,
      getLayerByName,
      handleZoomIn,
      handleZoomOut,
      handleZoomToLayer,
      handleFullExtent,
      handleBaseMapChange,
      handleBaseMapOpacityChange,
      handleFileImport,
      handleAddImageLayer,
      handleImageEdit,
      handleImageEditSave,
      handleExportData,
      handleFeatureSelect,
      handleCloseAttributeInfo,
      handleStyleEdit,
      handleStyleSave,
      handleRunAreaAnalysis,
      handleRunDistanceAnalysis,
      handleRunShapeAnalysis,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
