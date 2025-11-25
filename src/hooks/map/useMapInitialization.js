import { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { fromLonLat } from "ol/proj";
import { Style, Stroke, Circle as CircleStyle } from "ol/style";

export const useMapInitialization = (
  setMapInstance,
  historyManagerRef,
  updateHistoryButtons
) => {
  const mapRef = useRef();
  const olMap = useRef(null);
  const vectorLayerRef = useRef(null);
  const selectionMeasureLayerRef = useRef(null);
  const utmLabelSource = useRef(new VectorSource());
  const utmGridLineSource = useRef(new VectorSource());
  const graticuleLayer = useRef(null); // Keep track of graticule layer if needed here or in useMapGraticule

  useEffect(() => {
    vectorLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      name: "editorLayer",
    });

    selectionMeasureLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      name: "selectionMeasureLayer",
      style: new Style({
        image: new CircleStyle({ radius: 0 }),
        stroke: new Stroke({ width: 0 }),
      }),
      zIndex: 1001,
    });

    const utmLabelLayer = new VectorLayer({
      source: utmLabelSource.current,
      style: (feature) => feature.get("style"),
      name: "utmLabelLayer",
      zIndex: 1000,
    });
    const utmGridLineLayer = new VectorLayer({
      source: utmGridLineSource.current,
      style: new Style({
        stroke: new Stroke({
          color: "rgba(255, 120, 0, 0.8)",
          width: 2,
          lineDash: [4, 4],
        }),
      }),
      name: "utmGridLineLayer",
      zIndex: 998,
    });

    olMap.current = new Map({
      target: mapRef.current,
      layers: [
        vectorLayerRef.current,
        selectionMeasureLayerRef.current,
        utmGridLineLayer,
        utmLabelLayer,
      ],
      view: new View({ center: fromLonLat([102.6, 17.97]), zoom: 7 }),
      controls: [],
      contextOptions: { willReadFrequently: true },
    });

    setMapInstance(olMap.current);

    if (historyManagerRef.current) {
      historyManagerRef.current.addState([]);
      updateHistoryButtons();
    }

    return () => {
      if (olMap.current) {
        olMap.current.setTarget(undefined);
        olMap.current.dispose();
      }
    };
  }, [setMapInstance, historyManagerRef, updateHistoryButtons]);

  return {
    mapRef,
    olMap,
    vectorLayerRef,
    selectionMeasureLayerRef,
    utmLabelSource,
    utmGridLineSource,
    graticuleLayer,
  };
};
