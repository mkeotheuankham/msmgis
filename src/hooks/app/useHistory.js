import { useState, useRef, useCallback } from "react";
import HistoryManager from "../../utils/HistoryManager";

export const useHistory = (mapInstance) => {
  const historyManagerRef = useRef(new HistoryManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateHistoryButtons = useCallback(() => {
    setCanUndo(historyManagerRef.current.canUndo());
    setCanRedo(historyManagerRef.current.canRedo());
  }, []);

  const handleUndo = useCallback(() => {
    if (mapInstance && historyManagerRef.current.canUndo()) {
      const previousFeatures = historyManagerRef.current.undo();
      const editorLayer = mapInstance
        .getLayers()
        .getArray()
        .find((l) => l.get("name") === "editorLayer");
      if (editorLayer && previousFeatures) {
        editorLayer.getSource().clear();
        editorLayer.getSource().addFeatures(previousFeatures);
      }
      updateHistoryButtons();
    }
  }, [mapInstance, updateHistoryButtons]);

  const handleRedo = useCallback(() => {
    if (mapInstance && historyManagerRef.current.canRedo()) {
      const nextFeatures = historyManagerRef.current.redo();
      const editorLayer = mapInstance
        .getLayers()
        .getArray()
        .find((l) => l.get("name") === "editorLayer");
      if (editorLayer && nextFeatures) {
        editorLayer.getSource().clear();
        editorLayer.getSource().addFeatures(nextFeatures);
      }
      updateHistoryButtons();
    }
  }, [mapInstance, updateHistoryButtons]);

  return {
    historyManagerRef,
    canUndo,
    canRedo,
    updateHistoryButtons,
    handleUndo,
    handleRedo,
  };
};
