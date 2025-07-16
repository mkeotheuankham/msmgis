import React, { useState, useCallback, useEffect } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import OlPolygon from "ol/geom/Polygon";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import { fromLonLat } from "ol/proj";
import Select from "ol/interaction/Select";

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
  Layers,
  ScanSearch,
  Fullscreen,
  Target,
} from "lucide-react";

const RibbonToolbar = ({
  activeTool,
  setActiveTool,
  mapInstance,
  activeTab,
  setActiveTab,
  isPanelVisible,
  setIsPanelVisible,
}) => {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const vectorSource = React.useRef(new VectorSource());

  const getLayerByName = useCallback(
    (name) => {
      if (!mapInstance) return null;
      let layerFound = null;
      mapInstance.getLayers().forEach((layer) => {
        if (layer.get("name") === name) {
          layerFound = layer;
        }
      });
      return layerFound;
    },
    [mapInstance]
  );

  useEffect(() => {
    if (!mapInstance) return;

    let existingVectorLayer = getLayerByName("bufferLayer");
    if (!existingVectorLayer) {
      const newVectorLayer = new VectorLayer({
        source: vectorSource.current,
        name: "bufferLayer",
        style: new Style({
          fill: new Fill({ color: "rgba(0, 255, 0, 0.2)" }),
          stroke: new Stroke({ color: "#00ff00", width: 2, lineDash: [5, 5] }),
        }),
      });
      mapInstance.addLayer(newVectorLayer);
    }
  }, [mapInstance, getLayerByName]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleToolClick = useCallback(
    (tool) => {
      setActiveTool(tool);
    },
    [setActiveTool]
  );

  const handleClearMap = useCallback(() => {
    if (mapInstance) {
      const vectorLayer = getLayerByName("vectorLayer");
      if (vectorLayer) vectorLayer.getSource().clear();
      const measureLayer = getLayerByName("measureLayer");
      if (measureLayer) measureLayer.getSource().clear();
      const bufferLayer = getLayerByName("bufferLayer");
      if (bufferLayer) bufferLayer.getSource().clear();
      mapInstance.getOverlays().clear();
    }
  }, [mapInstance, getLayerByName]);

  const handleZoomIn = useCallback(() => {
    if (mapInstance) {
      const view = mapInstance.getView();
      view.setZoom(view.getZoom() + 1);
    }
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    if (mapInstance) {
      const view = mapInstance.getView();
      view.setZoom(view.getZoom() - 1);
    }
  }, [mapInstance]);

  const handleZoomToLayer = useCallback(() => {
    if (mapInstance) {
      const vectorLayer = getLayerByName("vectorLayer");
      if (vectorLayer && vectorLayer.getSource().getFeatures().length > 0) {
        const view = mapInstance.getView();
        view.fit(vectorLayer.getSource().getExtent(), {
          padding: [50, 50, 50, 50],
          duration: 1000,
        });
      }
    }
  }, [mapInstance, getLayerByName]);

  const handleFullExtent = useCallback(() => {
    if (mapInstance) {
      const view = mapInstance.getView();
      view.animate({
        center: fromLonLat([102.6, 17.97]),
        zoom: 7,
        duration: 1000,
      });
    }
  }, [mapInstance]);

  const handleBuffer = useCallback(() => {
    if (!mapInstance || !selectedFeature) {
      alert("Please select a feature on the map first.");
      return;
    }
    const bufferDistanceInput = prompt("Enter buffer distance in meters:");
    const bufferDistanceInMeters = parseFloat(bufferDistanceInput);

    if (isNaN(bufferDistanceInMeters) || bufferDistanceInMeters <= 0) {
      alert("Invalid buffer distance. Please enter a positive number.");
      return;
    }

    const geometry = selectedFeature.getGeometry();
    let bufferPolygon;
    vectorSource.current.clear();

    if (geometry.getType() === "Point") {
      bufferPolygon = OlPolygon.circular(
        geometry,
        bufferDistanceInMeters,
        64
      ).transform("EPSG:4326", mapInstance.getView().getProjection());
    } else {
      alert("Buffering is currently supported only for Point features.");
      return;
    }

    const bufferFeature = new Feature(bufferPolygon);
    vectorSource.current.addFeature(bufferFeature);
  }, [mapInstance, selectedFeature]);

  useEffect(() => {
    if (mapInstance) {
      const select = mapInstance
        .getInteractions()
        .getArray()
        .find((interaction) => interaction instanceof Select);

      if (select) {
        select.on("select", (event) => {
          if (event.selected.length > 0) {
            setSelectedFeature(event.selected[0]);
          } else {
            setSelectedFeature(null);
          }
        });
      }
    }
  }, [mapInstance]);

  const RibbonButton = ({ icon, label, toolName, onClick, isActive }) => {
    const buttonIsActive = isActive || activeTool === toolName;
    return (
      <button
        className={`ribbon-button ${buttonIsActive ? "active" : ""}`}
        onClick={onClick || (() => handleToolClick(toolName))}
        title={label}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="ribbon-toolbar">
      <div className="ribbon-tabs">
        <button
          className={`ribbon-tab ${activeTab === "home" ? "active" : ""}`}
          onClick={() => handleTabClick("home")}
        >
          Home (ໜ້າຫຼັກ)
        </button>
        <button
          className={`ribbon-tab ${activeTab === "map" ? "active" : ""}`}
          onClick={() => handleTabClick("map")}
        >
          Map (ແຜນທີ່)
        </button>
        <button
          className={`ribbon-tab ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => handleTabClick("analysis")}
        >
          Analysis (ການວິເຄາະ)
        </button>
      </div>

      <div className="ribbon-content">
        {activeTab === "home" && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                <RibbonButton
                  icon={<Hand size={18} />}
                  label="Pan (ເລື່ອນ)"
                  toolName="pan"
                />
                <RibbonButton
                  icon={<MousePointer size={18} />}
                  label="Select (ເລືອກ)"
                  toolName="select"
                />
                <RibbonButton
                  icon={<Eraser size={18} />}
                  label="Clear Map (ລຶບແຜນທີ່)"
                  onClick={handleClearMap}
                />
              </div>
              <div className="ribbon-group-title">
                Map Tools (ເຄື່ອງມືແຜນທີ່)
              </div>
            </div>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                <RibbonButton
                  icon={<MapPin size={18} />}
                  label="Point (ຈຸດ)"
                  toolName="draw-point"
                />
                <RibbonButton
                  icon={<PenLine size={18} />}
                  label="Line (ເສັ້ນ)"
                  toolName="draw-line"
                />
                <RibbonButton
                  icon={<Hexagon size={18} />}
                  label="Polygon (ຮູບຫຼາຍຫຼ່ຽມ)"
                  toolName="draw-polygon"
                />
                <RibbonButton
                  icon={<Circle size={18} />}
                  label="Circle (ວົງມົນ)"
                  toolName="draw-circle"
                />
              </div>
              <div className="ribbon-group-title">Draw (ແຕ້ມ)</div>
            </div>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                <RibbonButton
                  icon={<Ruler size={18} />}
                  label="Distance (ໄລຍະທາງ)"
                  toolName="measure-distance"
                />
                <RibbonButton
                  icon={<LandPlot size={18} />}
                  label="Area (ພື້ນທີ່)"
                  toolName="measure-area"
                />
                <RibbonButton
                  icon={<Info size={18} />}
                  label="Identify (ລະບຸ)"
                  toolName="identify"
                />
              </div>
              <div className="ribbon-group-title">Measure (ວັດແທກ)</div>
            </div>
          </>
        )}

        {activeTab === "map" && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                <RibbonButton
                  icon={<ZoomIn size={18} />}
                  label="Zoom In (ຊູມເຂົ້າ)"
                  onClick={handleZoomIn}
                />
                <RibbonButton
                  icon={<ZoomOut size={18} />}
                  label="Zoom Out (ຊູມອອກ)"
                  onClick={handleZoomOut}
                />
                <RibbonButton
                  icon={<ScanSearch size={18} />}
                  label="Zoom to Layer (ຊູມໄປທີ່ Layer)"
                  onClick={handleZoomToLayer}
                />
                <RibbonButton
                  icon={<Fullscreen size={18} />}
                  label="Full Extent (ຂອບເຂດເຕັມ)"
                  onClick={handleFullExtent}
                />
              </div>
              <div className="ribbon-group-title">Navigation (ການນຳທາງ)</div>
            </div>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                <RibbonButton
                  icon={<Layers size={18} />}
                  label="Layers Panel"
                  isActive={isPanelVisible}
                  onClick={() => setIsPanelVisible((prev) => !prev)}
                />
              </div>
              <div className="ribbon-group-title">View</div>
            </div>
          </>
        )}

        {activeTab === "analysis" && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-buttons">
                <RibbonButton
                  icon={<Target size={18} />}
                  label="Buffer (ເຂດກັນຊົນ)"
                  onClick={handleBuffer}
                />
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
