import React, { useEffect, useRef, useState, useCallback } from "react"; // Added useState, useCallback
import "ol/ol.css"; // Import OpenLayers default CSS for basic styling | ນໍາເຂົ້າໄຟລ໌ CSS ມາດຕະຖານຂອງ OpenLayers ເພື່ອການອອກແບບພື້ນຖານ
import Map from "ol/Map"; // OpenLayers Map object | ອອບເຈັກແຜນທີ່ OpenLayers
import View from "ol/View"; // OpenLayers View for map projection, center, and zoom | View ຂອງ OpenLayers ສໍາລັບການຄາດຄະເນແຜນທີ່, ຈຸດກາງ, ແລະການຊູມ
import TileLayer from "ol/layer/Tile"; // Layer type for tile-based maps (e.g., OSM, satellite) | ປະເພດຊັ້ນຂໍ້ມູນສໍາລັບແຜນທີ່ທີ່ອີງໃສ່ໄທລ໌ (ເຊັ່ນ: OSM, ດາວທຽມ)
import OSM from "ol/source/OSM"; // Open Street Map tile source | ແຫຼ່ງຂໍ້ມູນໄທລ໌ Open Street Map
import XYZ from "ol/source/XYZ"; // XYZ tile source (used for satellite imagery) | ແຫຼ່ງຂໍ້ມູນໄທລ໌ XYZ (ໃຊ້ສໍາລັບພາບຖ່າຍດາວທຽມ)
import VectorLayer from "ol/layer/Vector"; // Layer type for vector data (points, lines, polygons) | ປະເພດຊັ້ນຂໍ້ມູນສໍາລັບຂໍ້ມູນ vector (ຈຸດ, ເສັ້ນ, ຮູບຫຼາຍຫຼ່ຽມ)
import VectorSource from "ol/source/Vector"; // Source for vector data | ແຫຼ່ງຂໍ້ມູນສໍາລັບຂໍ້ມູນ vector
import Style from "ol/style/Style"; // Style for OpenLayers features | ສະຕາຍສໍາລັບຄຸນສົມບັດ OpenLayers
import Fill from "ol/style/Fill"; // Fill style for polygons | ສະຕາຍການຕື່ມສໍາລັບຮູບຫຼາຍຫຼ່ຽມ
import Stroke from "ol/style/Stroke"; // Stroke style for lines and polygon borders | ສະຕາຍເສັ້ນສໍາລັບເສັ້ນ ແລະຂອບຮູບຫຼາຍຫຼ່ຽມ
import CircleStyle from "ol/style/Circle"; // Style for points as circles | ສະຕາຍສໍາລັບຈຸດເປັນວົງມົນ
import { fromLonLat, toLonLat, METERS_PER_UNIT } from "ol/proj"; // Projection utilities: convert between LonLat and map projection, and units conversion | ຜົນປະໂຫຍດການຄາດຄະເນ: ປ່ຽນລະຫວ່າງ LonLat ແລະການຄາດຄະເນແຜນທີ່, ແລະການປ່ຽນຫົວໜ່ວຍ
import Draw from "ol/interaction/Draw"; // Interaction for drawing features on the map | ການໂຕ້ຕອບສໍາລັບການແຕ້ມຄຸນສົມບັດໃນແຜນທີ່
import { getLength, getArea } from "ol/sphere"; // Spherical geometry calculations for accurate length/area | ການຄໍານວນເລຂາຄະນິດ spherical ເພື່ອຄວາມຖືກຕ້ອງຂອງຄວາມຍາວ/ພື້ນທີ່
import Overlay from "ol/Overlay"; // Used to display HTML elements (like tooltips) on the map | ໃຊ້ເພື່ອສະແດງອົງປະກອບ HTML (ເຊັ່ນ: tooltips) ໃນແຜນທີ່
import Select from "ol/interaction/Select"; // Interaction for selecting features on the map | ການໂຕ້ຕອບສໍາລັບການເລືອກຄຸນສົມບັດໃນແຜນທີ່
import Polygon from "ol/geom/Polygon"; // Geometry type for polygons | ປະເພດເລຂາຄະນິດສໍາລັບຮູບຫຼາຍຫຼ່ຽມ
import Feature from "ol/Feature"; // OpenLayers Feature object, which holds geometry and properties | ອອບເຈັກຄຸນສົມບັດ OpenLayers, ເຊິ່ງບັນຈຸເລຂາຄະນິດ ແລະຄຸນສົມບັດ
import CoordinateBar from "./ui/CoordinateBar"; // Custom component for displaying coordinates and scale | ອົງປະກອບສໍາລັບສະແດງພິກັດ ແລະ ຂະໜາດ
import Sidebar from "./ui/Sidebar"; // Custom sidebar component for map controls | ອົງປະກອບ sidebar ສໍາລັບການຄວບຄຸມແຜນທີ່

const MapComponent = ({ activeTool, setActiveTool, setMapInstance }) => {
  const mapRef = useRef(); // Ref for the DOM element where the map will be rendered | Ref ສໍາລັບອົງປະກອບ DOM ບ່ອນທີ່ແຜນທີ່ຈະຖືກສະແດງ
  const olMap = useRef(null); // Ref to hold the OpenLayers map instance | Ref ເພື່ອບັນຈຸອິນສະແຕນແຜນທີ່ OpenLayers
  const drawInteraction = useRef(null); // Ref to hold the current draw interaction | Ref ເພື່ອບັນຈຸການໂຕ້ຕອບການແຕ້ມປັດຈຸບັນ
  const selectInteraction = useRef(null); // Ref to hold the select interaction | Ref ເພື່ອບັນຈຸການໂຕ້ຕອບການເລືອກ

  const vectorSource = useRef(new VectorSource()); // Source for features drawn by the user | ແຫຼ່ງຂໍ້ມູນສໍາລັບຄຸນສົມບັດທີ່ຜູ້ໃຊ້ແຕ້ມ
  const measureSource = useRef(new VectorSource()); // Source for features drawn during measurement | ແຫຼ່ງຂໍ້ມູນສໍາລັບຄຸນສົມບັດທີ່ແຕ້ມໃນລະຫວ່າງການວັດແທກ

  // State for Sidebar props (placeholders, replace with actual data management)
  const [openLayersLoaded, setOpenLayersLoaded] = useState(false);
  const [layerStates, setLayerStates] = useState({
    osm: { visible: true, opacity: 1 },
    satellite: { visible: false, opacity: 1 },
    // Add other layers as needed
  });
  const [districts] = useState([]); // Placeholder for district data
  const [selectedProvinceForDistricts] = useState(null); // Placeholder

  // Handler for province selection from Sidebar, impacting map view or data loading
  const onProvinceSelectForMap = useCallback((provinceId) => {
    console.log("Selected province for map:", provinceId);
    // Logic to zoom to province, load data, etc.
  }, []);

  // Handler for layer visibility change from Sidebar
  const onVisibilityChange = useCallback((layerName, visible) => {
    setLayerStates((prev) => {
      const newState = {
        ...prev,
        [layerName]: { ...prev[layerName], visible },
      };
      if (olMap.current) {
        olMap.current.getAllLayers().forEach((layer) => {
          if (layer.get("name") === layerName) {
            layer.setVisible(visible);
          }
        });
      }
      return newState;
    });
  }, []);

  // Handler for layer opacity change from Sidebar
  const onOpacityChange = useCallback((layerName, opacity) => {
    setLayerStates((prev) => {
      const newState = {
        ...prev,
        [layerName]: { ...prev[layerName], opacity },
      };
      if (olMap.current) {
        olMap.current.getAllLayers().forEach((layer) => {
          if (layer.get("name") === layerName) {
            layer.setOpacity(opacity);
          }
        });
      }
      return newState;
    });
  }, []);

  // Placeholder functions for DistrictSelector
  const toggleDistrict = useCallback((districtId) => {
    console.log("Toggle district:", districtId);
  }, []);

  const handleLoadData = useCallback((dataType) => {
    console.log("Load data for type:", dataType);
  }, []);

  const handleDistrictOpacityChange = useCallback((districtId, opacity) => {
    console.log(`District ${districtId} opacity changed to ${opacity}`);
  }, []);

  // Helper function to format line length for display | ຟັງຊັນຊ່ວຍເຫຼືອເພື່ອຈັດຮູບແບບຄວາມຍາວຂອງເສັ້ນສໍາລັບການສະແດງຜົນ
  const formatLength = (line) => {
    const length = getLength(line); // Calculate length of the line geometry | ຄໍານວນຄວາມຍາວຂອງເລຂາຄະນິດເສັ້ນ
    let output;
    if (length > 100) {
      output = Math.round((length / 1000) * 100) / 100 + " km"; // Convert to kilometers if greater than 100m | ປ່ຽນເປັນກິໂລແມັດ ຖ້າຫຼາຍກວ່າ 100m
    } else {
      output = Math.round(length * 100) / 100 + " m"; // Display in meters otherwise | ສະແດງເປັນແມັດ ຖ້າບໍ່ດັ່ງນັ້ນ
    }
    return output;
  };

  // Helper function to format area for display | ຟັງຊັນຊ່ວຍເຫຼືອເພື່ອຈັດຮູບແບບພື້ນທີ່ສໍາລັບການສະແດງຜົນ
  const formatArea = (polygon) => {
    const area = getArea(polygon); // Calculate area of the polygon geometry | ຄໍານວນພື້ນທີ່ຂອງເລຂາຄະນິດຮູບຫຼາຍຫຼ່ຽມ
    let output;
    if (area > 10000) {
      output = Math.round((area / 1000000) * 100) / 100 + " km²"; // Convert to square kilometers if greater than 10000m² | ປ່ຽນເປັນຕາລາງກິໂລແມັດ ຖ້າຫຼາຍກວ່າ 10000m²
    } else {
      output = Math.round(area * 100) / 100 + " m²"; // Display in square meters otherwise | ສະແດງເປັນຕາລາງແມັດ ຖ້າບໍ່ດັ່ງນັ້ນ
    }
    return output;
  };

  // useEffect hook for map initialization and setup (runs once on component mount) | useEffect hook ສໍາລັບການເລີ່ມຕົ້ນ ແລະການຕັ້ງຄ່າແຜນທີ່ (ແລ່ນເທື່ອດຽວເມື່ອອົງປະກອບຖືກ mount)
  useEffect(() => {
    // Base map layers | ກໍານົດຊັ້ນຂໍ້ມູນແຜນທີ່ພື້ນຖານ
    const baseLayers = {
      osm: new TileLayer({
        source: new OSM(), // Open Street Map tile source | ແຫຼ່ງຂໍ້ມູນໄທລ໌ Open Street Map
        name: "osm", // Added name for easier access | ກໍານົດຊື່ເພື່ອຄວາມສະດວກໃນການເອີ້ນຄືນພາຍຫຼັງ
      }),
      satellite: new TileLayer({
        source: new XYZ({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", // ArcGIS World Imagery | ຮູບພາບດາວທຽມ ArcGIS World Imagery
        }),
        name: "satellite", // Added name for easier access | ກໍານົດຊື່
      }),
    };

    // Vector layer for drawings | ຊັ້ນຂໍ້ມູນ vector ສໍາລັບການສະແດງຜົນການແຕ້ມຂອງຜູ້ໃຊ້
    const vectorLayer = new VectorLayer({
      source: vectorSource.current, // Use the shared vector source | ໃຊ້ແຫຼ່ງຂໍ້ມູນ vector ທີ່ແບ່ງປັນ
      style: new Style({
        // Define default style for drawn features | ກໍານົດສະຕາຍເລີ່ມຕົ້ນສໍາລັບຄຸນສົມບັດທີ່ແຕ້ມ
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.2)",
        }),
        stroke: new Stroke({
          color: "#ffcc33",
          width: 2,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: "#ffcc33",
          }),
        }),
      }),
      name: "vectorLayer", // Assign a name | ກໍານົດຊື່
    });

    // Measurement layer | ຊັ້ນຂໍ້ມູນ vector ສໍາລັບການສະແດງຜົນຄຸນສົມບັດການວັດແທກ (ແຕກຕ່າງຈາກການແຕ້ມທົ່ວໄປ)
    const measureLayer = new VectorLayer({
      source: measureSource.current, // Use the shared measurement source | ໃຊ້ແຫຼ່ງຂໍ້ມູນການວັດແທກທີ່ແບ່ງປັນ
      style: new Style({
        // Define style for measurement features | ກໍານົດສະຕາຍສໍາລັບຄຸນສົມບັດການວັດແທກ
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.2)",
        }),
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.5)",
          lineDash: [10, 10],
          width: 2,
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.7)",
          }),
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)",
          }),
        }),
      }),
      name: "measureLayer", // Assign a name | ກໍານົດຊື່
    });

    // Initialize the OpenLayers Map | ເລີ່ມຕົ້ນແຜນທີ່ OpenLayers
    olMap.current = new Map({
      target: mapRef.current, // Link the map to the div element using the ref | ເຊື່ອມຕໍ່ແຜນທີ່ກັບອົງປະກອບ div ໂດຍໃຊ້ ref
      layers: [baseLayers.osm, baseLayers.satellite, vectorLayer, measureLayer], // Add all base layers, vector, and measure layers
      view: new View({
        center: fromLonLat([102.6, 17.97]), // Set initial map center to Laos (convert LonLat to map projection) | ກໍານົດຈຸດກາງແຜນທີ່ເບື້ອງຕົ້ນຢູ່ລາວ (ປ່ຽນ LonLat ເປັນການຄາດຄະເນແຜນທີ່)
        zoom: 7, // Set initial zoom level | ກໍານົດລະດັບການຊູມເບື້ອງຕົ້ນ
      }),
    });

    setMapInstance(olMap.current); // Pass the initialized map instance to the parent component | ສົ່ງອິນສະແຕນແຜນທີ່ທີ່ເລີ່ມຕົ້ນໄປຫາອົງປະກອບຫຼັກ
    setOpenLayersLoaded(true); // Indicate that OpenLayers map is loaded

    // Apply initial layer visibility and opacity
    olMap.current.getAllLayers().forEach((layer) => {
      const layerName = layer.get("name");
      if (layerStates[layerName]) {
        layer.setVisible(layerStates[layerName].visible);
        layer.setOpacity(layerStates[layerName].opacity);
      }
    });

    // Mouse position tracking | ຕົວຮັບຟັງເຫດການສໍາລັບການເຄື່ອນໄຫວຕົວຊີ້ເມົ້າເພື່ອສະແດງພິກັດ
    olMap.current.on("pointermove", function (evt) {
      if (evt.dragging) return; // Do not update coordinates if dragging the map | ຢ່າອັບເດດພິກັດຖ້າກໍາລັງລາກແຜນທີ່
      const coordinate = toLonLat(evt.coordinate); // Convert map coordinate to LonLat | ປ່ຽນພິກັດແຜນທີ່ເປັນ LonLat
      document.getElementById("coordinates").textContent = // Update the HTML element with the current LonLat coordinates | ອັບເດດອົງປະກອບ HTML ດ້ວຍພິກັດ LonLat ປັດຈຸບັນ
        coordinate[0].toFixed(4) + ", " + coordinate[1].toFixed(4);
    });

    // Update scale display | ຕົວຮັບຟັງເຫດການສໍາລັບການປ່ຽນແປງຄວາມລະອຽດຂອງ view ເພື່ອອັບເດດຂະໜາດແຜນທີ່
    olMap.current.getView().on("change:resolution", function () {
      const resolution = olMap.current.getView().getResolution(); // Get current map resolution | ເອົາຄວາມລະອຽດແຜນທີ່ປັດຈຸບັນ
      const units = olMap.current.getView().getProjection().getUnits(); // Get map projection units | ເອົາຫົວໜ່ວຍການຄາດຄະເນແຜນທີ່
      const dpi = 25.4 / 0.28; // Standard DPI for screen calculation | DPI ມາດຕະຖານສໍາລັບການຄໍານວນໜ້າຈໍ
      const mpu = METERS_PER_UNIT[units]; // Calculate meters per unit based on the projection units | ຄໍານວນແມັດຕໍ່ຫົວໜ່ວຍໂດຍອີງໃສ່ຫົວໜ່ວຍການຄາດຄະເນ
      const scale = resolution * mpu * 39.37 * dpi; // Calculate the map scale | ຄໍານວນຂະໜາດແຜນທີ່
      document.getElementById("scale").textContent = // Update the HTML element with the calculated scale | ອັບເດດອົງປະກອບ HTML ດ້ວຍຂະໜາດທີ່ຄໍານວນໄດ້
        "1:" + Math.round(scale).toLocaleString();
    });

    // Selection interaction | ເລີ່ມຕົ້ນການໂຕ້ຕອບ Select ສໍາລັບການເລືອກຄຸນສົມບັດ
    selectInteraction.current = new Select({
      layers: [vectorLayer], // Only allow selection on the vectorLayer | ອະນຸຍາດໃຫ້ເລືອກສະເພາະໃນ vectorLayer ເທົ່ານັ້ນ
      style: new Style({
        // Style for selected features | ສະຕາຍສໍາລັບຄຸນສົມບັດທີ່ເລືອກ
        fill: new Fill({
          color: "rgba(255, 0, 0, 0.3)",
        }),
        stroke: new Stroke({
          color: "#ff0000",
          width: 3,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: "#ff0000",
          }),
        }),
      }),
    });
    olMap.current.addInteraction(selectInteraction.current); // Add the select interaction to the map (it will be active by default until a drawing tool is chosen) | ເພີ່ມການໂຕ້ຕອບການເລືອກໃສ່ແຜນທີ່ (ມັນຈະເປີດໃຊ້ງານໂດຍຄ່າເລີ່ມຕົ້ນຈົນກວ່າຈະເລືອກເຄື່ອງມືແຕ້ມ)

    return () => {
      // Cleanup function: runs when the component unmounts | ຟັງຊັນ cleanup: ແລ່ນເມື່ອອົງປະກອບຖືກ unmount
      olMap.current.setTarget(undefined); // Unset the map target to prevent memory leaks | ຍົກເລີກການກໍານົດເປົ້າໝາຍແຜນທີ່ເພື່ອປ້ອງກັນການຮົ່ວໄຫຼຂອງຫນ່ວຍຄວາມຈໍາ
      olMap.current.dispose(); // Dispose of the map to release resources | ຖິ້ມແຜນທີ່ເພື່ອປົດປ່ອຍຊັບພະຍາກອນ
    };
  }, [setMapInstance, layerStates]); // Added layerStates to dependency array to re-apply visibility/opacity

  // useEffect hook for managing active tools (draw, measure, identify) | useEffect hook ສໍາລັບການຈັດການເຄື່ອງມືທີ່ໃຊ້ງານ (ແຕ້ມ, ວັດແທກ, ລະບຸຕົວຕົນ)
  // This effect runs whenever `activeTool` or `setActiveTool` changes | ຜົນກະທົບນີ້ແລ່ນເມື່ອໃດກໍຕາມທີ່ `activeTool` ຫຼື `setActiveTool` ປ່ຽນແປງ
  useEffect(() => {
    if (!olMap.current) return; // Ensure map is initialized | ຮັບປະກັນວ່າແຜນທີ່ຖືກເລີ່ມຕົ້ນ

    // Remove any existing draw interaction before setting a new one | ລຶບການໂຕ້ຕອບການແຕ້ມທີ່ມີຢູ່ກ່ອນທີ່ຈະຕັ້ງຄ່າໃໝ່
    if (drawInteraction.current) {
      olMap.current.removeInteraction(drawInteraction.current);
      drawInteraction.current = null;
    }

    // Remove select interaction temporarily to ensure proper tool switching | ລຶບການໂຕ້ຕອບການເລືອກຊົ່ວຄາວເພື່ອຮັບປະກັນການປ່ຽນເຄື່ອງມືທີ່ເໝາະສົມ
    if (selectInteraction.current) {
      olMap.current.removeInteraction(selectInteraction.current);
    }

    let newInteraction = null; // Variable to hold the new OpenLayers interaction | ຕົວແປເພື່ອບັນຈຸການໂຕ້ຕອບ OpenLayers ໃໝ່
    let isDrawingTool = false; // Flag to check if the active tool is a drawing tool | ທຸງເພື່ອກວດສອບວ່າເຄື່ອງມືທີ່ໃຊ້ງານເປັນເຄື່ອງມືແຕ້ມຫຼືບໍ່

    // Handler function for the 'identify' tool | ຟັງຊັນ handler ສໍາລັບເຄື່ອງມື 'identify'
    const identifyHandler = (evt) => {
      if (activeTool !== "identify") {
        // Ensure this handler only runs if 'identify' is the activeTool | ຮັບປະກັນວ່າ handler ນີ້ແລ່ນພຽງແຕ່ຖ້າ 'identify' ເປັນ activeTool
        olMap.current.un("singleclick", identifyHandler); // Remove itself if tool changes | ລຶບຕົວເອງ ຖ້າເຄື່ອງມືປ່ຽນ
        return;
      }
      const features = [];
      // Iterate through features at the clicked pixel | ເຮັດຊໍ້າຜ່ານຄຸນສົມບັດຕ່າງໆຢູ່ຈຸດ pixel ທີ່ຄລິກ
      olMap.current.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
        // Only consider features from the 'vectorLayer' | ພິຈາລະນາສະເພາະຄຸນສົມບັດຈາກ 'vectorLayer'
        if (
          layer ===
          olMap.current
            .getAllLayers()
            .find((l) => l.get("name") === "vectorLayer")
        ) {
          features.push(feature);
        }
      });

      if (features.length > 0) {
        const feature = features[0]; // Get the first identified feature | ເອົາຄຸນສົມບັດທີ່ລະບຸຕົວຕົນທໍາອິດ
        const geometry = feature.getGeometry(); // Get its geometry | ເອົາເລຂາຄະນິດຂອງມັນ
        const type = geometry.getType(); // Get its type (Point, LineString, Polygon) | ເອົາປະເພດຂອງມັນ (Point, LineString, Polygon)

        let info = `Feature Type: ${type}\n`; // Start building info string | ເລີ່ມສ້າງສາຍຂໍ້ມູນ

        // Add specific information based on geometry type | ເພີ່ມຂໍ້ມູນສະເພາະໂດຍອີງໃສ່ປະເພດເລຂາຄະນິດ
        if (type === "Point") {
          const coord = toLonLat(geometry.getCoordinates());
          info += `Coordinates: ${coord[0].toFixed(4)}, ${coord[1].toFixed(4)}`;
        } else if (type === "LineString") {
          info += `Length: ${formatLength(geometry)}`;
        } else if (type === "Polygon") {
          info += `Area: ${formatArea(geometry)}`;
        }
        alert(info); // Display the information in an alert | ສະແດງຂໍ້ມູນໃນ alert
      }
    };

    // Switch statement to handle different active tools | ຄໍາສັ່ງ switch ເພື່ອຈັດການເຄື່ອງມືທີ່ໃຊ້ງານທີ່ແຕກຕ່າງກັນ
    switch (activeTool) {
      case "pan":
        // Pan is the default navigation, so no specific interaction is needed here as it's handled by default. | Pan ແມ່ນການນໍາທາງເລີ່ມຕົ້ນ, ດັ່ງນັ້ນບໍ່ຈໍາເປັນຕ້ອງມີການໂຕ້ຕອບສະເພາະຢູ່ທີ່ນີ້ ເພາະມັນຖືກຈັດການໂດຍຄ່າເລີ່ມຕົ້ນ.
        break;
      case "select":
        // If 'select' is active, re-add the select interaction | ຖ້າ 'select' ຖືກໃຊ້ງານ, ເພີ່ມການໂຕ້ຕອບການເລືອກຄືນໃໝ່
        if (selectInteraction.current) {
          olMap.current.addInteraction(selectInteraction.current);
        }
        break;
      case "draw-point":
        newInteraction = new Draw({
          source: vectorSource.current,
          type: "Point",
        });
        isDrawingTool = true; // Mark as drawing tool | ໝາຍວ່າເປັນເຄື່ອງມືແຕ້ມ
        break;
      case "draw-line":
        newInteraction = new Draw({
          source: vectorSource.current,
          type: "LineString",
        });
        isDrawingTool = true;
        break;
      case "draw-polygon":
        newInteraction = new Draw({
          source: vectorSource.current,
          type: "Polygon",
        });
        isDrawingTool = true;
        break;
      case "draw-circle":
        newInteraction = new Draw({
          source: vectorSource.current,
          type: "Circle",
        });
        isDrawingTool = true;
        break;
      case "measure-distance":
        newInteraction = new Draw({
          source: measureSource.current,
          type: "LineString",
          style: new Style({
            // Custom style for measurement features | ສະຕາຍທີ່ກໍາໜົດເອງສໍາລັບຄຸນສົມບັດການວັດແທກ
            fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
            stroke: new Stroke({
              color: "rgba(0, 0, 0, 0.5)",
              lineDash: [10, 10],
              width: 2,
            }),
            image: new CircleStyle({
              radius: 5,
              stroke: new Stroke({ color: "rgba(0, 0, 0, 0.7)" }),
              fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
            }),
          }),
        });
        newInteraction.on("drawend", function (event) {
          // Event listener for when drawing ends for distance measurement | ຕົວຮັບຟັງເຫດການເມື່ອການແຕ້ມສິ້ນສຸດລົງສໍາລັບການວັດແທກໄລຍະຫ່າງ
          const geom = event.feature.getGeometry(); // Get the drawn geometry | ເອົາເລຂາຄະນິດທີ່ແຕ້ມ
          const measurement = formatLength(geom); // Format the length | ຈັດຮູບແບບຄວາມຍາວ
          const tooltipCoord = geom.getLastCoordinate(); // Get coordinate for tooltip | ເອົາພິກັດສໍາລັບ tooltip
          const tooltipElement = document.createElement("div"); // Create tooltip HTML element | ສ້າງອົງປະກອບ HTML ຂອງ tooltip
          tooltipElement.className = "tooltip";
          tooltipElement.innerHTML = measurement;
          const overlay = new Overlay({
            element: tooltipElement,
            offset: [0, -15],
            positioning: "bottom-center",
          });
          olMap.current.addOverlay(overlay); // Add tooltip as an overlay to the map | ເພີ່ມ tooltip ເປັນ overlay ໃສ່ແຜນທີ່
          overlay.setPosition(tooltipCoord); // Position the tooltip | ຈັດຕໍາແໜ່ງ tooltip
          setTimeout(() => setActiveTool("select"), 100); // After drawing, switch back to 'select' tool | ຫຼັງຈາກແຕ້ມແລ້ວ, ປ່ຽນກັບໄປເຄື່ອງມື 'select'
        });
        break;
      case "measure-area":
        newInteraction = new Draw({
          source: measureSource.current,
          type: "Polygon",
          style: new Style({
            // Custom style for area measurement features | ສະຕາຍທີ່ກໍາໜົດເອງສໍາລັບຄຸນສົມບັດການວັດແທກພື້ນທີ່
            fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
            stroke: new Stroke({
              color: "rgba(0, 0, 0, 0.5)",
              lineDash: [10, 10],
              width: 2,
            }),
            image: new CircleStyle({
              radius: 5,
              stroke: new Stroke({ color: "rgba(0, 0, 0, 0.7)" }),
              fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
            }),
          }),
        });
        newInteraction.on("drawend", function (event) {
          // Event listener for when drawing ends for area measurement | ຕົວຮັບຟັງເຫດການເມື່ອການແຕ້ມສິ້ນສຸດລົງສໍາລັບການວັດແທກພື້ນທີ່
          const geom = event.feature.getGeometry(); // Get the drawn geometry | ເອົາເລຂາຄະນິດທີ່ແຕ້ມ
          const measurement = formatArea(geom); // Format the area | ຈັດຮູບແບບພື້ນທີ່
          const tooltipCoord = geom.getInteriorPoint().getCoordinates(); // Get coordinate for tooltip (center of polygon) | ເອົາພິກັດສໍາລັບ tooltip (ຈຸດກາງຂອງຮູບຫຼາຍຫຼ່ຽມ)
          const tooltipElement = document.createElement("div");
          tooltipElement.className = "tooltip";
          tooltipElement.innerHTML = measurement;
          const overlay = new Overlay({
            element: tooltipElement,
            offset: [0, -15],
            positioning: "bottom-center",
          });
          olMap.current.addOverlay(overlay);
          overlay.setPosition(tooltipCoord);
          setTimeout(() => setActiveTool("select"), 100); // After drawing, switch back to 'select' tool | ຫຼັງຈາກແຕ້ມແລ້ວ, ປ່ຽນກັບໄປເຄື່ອງມື 'select'
        });
        break;
      case "identify":
        olMap.current.on("singleclick", identifyHandler); // For 'identify' tool, add a singleclick listener to the map | ສໍາລັບເຄື່ອງມື 'identify', ເພີ່ມຕົວຮັບຟັງ singleclick ໃສ່ແຜນທີ່
        break;
      case "select-features":
        if (selectInteraction.current) {
          olMap.current.addInteraction(selectInteraction.current); // Re-add select interaction if explicitly set to 'select-features' | ເພີ່ມການໂຕ້ຕອບການເລືອກຄືນໃໝ່ ຖ້າຖືກກໍານົດຢ່າງຊັດເຈນເປັນ 'select-features'
        }
        break;
      default:
        break;
    }

    if (newInteraction) {
      olMap.current.addInteraction(newInteraction); // Add the new interaction to the map if one was created | ເພີ່ມການໂຕ້ຕອບໃໝ່ໃສ່ແຜນທີ່ ຖ້າມີການສ້າງ
      drawInteraction.current = newInteraction; // Store the interaction reference | ເກັບການອ້າງອີງການໂຕ້ຕອບ
      if (isDrawingTool) {
        // If it's a drawing tool, switch back to 'select' after draw ends | ຖ້າມັນເປັນເຄື່ອງມືແຕ້ມ, ປ່ຽນກັບໄປ 'select' ຫຼັງຈາກການແຕ້ມສິ້ນສຸດລົງ
        newInteraction.on("drawend", () => {
          setTimeout(() => setActiveTool("select"), 100);
        });
      }
    }

    // Clean up function to remove interactions when tool changes or component unmounts | ຟັງຊັນ cleanup: ລຶບການໂຕ້ຕອບເມື່ອເຄື່ອງມືປ່ຽນແປງຫຼືອົງປະກອບຖືກ unmount
    return () => {
      if (drawInteraction.current) {
        olMap.current.removeInteraction(drawInteraction.current);
        drawInteraction.current = null;
      }
      if (selectInteraction.current) {
        olMap.current.removeInteraction(selectInteraction.current);
      }
      // Remove any identify handler if it was added | ລຶບ handler ການລະບຸຕົວຕົນສະເໝີ ຖ້າມັນຖືກເພີ່ມ
      olMap.current.un("singleclick", identifyHandler);
    };
  }, [activeTool, setActiveTool]); // Dependency array: re-run this effect when activeTool changes | ອາເລການເພິ່ງພາອາໄສ: ແລ່ນຜົນກະທົບນີ້ຄືນໃໝ່ເມື່ອ activeTool ປ່ຽນແປງ

  return (
    <div className="map-container">
      <div ref={mapRef} id="map"></div>{" "}
      {/* The div element where the OpenLayers map will be rendered */}
      {/* Add the CoordinateBar component here */}
      {olMap.current && <CoordinateBar map={olMap.current} />}{" "}
      {/* Pass the OpenLayers map instance to CoordinateBar */}
      {/* Integrate the Sidebar component */}
      {olMap.current && ( // Only render Sidebar if map is initialized
        <Sidebar
          openLayersLoaded={openLayersLoaded}
          onProvinceSelectForMap={onProvinceSelectForMap}
          layerStates={layerStates}
          onVisibilityChange={onVisibilityChange}
          onOpacityChange={onOpacityChange}
          districts={districts}
          toggleDistrict={toggleDistrict}
          handleLoadData={handleLoadData}
          handleDistrictOpacityChange={handleDistrictOpacityChange}
          selectedProvinceForDistricts={selectedProvinceForDistricts}
        />
      )}
    </div>
  );
};

export default MapComponent; // Export the component for use in other parts of the application | ສົ່ງອອກອົງປະກອບສໍາລັບການນໍາໃຊ້ໃນສ່ວນອື່ນໆຂອງແອັບພລິເຄຊັນ
