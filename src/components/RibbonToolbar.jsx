import React, { useState, useCallback, useEffect } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import { containsCoordinate } from "ol/extent";
import Point from "ol/geom/Point";
import OlPolygon from "ol/geom/Polygon";
import Style from "ol/style/Style"; // Added
import Fill from "ol/style/Fill"; // Added
import Stroke from "ol/style/Stroke"; // Added
import { fromLonLat } from "ol/proj"; // Added
import Select from "ol/interaction/Select"; // Added

// Import Lucide React Icons
import {
  Hand,
  MousePointer,
  Eraser,
  MapPin,
  PenLine,
  Hexagon,
  Circle,
  Ruler,
  LandPlot,
  Info,
  ZoomIn,
  ZoomOut,
  ScanSearch,
  Fullscreen,
  Target,
} from "lucide-react";

const RibbonToolbar = ({ activeTool, setActiveTool, mapInstance }) => {
  // State to manage the active tab in the ribbon toolbar (e.g., "home", "map", "analysis")
  // ສະຖານະເພື່ອຈັດການແຖບທີ່ເປີດໃຊ້ງານຢູ່ໃນແຖບເຄື່ອງມື Ribbon (ເຊັ່ນ: "home", "map", "analysis")
  const [activeTab, setActiveTab] = useState("home");
  // State to store the currently selected feature on the map
  // ສະຖານະເພື່ອເກັບລັກສະນະທີ່ຖືກເລືອກໃນປັດຈຸບັນຢູ່ໃນແຜນທີ່
  const [selectedFeature, setSelectedFeature] = useState(null);
  // useRef to create a persistent VectorSource instance for buffering, preventing re-creation on re-renders
  // useRef ເພື່ອສ້າງ Instance ຂອງ VectorSource ທີ່ຄົງຢູ່ສຳລັບການ buffering, ປ້ອງກັນການສ້າງໃໝ່ໃນເວລາ Rerender
  const vectorSource = React.useRef(new VectorSource());

  // Function to get a layer from the map by its given name
  // ຟັງຊັນເພື່ອນໍາເອົາ Layer ຈາກແຜນທີ່ໂດຍໃຊ້ຊື່ທີ່ໃຫ້ມາ
  const getLayerByName = useCallback(
    (name) => {
      if (!mapInstance) return null; // If mapInstance is not available, return null
      // ຖ້າ mapInstance ບໍ່ມີ, ໃຫ້ສົ່ງຄ່າ Null
      let layerFound = null;
      mapInstance.getLayers().forEach((layer) => {
        if (layer.get("name") === name) {
          // Check if the layer's name matches
          // ກວດເບິ່ງວ່າຊື່ Layer ກົງກັນຫຼືບໍ່
          layerFound = layer;
        }
      });
      return layerFound;
    },
    [mapInstance] // Dependency array: Recalculate if mapInstance changes
    // Dependency array: ຄິດໄລ່ໃໝ່ຖ້າ mapInstance ປ່ຽນແປງ
  );

  // useEffect hook to initialize the vector layer for buffer features if it doesn't already exist on the map
  // useEffect Hook ເພື່ອເລີ່ມຕົ້ນ Vector Layer ສໍາລັບຄຸນສົມບັດ Buffer ຖ້າມັນຍັງບໍ່ມີຢູ່ໃນແຜນທີ່
  useEffect(() => {
    if (!mapInstance) return; // Exit if mapInstance is not available
    // ອອກຖ້າ mapInstance ບໍ່ມີ

    let existingVectorLayer = getLayerByName("bufferLayer"); // Try to get an existing "bufferLayer"
    // ພະຍາຍາມເອົາ "bufferLayer" ທີ່ມີຢູ່
    if (!existingVectorLayer) {
      // If no existing buffer layer is found
      // ຖ້າບໍ່ພົບ Layer Buffer ທີ່ມີຢູ່
      const newVectorLayer = new VectorLayer({
        source: vectorSource.current, // Use the persistent vectorSource for this layer
        // ໃຊ້ VectorSource ທີ່ຄົງຢູ່ສໍາລັບ Layer ນີ້
        name: "bufferLayer", // Assign a name to the layer for easy retrieval
        // ກໍານົດຊື່ໃຫ້ Layer ເພື່ອຄວາມສະດວກໃນການເອີ້ນຄືນ
        style: new Style({
          // Define the visual style for buffer features
          // ກໍານົດຮູບແບບສີສັນສໍາລັບຄຸນສົມບັດ Buffer
          fill: new Fill({
            // Fill style for polygons
            // ຮູບແບບການເຕີມສີສໍາລັບ Polygon
            color: "rgba(0, 255, 0, 0.2)", // Semi-transparent green fill
            // ສີຂຽວໂປ່ງໃສ 0.2
          }),
          stroke: new Stroke({
            // Stroke style for lines and outlines
            // ຮູບແບບເສັ້ນຂອບສໍາລັບເສັ້ນແລະຮູບຮ່າງ
            color: "#00ff00", // Green border
            // ຂອບສີຂຽວ
            width: 2, // 2 pixels wide
            // ຂະໜາດ 2 Pixels
            lineDash: [5, 5], // Dashed line style
            // ຮູບແບບເສັ້ນຈຸດ
          }),
        }),
      });
      mapInstance.addLayer(newVectorLayer); // Add the new buffer layer to the map
      // ເພີ່ມ Layer Buffer ໃໝ່ເຂົ້າໃນແຜນທີ່
    }
  }, [mapInstance, getLayerByName]); // Dependencies: Re-run if mapInstance or getLayerByName changes
  // Dependencies: ເຮັດວຽກຄືນໃໝ່ຖ້າ mapInstance ຫຼື getLayerByName ປ່ຽນແປງ

  // Handler for changing the active tab in the ribbon
  // ຕົວຈັດການສຳລັບການປ່ຽນແຖບທີ່ເປີດໃຊ້ງານຢູ່ໃນ Ribbon
  const handleTabClick = (tab) => {
    setActiveTab(tab); // Update the activeTab state
    // ອັບເດດສະຖານະ ActiveTab
  };

  // Handler for setting the active map tool (e.g., pan, select, draw)
  // ຕົວຈັດການສຳລັບການຕັ້ງຄ່າເຄື່ອງມືແຜນທີ່ທີ່ເປີດໃຊ້ງານ (ເຊັ່ນ: Pan, Select, Draw)
  const handleToolClick = useCallback(
    (tool) => {
      setActiveTool(tool); // Update the activeTool state passed via props
      // ອັບເດດສະຖານະ ActiveTool ທີ່ສົ່ງຜ່ານ Props
    },
    [setActiveTool] // Dependency: Recalculate if setActiveTool function changes
    // Dependency: ຄິດໄລ່ຄືນໃໝ່ຖ້າຟັງຊັນ setActiveTool ປ່ຽນແປງ
  );

  // Handler to clear all features and overlays from the map
  // ຕົວຈັດການເພື່ອລຶບຄຸນສົມບັດ ແລະ Overlays ທັງໝົດອອກຈາກແຜນທີ່
  const handleClearMap = useCallback(() => {
    if (mapInstance) {
      // Get and clear features from the 'vectorLayer' (for drawings)
      // ເອົາແລະລຶບຄຸນສົມບັດຈາກ 'vectorLayer' (ສຳລັບການແຕ້ມຮູບ)
      const vectorLayer = getLayerByName("vectorLayer");
      if (vectorLayer) {
        vectorLayer.getSource().clear();
      }
      // Get and clear features from the 'measureLayer' (for measurements)
      // ເອົາແລະລຶບຄຸນສົມບັດຈາກ 'measureLayer' (ສຳລັບການວັດແທກ)
      const measureLayer = getLayerByName("measureLayer");
      if (measureLayer) {
        measureLayer.getSource().clear();
      }
      // Get and clear features from the 'bufferLayer' (for buffer analysis results)
      // ເອົາແລະລຶບຄຸນສົມບັດຈາກ 'bufferLayer' (ສຳລັບຜົນການວິເຄາະ Buffer)
      const bufferLayer = getLayerByName("bufferLayer");
      if (bufferLayer) {
        bufferLayer.getSource().clear();
      }

      // Remove all overlays (like tooltips) from the map
      // ລຶບ Overlays ທັງໝົດ (ເຊັ່ນ: Tooltips) ອອກຈາກແຜນທີ່
      mapInstance.getOverlays().clear();
    }
  }, [mapInstance, getLayerByName]); // Dependencies: Re-run if mapInstance or getLayerByName changes
  // Dependencies: ເຮັດວຽກຄືນໃໝ່ຖ້າ mapInstance ຫຼື getLayerByName ປ່ຽນແປງ

  // Handler for zooming in the map
  // ຕົວຈັດການສຳລັບການຊູມເຂົ້າແຜນທີ່
  const handleZoomIn = useCallback(() => {
    if (mapInstance) {
      const view = mapInstance.getView(); // Get the current map view
      // ເອົາ View ແຜນທີ່ປັດຈຸບັນ
      view.setZoom(view.getZoom() + 1); // Increase zoom level by 1
      // ເພີ່ມລະດັບການຊູມຂຶ້ນ 1
    }
  }, [mapInstance]); // Dependency: Re-run if mapInstance changes
  // Dependency: ເຮັດວຽກຄືນໃໝ່ຖ້າ mapInstance ປ່ຽນແປງ

  // Handler for zooming out the map
  // ຕົວຈັດການສຳລັບການຊູມອອກແຜນທີ່
  const handleZoomOut = useCallback(() => {
    if (mapInstance) {
      const view = mapInstance.getView(); // Get the current map view
      // ເອົາ View ແຜນທີ່ປັດຈຸບັນ
      view.setZoom(view.getZoom() - 1); // Decrease zoom level by 1
      // ຫຼຸດລະດັບການຊູມລົງ 1
    }
  }, [mapInstance]); // Dependency: Re-run if mapInstance changes
  // Dependency: ເຮັດວຽກຄືນໃໝ່ຖ້າ mapInstance ປ່ຽນແປງ

  // Handler for zooming the map to the extent of features in the 'vectorLayer'
  // ຕົວຈັດການສຳລັບການຊູມແຜນທີ່ໄປຍັງຂອບເຂດຂອງຄຸນສົມບັດໃນ 'vectorLayer'
  const handleZoomToLayer = useCallback(() => {
    if (mapInstance) {
      const vectorLayer = getLayerByName("vectorLayer"); // Get the vector layer
      // ເອົາ Vector Layer
      // Check if the layer exists and contains features
      // ກວດເບິ່ງວ່າ Layer ມີຢູ່ ແລະມີຄຸນສົມບັດຫຼືບໍ່
      if (vectorLayer && vectorLayer.getSource().getFeatures().length > 0) {
        const view = mapInstance.getView(); // Get the map view
        // ເອົາ View ແຜນທີ່
        view.fit(vectorLayer.getSource().getExtent(), {
          // Fit the view to the extent of all features in the vector layer
          // ປັບ View ໃຫ້ພໍດີກັບຂອບເຂດຂອງຄຸນສົມບັດທັງໝົດໃນ Vector Layer
          padding: [50, 50, 50, 50], // Add padding around the features
          // ເພີ່ມ Padding ອ້ອມຮອບຄຸນສົມບັດ
          duration: 1000, // Animation duration in milliseconds
          // ໄລຍະເວລາການເຄື່ອນໄຫວເປັນ Milliseconds
        });
      }
    }
  }, [mapInstance, getLayerByName]); // Dependencies: Re-run if mapInstance or getLayerByName changes
  // Dependencies: ເຮັດວຽກຄືນໃໝ່ຖ້າ mapInstance ຫຼື getLayerByName ປ່ຽນແປງ

  // Handler for resetting the map view to its initial full extent (centered on Laos)
  // ຕົວຈັດການສຳລັບການຕັ້ງຄ່າ View ແຜນທີ່ຄືນໃໝ່ໃຫ້ເປັນຂອບເຂດເຕັມ (ຈຸດສູນກາງຢູ່ລາວ)
  const handleFullExtent = useCallback(() => {
    if (mapInstance) {
      const view = mapInstance.getView(); // Get the map view
      // ເອົາ View ແຜນທີ່
      view.animate({
        // Animate the view to the specified center and zoom level
        // ສົ່ງ View ໄປທີ່ຈຸດສູນກາງ ແລະລະດັບການຊູມທີ່ກຳນົດ
        center: fromLonLat([102.6, 17.97]), // Center coordinates for Laos (longitude, latitude)
        // ພິກັດຈຸດສູນກາງສໍາລັບປະເທດລາວ (ເສັ້ນແວງ, ເສັ້ນຂະໜານ)
        zoom: 7, // Initial zoom level
        // ລະດັບການຊູມເບື້ອງຕົ້ນ
        duration: 1000, // Animation duration
        // ໄລຍະເວລາການເຄື່ອນໄຫວ
      });
    }
  }, [mapInstance]); // Dependency: Re-run if mapInstance changes
  // Dependency: ເຮັດວຽກຄືນໃໝ່ຖ້າ mapInstance ປ່ຽນແປງ

  // Handler for performing buffer analysis on a selected feature
  // ຕົວຈັດການສຳລັບການວິເຄາະ Buffer ໃນ Feature ທີ່ເລືອກ
  const handleBuffer = useCallback(() => {
    // Check if map or a feature is selected
    // ກວດເບິ່ງວ່າເລືອກແຜນທີ່ ຫຼື Feature
    if (!mapInstance || !selectedFeature) {
      alert("Please select a feature on the map first."); // Prompt user to select a feature
      // ກະລຸນາເລືອກ Feature ຢູ່ໃນແຜນທີ່ກ່ອນ
      return;
    }

    // Prompt user for buffer distance
    // ຂໍໃຫ້ຜູ້ໃຊ້ໃສ່ໄລຍະຫ່າງຂອງ Buffer
    const bufferDistanceInput = prompt("Enter buffer distance in meters:");
    const bufferDistanceInMeters = parseFloat(bufferDistanceInput);

    // Validate the input distance
    // ກວດສອບຄວາມຖືກຕ້ອງຂອງໄລຍະຫ່າງທີ່ປ້ອນ
    if (isNaN(bufferDistanceInMeters) || bufferDistanceInMeters <= 0) {
      alert("Invalid buffer distance. Please enter a positive number."); // Invalid input
      // ໄລຍະຫ່າງຂອງ Buffer ບໍ່ຖືກຕ້ອງ. ກະລຸນາປ້ອນຕົວເລກບວກ
      return;
    }

    const geometry = selectedFeature.getGeometry(); // Get the geometry of the selected feature
    // ເອົາ Geometry ຂອງ Feature ທີ່ເລືອກ
    let bufferPolygon;

    vectorSource.current.clear(); // Clear any existing buffer features from the buffer layer
    // ລຶບຄຸນສົມບັດ Buffer ທີ່ມີຢູ່ອອກຈາກ Layer Buffer

    if (geometry.getType() === "Point") {
      // If the selected feature is a Point
      // ຖ້າ Feature ທີ່ເລືອກເປັນ Point
      const center = geometry.getCoordinates(); // Get the coordinates of the point
      // ເອົາ Coordinates ຂອງ Point
      bufferPolygon = OlPolygon.circular(
        // Create a circular polygon (buffer) around the point
        // ສ້າງ Circular Polygon (Buffer) ອ້ອມຮອບ Point
        mapInstance.getView().getProjection(), // Use the map's projection
        // ໃຊ້ Map's Projection
        center, // Center of the circle
        // ຈຸດໃຈກາງຂອງວົງມົນ
        bufferDistanceInMeters // Radius of the circle in meters
        // ລັດສະໝີຂອງວົງມົນເປັນແມັດ
      );
    } else if (
      // If the selected feature is a LineString or Polygon
      // ຖ້າ Feature ທີ່ເລືອກເປັນ LineString ຫຼື Polygon
      geometry.getType() === "LineString" ||
      geometry.getType() === "Polygon"
    ) {
      const extent = geometry.getExtent(); // Get the bounding box extent of the geometry
      // ເອົາ Bounding Box Extent ຂອງ Geometry
      const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2]; // Calculate the center of the extent
      // ຄິດໄລ່ຈຸດໃຈກາງຂອງ Extent

      if (!containsCoordinate(mapInstance.getView().getExtent(), center)) {
        // Fallback for cases where the extent center might be outside the current view (e.g., small features)
        // Fallback ສໍາລັບກໍລະນີທີ່ຈຸດສູນກາງຂອງ Extent ອາດຈະຢູ່ພາຍນອກ View ປັດຈຸບັນ (ເຊັ່ນ: Features ຂະໜາດນ້ອຍ)
        const geomCenter = geometry.getCoordinates();
        const actualCenter =
          geometry.getType() === "LineString"
            ? geomCenter[0] // For LineString, use the first coordinate
            : // ສໍາລັບ LineString, ໃຊ້ Coordinate ທໍາອິດ
              geomCenter[0][0]; // For Polygon, use the first point of the first linear ring
        // ສໍາລັບ Polygon, ໃຊ້ Point ທໍາອິດຂອງ Linear Ring ທໍາອິດ

        bufferPolygon = OlPolygon.circular(
          // Create a circular buffer around this more accurate center
          // ສ້າງ Circular Buffer ອ້ອມຮອບຈຸດໃຈກາງທີ່ຊັດເຈນກວ່ານີ້
          mapInstance.getView().getProjection(),
          actualCenter,
          bufferDistanceInMeters
        );
      } else {
        bufferPolygon = OlPolygon.circular(
          // Create a circular buffer around the calculated extent center
          // ສ້າງ Circular Buffer ອ້ອມຮອບຈຸດໃຈກາງ Extent ທີ່ຄິດໄລ່ແລ້ວ
          mapInstance.getView().getProjection(),
          center,
          bufferDistanceInMeters
        );
      }
    } else {
      alert(
        "Buffering is currently supported for Point, LineString, and Polygon features."
      ); // Unsupported geometry type
      // ປະຈຸບັນ Buffer ຮອງຮັບສະເພາະ Point, LineString, ແລະ Polygon Features ເທົ່ານັ້ນ
      return;
    }

    const bufferFeature = new Feature(bufferPolygon); // Create a new feature from the buffer polygon
    // ສ້າງ Feature ໃໝ່ຈາກ Buffer Polygon
    vectorSource.current.addFeature(bufferFeature); // Add the buffer feature to the buffer layer's source
    // ເພີ່ມ Buffer Feature ໃສ່ Source ຂອງ Layer Buffer
  }, [mapInstance, selectedFeature]); // Dependencies: Re-run if mapInstance or selectedFeature changes
  // Dependencies: ເຮັດວຽກຄືນໃໝ່ຖ້າ mapInstance ຫຼື selectedFeature ປ່ຽນແປງ

  // useEffect hook to handle updates to the selectedFeature state when a feature is selected on the map
  // useEffect Hook ເພື່ອຈັດການການອັບເດດສະຖານະ selectedFeature ເມື່ອມີ Feature ຖືກເລືອກໃນແຜນທີ່
  useEffect(() => {
    if (mapInstance) {
      // Find the Select interaction instance from the map's interactions
      // ຊອກຫາ Instance ຂອງ Select Interaction ຈາກ Interactions ຂອງແຜນທີ່
      const select = mapInstance
        .getInteractions()
        .getArray()
        .find(
          (interaction) => interaction instanceof Select // Check if the interaction is an instance of ol/interaction/Select
          // ກວດເບິ່ງວ່າ Interaction ເປັນ Instance ຂອງ Ol/Interaction/Select ຫຼືບໍ່
        );

      if (select) {
        // Listen for 'select' events on the Select interaction
        // ຟັງ Event 'select' ໃນ Select Interaction
        select.on("select", (event) => {
          if (event.selected.length > 0) {
            // If features are selected, set the first one as selectedFeature
            // ຖ້າເລືອກ Features, ໃຫ້ຕັ້ງ Feature ທຳອິດເປັນ selectedFeature
            setSelectedFeature(event.selected[0]);
          } else {
            setSelectedFeature(null); // If no features are selected, clear selectedFeature
            // ຖ້າບໍ່ມີ Features ຖືກເລືອກ, ໃຫ້ລຶບ selectedFeature
          }
        });
      }
    }
  }, [mapInstance]); // Dependency: Re-run if mapInstance changes
  // Dependency: ເຮັດວຽກຄືນໃໝ່ຖ້າ mapInstance ຫຼື selectedFeature ປ່ຽນແປງ

  return (
    <div className="ribbon-toolbar">
      {/* Ribbon Tabs Section */}
      {/* ສ່ວນແຖບ Ribbon */}
      <div className="ribbon-tabs">
        <div
          className={`ribbon-tab ${activeTab === "home" ? "active" : ""}`}
          onClick={() => handleTabClick("home")}
        >
          Home (ໜ້າຫຼັກ)
        </div>
        <div
          className={`ribbon-tab ${activeTab === "map" ? "active" : ""}`}
          onClick={() => handleTabClick("map")}
        >
          Map (ແຜນທີ່)
        </div>
        <div
          className={`ribbon-tab ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => handleTabClick("analysis")}
        >
          Analysis (ການວິເຄາະ)
        </div>
      </div>

      {/* Ribbon Content Section, displays content based on activeTab */}
      {/* ສ່ວນເນື້ອໃນ Ribbon, ສະແດງເນື້ອໃນຕາມ ActiveTab */}
      <div className="ribbon-content">
        {/* Home Tab Content */}
        {/* ເນື້ອໃນແຖບ Home */}
        {activeTab === "home" && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                {/* Pan Tool Button */}
                {/* ປຸ່ມເຄື່ອງມື Pan */}
                <button
                  className={`ribbon-button ${
                    activeTool === "pan" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("pan")}
                >
                  <Hand size={18} />
                  Pan (ເລື່ອນ)
                </button>
                {/* Select Tool Button */}
                {/* ປຸ່ມເຄື່ອງມືເລືອກ */}
                <button
                  className={`ribbon-button ${
                    activeTool === "select" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("select")}
                >
                  <MousePointer size={18} />
                  Select (ເລືອກ)
                </button>
                {/* Clear Map Button */}
                {/* ປຸ່ມລຶບແຜນທີ່ */}
                <button className="ribbon-button" onClick={handleClearMap}>
                  <Eraser size={18} />
                  Clear Map (ລຶບແຜນທີ່)
                </button>
              </div>
              <div className="ribbon-group-title">
                Map Tools (ເຄື່ອງມືແຜນທີ່)
              </div>
            </div>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                {/* Draw Point Button */}
                {/* ປຸ່ມແຕ້ມຈຸດ */}
                <button
                  className={`ribbon-button ${
                    activeTool === "draw-point" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("draw-point")}
                >
                  <MapPin size={18} />
                  Point (ຈຸດ)
                </button>
                {/* Draw Line Button */}
                {/* ປຸ່ມແຕ້ມເສັ້ນ */}
                <button
                  className={`ribbon-button ${
                    activeTool === "draw-line" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("draw-line")}
                >
                  <PenLine size={18} />
                  Line (ເສັ້ນ)
                </button>
                {/* Draw Polygon Button */}
                {/* ປຸ່ມແຕ້ມ Polygon */}
                <button
                  className={`ribbon-button ${
                    activeTool === "draw-polygon" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("draw-polygon")}
                >
                  <Hexagon size={18} />
                  Polygon (ຮູບຫຼາຍຫຼ່ຽມ)
                </button>
                {/* Draw Circle Button */}
                {/* ປຸ່ມແຕ້ມວົງມົນ */}
                <button
                  className={`ribbon-button ${
                    activeTool === "draw-circle" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("draw-circle")}
                >
                  <Circle size={18} />
                  Circle (ວົງມົນ)
                </button>
              </div>
              <div className="ribbon-group-title">Draw (ແຕ້ມ)</div>
            </div>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                {/* Measure Distance Button */}
                {/* ປຸ່ມວັດແທກໄລຍະທາງ */}
                <button
                  className={`ribbon-button ${
                    activeTool === "measure-distance" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("measure-distance")}
                >
                  <Ruler size={18} />
                  Distance (ໄລຍະທາງ)
                </button>
                {/* Measure Area Button */}
                {/* ປຸ່ມວັດແທກພື້ນທີ່ */}
                <button
                  className={`ribbon-button ${
                    activeTool === "measure-area" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("measure-area")}
                >
                  <LandPlot size={18} />
                  Area (ພື້ນທີ່)
                </button>
                {/* Identify Tool Button */}
                {/* ປຸ່ມເຄື່ອງມື Identify */}
                <button
                  className={`ribbon-button ${
                    activeTool === "identify" ? "active" : ""
                  }`}
                  onClick={() => handleToolClick("identify")}
                >
                  <Info size={18} />
                  Identify (ລະບຸ)
                </button>
              </div>
              <div className="ribbon-group-title">Measure (ວັດແທກ)</div>
            </div>
          </>
        )}

        {/* Map Tab Content */}
        {/* ເນື້ອໃນແຖບ Map */}
        {activeTab === "map" && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                {/* Zoom In Button */}
                {/* ປຸ່ມຊູມເຂົ້າ */}
                <button className="ribbon-button" onClick={handleZoomIn}>
                  <ZoomIn size={18} />
                  Zoom In (ຊູມເຂົ້າ)
                </button>
                {/* Zoom Out Button */}
                {/* ປຸ່ມຊູມອອກ */}
                <button className="ribbon-button" onClick={handleZoomOut}>
                  <ZoomOut size={18} />
                  Zoom Out (ຊູມອອກ)
                </button>
                {/* Zoom to Layer Button */}
                {/* ປຸ່ມຊູມໄປທີ່ Layer */}
                <button className="ribbon-button" onClick={handleZoomToLayer}>
                  <ScanSearch size={18} />
                  Zoom to Layer (ຊູມໄປທີ່ Layer)
                </button>
                {/* Full Extent Button */}
                {/* ປຸ່ມຂອບເຂດເຕັມ */}
                <button className="ribbon-button" onClick={handleFullExtent}>
                  <Fullscreen size={18} />
                  Full Extent (ຂອບເຂດເຕັມ)
                </button>
              </div>
              <div className="ribbon-group-title">Navigation (ການນຳທາງ)</div>
            </div>
          </>
        )}

        {/* Analysis Tab Content */}
        {/* ເນື້ອໃນແຖບການວິເຄາະ */}
        {activeTab === "analysis" && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                {/* Buffer Button */}
                {/* ປຸ່ມ Buffer */}
                <button className="ribbon-button" onClick={handleBuffer}>
                  <Target size={18} />
                  Buffer (ເຂດກັນຊົນ)
                </button>
              </div>
              <div className="ribbon-group-title">
                Geoprocessing (ການປະມວນຜົນພູມສາດ)
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RibbonToolbar;
