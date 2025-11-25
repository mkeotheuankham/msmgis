import { useState } from "react";

export const useAppState = () => {
  const [activeTool, setActiveTool] = useState("pan");
  const [activeTab, setActiveTab] = useState("home");
  const [activePanel, setActivePanel] = useState(null);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isImageEditorModalVisible, setIsImageEditorModalVisible] =
    useState(false);
  const [isStyleEditorVisible, setIsStyleEditorVisible] = useState(false);
  const [selectedFeatureInfo, setSelectedFeatureInfo] = useState(null);

  return {
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
  };
};
