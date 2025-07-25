import GeoJSON from "ol/format/GeoJSON";

/**
 * A simple history manager for vector features.
 * It stores snapshots of features as GeoJSON strings.
 */
class HistoryManager {
  constructor(maxHistory = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistory = maxHistory;
    this.format = new GeoJSON();
  }

  /**
   * Adds a new state (an array of features) to the history stack.
   * @param {Array<import("ol/Feature").default>} features The features to save.
   */
  addState(features) {
    // If we undo and then make a new change, we clear the "redo" history
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Convert features to GeoJSON strings for serialization
    const geojsonState = this.format.writeFeatures(features, {
      featureProjection: "EPSG:3857",
      dataProjection: "EPSG:4326",
    });
    this.history.push(geojsonState);

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.currentIndex = this.history.length - 1;
  }

  /**
   * Moves to the previous state in history.
   * @returns {Array<import("ol/Feature").default> | null} The array of features for the previous state.
   */
  undo() {
    if (this.canUndo()) {
      this.currentIndex--;
      const geojsonState = this.history[this.currentIndex];
      return this.format.readFeatures(geojsonState, {
        featureProjection: "EPSG:3857",
        dataProjection: "EPSG:4326",
      });
    }
    return null;
  }

  /**
   * Moves to the next state in history.
   * @returns {Array<import("ol/Feature").default> | null} The array of features for the next state.
   */
  redo() {
    if (this.canRedo()) {
      this.currentIndex++;
      const geojsonState = this.history[this.currentIndex];
      return this.format.readFeatures(geojsonState, {
        featureProjection: "EPSG:3857",
        dataProjection: "EPSG:4326",
      });
    }
    return null;
  }

  /**
   * Checks if an undo operation is possible.
   * @returns {boolean}
   */
  canUndo() {
    return this.currentIndex > 0;
  }

  /**
   * Checks if a redo operation is possible.
   * @returns {boolean}
   */
  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Clears the entire history stack.
   */
  clear() {
    this.history = [];
    this.currentIndex = -1;
  }
}

export default HistoryManager;
