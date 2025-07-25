import { useEffect, useRef } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Stroke, Text, Fill } from "ol/style";
import { transform, transformExtent, toLonLat } from "ol/proj";
import { getCenter } from "ol/extent";
import Feature from "ol/Feature";
import { Point, Polygon } from "ol/geom";
import { unByKey } from "ol/Observable";

const CustomUtmGrid = ({ map, isVisible }) => {
  const gridLayerRef = useRef(null);
  const gridSourceRef = useRef(new VectorSource());

  // Function to get the custom grid label
  const getGridLabel = (easting, northing) => {
    const letterCode = String.fromCharCode(
      65 + (Math.floor(easting / 100000) % 26)
    );
    const eastingLabel = Math.floor((easting % 1000000) / 1000);
    const northingLabel = Math.floor((northing % 1000000) / 1000);
    return `${letterCode}-${eastingLabel}-${northingLabel}`;
  };

  useEffect(() => {
    if (!map) return;

    // Create the layer for our custom grid
    gridLayerRef.current = new VectorLayer({
      source: gridSourceRef.current,
      style: (feature) => feature.get("style"),
      zIndex: 997, // Below the main UTM grid
    });
    map.addLayer(gridLayerRef.current);

    const layerToRemove = gridLayerRef.current;

    return () => {
      if (map && layerToRemove) {
        map.removeLayer(layerToRemove);
      }
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const gridSource = gridSourceRef.current;

    const updateGrid = () => {
      if (!isVisible) {
        gridSource.clear();
        return;
      }

      const view = map.getView();
      const zoom = view.getZoom();

      if (zoom < 12) {
        gridSource.clear();
        return;
      }

      gridSource.clear();

      const projection = view.getProjection();
      const extent = view.calculateExtent(map.getSize());
      const centerLonLat = toLonLat(getCenter(extent), projection);

      const zone = Math.floor((centerLonLat[0] + 180) / 6) + 1;
      if (centerLonLat[1] < 0 || (zone !== 47 && zone !== 48)) return;

      const utmProjection = `EPSG:326${zone}`;
      const utmExtent = transformExtent(extent, projection, utmProjection);

      const interval = 2000;
      const newFeatures = [];

      const gridLineStyle = new Style({
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.3)",
          width: 1,
        }),
      });

      // **ແກ້ໄຂ:** ປັບຂະໜາດ font ໃຫ້ໃຫຍ່ຂຶ້ນ
      const textStyle = new Style({
        text: new Text({
          font: "bold 12px Arial", // ປັບຂະໜາດ font ຢູ່ບ່ອນນີ້
          fill: new Fill({ color: "#333" }),
          stroke: new Stroke({ color: "rgba(255,255,255,0.9)", width: 3 }),
          overflow: true,
        }),
      });

      const startEasting = Math.floor(utmExtent[0] / interval) * interval;
      const startNorthing = Math.floor(utmExtent[1] / interval) * interval;
      const endEasting = Math.ceil(utmExtent[2] / interval) * interval;
      const endNorthing = Math.ceil(utmExtent[3] / interval) * interval;

      for (let e = startEasting; e <= endEasting; e += interval) {
        for (let n = startNorthing; n <= endNorthing; n += interval) {
          const coords = [
            [e, n],
            [e + interval, n],
            [e + interval, n + interval],
            [e, n + interval],
            [e, n],
          ];
          const transformedCoords = coords.map((coord) =>
            transform(coord, utmProjection, projection)
          );

          const gridCell = new Feature(new Polygon([transformedCoords]));
          gridCell.setStyle(gridLineStyle);
          newFeatures.push(gridCell);

          const labelText = getGridLabel(e, n);
          const labelStyle = textStyle.clone();
          labelStyle.getText().setText(labelText);

          const centerCoord = transform(
            [e + interval / 2, n + interval / 2],
            utmProjection,
            projection
          );
          const labelFeature = new Feature(new Point(centerCoord));
          labelFeature.setStyle(labelStyle);
          newFeatures.push(labelFeature);
        }
      }
      gridSource.addFeatures(newFeatures);
    };

    const listenerKey = map.on("moveend", updateGrid);
    updateGrid();

    return () => {
      unByKey(listenerKey);
      if (gridSource) {
        gridSource.clear();
      }
    };
  }, [map, isVisible]);

  return null;
};

export default CustomUtmGrid;
