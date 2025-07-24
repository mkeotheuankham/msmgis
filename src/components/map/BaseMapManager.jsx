import { useEffect } from "react";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";

// ຄຳນິຍາມຂອງ basemaps ທັງໝົດ (ສະບັບອັບເດດ)
const baseLayerDefinitions = [
  {
    name: "osm",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    visible: true,
  },
  {
    name: "satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    visible: false,
  },
  {
    name: "topo",
    url: "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.jpg",
    maxZoom: 20,
    attributions: [
      "© CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data)",
      '© <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>',
      '© <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>',
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ].join(" | "),
    visible: false,
  },
  {
    name: "googleSatellite",
    url: "https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}",
    visible: false,
  },
  {
    name: "googleHybrid",
    url: "https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}",
    visible: false,
  },
  {
    name: "carto",
    url: "https://{a-d}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
    visible: false,
  },
];

const BaseMapManager = ({ map, baseLayerStates }) => {
  // Effect ນີ້ຈະເຮັດວຽກພຽງຄັ້ງດຽວເພື່ອສ້າງ ແລະ ເພີ່ມ basemaps ເຂົ້າໄປໃນແຜນທີ່
  useEffect(() => {
    if (!map) return;

    // **ແກ້ໄຂ:** ປັບປຸງການສ້າງ layer ໃຫ້ຮອງຮັບ attributions ແລະ maxZoom
    const layers = baseLayerDefinitions.map(
      (def) =>
        new TileLayer({
          source: new XYZ({
            url: def.url,
            attributions: def.attributions, // ສົ່ງ attributions ໄປໃຫ້ source
          }),
          name: def.name,
          visible: def.visible,
          zIndex: 0, // ໃຫ້ແນ່ໃຈວ່າ basemaps ຢູ່ລຸ່ມສຸດສະເໝີ
          maxZoom: def.maxZoom, // ສົ່ງ maxZoom ໄປໃຫ້ layer
        })
    );

    // ເພີ່ມ basemaps ເຂົ້າໄປທາງໜ້າຂອງ layers ທັງໝົດ
    const existingLayers = map.getLayers();
    layers.reverse().forEach((layer) => existingLayers.insertAt(0, layer));
  }, [map]);

  // Effect ນີ້ຈະເຮັດວຽກທຸກຄັ້ງທີ່ state ຂອງ basemap ປ່ຽນແປງ (ເປີດ/ປິດ, ຄວາມໂປ່ງໃສ)
  useEffect(() => {
    if (!map || !baseLayerStates) return;

    map.getLayers().forEach((layer) => {
      const layerName = layer.get("name");
      const state = baseLayerStates[layerName];

      if (layer instanceof TileLayer && layerName && state) {
        layer.setVisible(state.visible);
        layer.setOpacity(state.opacity);
      }
    });
  }, [map, baseLayerStates]);

  return null; // Component ນີ້ບໍ່ໄດ້ render UI ໃດໆ
};

export default BaseMapManager;
