import { useEffect } from "react";
import { toLonLat, transform, transformExtent, METERS_PER_UNIT } from "ol/proj";
import { getCenter } from "ol/extent";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import { Style, Stroke, Text, Fill } from "ol/style";
import Graticule from "ol/layer/Graticule";

export const useMapGraticule = (
  olMap,
  graticuleEnabled,
  graticuleType,
  utmLabelSource,
  utmGridLineSource,
  graticuleLayer
) => {
  useEffect(() => {
    if (!olMap.current) return;
    const map = olMap.current;
    const pointerMoveHandler = (evt) => {
      if (evt.dragging) return;
      const coordinatesElement = document.getElementById("coordinates");
      if (!coordinatesElement) return;
      let displayText = "";
      if (graticuleType === "UTM") {
        const lonLat = toLonLat(evt.coordinate);
        const zone = Math.floor((lonLat[0] + 180) / 6) + 1;
        if (lonLat[1] >= 0 && (zone === 47 || zone === 48)) {
          const utmProjection = `EPSG:326${zone}`;
          const utmCoords = transform(
            evt.coordinate,
            "EPSG:3857",
            utmProjection
          );
          displayText = `Zone ${zone}N ${utmCoords[0].toFixed(
            0
          )}m E ${utmCoords[1].toFixed(0)}m N`;
        } else {
          displayText = "UTM Zone N/A";
        }
      } else {
        const coord = toLonLat(evt.coordinate);
        displayText = `${coord[1].toFixed(4)}°, ${coord[0].toFixed(4)}°`;
      }
      coordinatesElement.textContent = displayText;
    };
    const resolutionChangeHandler = () => {
      const scaleElement = document.getElementById("scale");
      if (!scaleElement) return;
      const resolution = map.getView().getResolution();
      const units = map.getView().getProjection().getUnits();
      const dpi = 25.4 / 0.28;
      const mpu = METERS_PER_UNIT[units];
      const scale = resolution * mpu * 39.37 * dpi;
      scaleElement.textContent = "1:" + Math.round(scale).toLocaleString();
    };
    map.on("pointermove", pointerMoveHandler);
    map.getView().on("change:resolution", resolutionChangeHandler);
    resolutionChangeHandler();
    return () => {
      map.un("pointermove", pointerMoveHandler);
      map.getView().un("change:resolution", resolutionChangeHandler);
    };
  }, [graticuleType, olMap]);

  useEffect(() => {
    if (!olMap.current) return;
    const map = olMap.current;
    const updateUtmGrid = () => {
      utmLabelSource.current.clear();
      utmGridLineSource.current.clear();
      const view = map.getView();
      const projection = view.getProjection();
      const extent = view.calculateExtent(map.getSize());
      const centerLonLat = toLonLat(getCenter(extent));
      const zone = Math.floor((centerLonLat[0] + 180) / 6) + 1;
      if (centerLonLat[1] < 0 || (zone !== 47 && zone !== 48)) return;
      const utmProjection = `EPSG:326${zone}`;
      const utmExtent = transformExtent(extent, projection, utmProjection);

      const dynamicInterval = Math.pow(
        10,
        Math.floor(Math.log10(view.getResolution() * 500))
      );
      const interval = Math.max(2000, dynamicInterval);

      const labelFeatures = [];
      const lineFeatures = [];
      const textStyle = {
        font: "11px Arial",
        fill: new Fill({ color: "#444" }),
        stroke: new Stroke({ color: "rgba(255,255,255,0.8)", width: 2 }),
      };
      for (
        let n = Math.ceil(utmExtent[1] / interval) * interval;
        n <= utmExtent[3];
        n += interval
      ) {
        labelFeatures.push(
          new Feature({
            style: new Style({
              text: new Text({
                ...textStyle,
                text: `${n.toLocaleString()} N`,
                textAlign: "left",
                offsetX: 5,
              }),
            }),
            geometry: new Point(
              transform([utmExtent[0], n], utmProjection, projection)
            ),
          })
        );
        lineFeatures.push(
          new Feature({
            geometry: new LineString([
              transform([utmExtent[0], n], utmProjection, projection),
              transform([utmExtent[2], n], utmProjection, projection),
            ]),
          })
        );
      }
      for (
        let e = Math.ceil(utmExtent[0] / interval) * interval;
        e <= utmExtent[2];
        e += interval
      ) {
        labelFeatures.push(
          new Feature({
            style: new Style({
              text: new Text({
                ...textStyle,
                text: `${e.toLocaleString()} E`,
                textBaseline: "bottom",
                offsetY: -5,
              }),
            }),
            geometry: new Point(
              transform([e, utmExtent[1]], utmProjection, projection)
            ),
          })
        );
        lineFeatures.push(
          new Feature({
            geometry: new LineString([
              transform([e, utmExtent[1]], utmProjection, projection),
              transform([e, utmExtent[3]], utmProjection, projection),
            ]),
          })
        );
      }
      utmLabelSource.current.addFeatures(labelFeatures);
      utmGridLineSource.current.addFeatures(lineFeatures);
    };
    const cleanup = () => {
      if (graticuleLayer.current) {
        map.removeLayer(graticuleLayer.current);
        graticuleLayer.current = null;
      }
      utmLabelSource.current.clear();
      utmGridLineSource.current.clear();
      map.un("moveend", updateUtmGrid);
    };
    cleanup();
    if (graticuleEnabled) {
      if (graticuleType === "UTM") {
        map.on("moveend", updateUtmGrid);
        updateUtmGrid();
      } else {
        graticuleLayer.current = new Graticule({
          strokeStyle: new Stroke({
            color: "rgba(255, 120, 0, 0.9)",
            width: 2,
            lineDash: [4, 4],
          }),
          showLabels: true,
          wrapX: false,
          lonLabelStyle: new Text({
            font: '12px "Open Sans"',
            fill: new Fill({ color: "rgba(230,230,230,1)" }),
            stroke: new Stroke({ color: "rgba(0,0,0,1)", width: 2 }),
          }),
          latLabelStyle: new Text({
            font: '12px "Open Sans"',
            fill: new Fill({ color: "rgba(230,230,230,1)" }),
            stroke: new Stroke({ color: "rgba(0,0,0,1)", width: 2 }),
          }),
        });
        map.addLayer(graticuleLayer.current);
        graticuleLayer.current.setZIndex(999);
      }
    }
    return cleanup;
  }, [
    graticuleEnabled,
    graticuleType,
    olMap,
    utmLabelSource,
    utmGridLineSource,
    graticuleLayer,
  ]);
};
