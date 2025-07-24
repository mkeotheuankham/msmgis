// src/utils/snappingHelpers.js
import { MultiPoint } from "ol/geom";
import Feature from "ol/Feature";
import { Style, RegularShape, Fill, Stroke } from "ol/style";

/**
 * ສ້າງ Style ສຳລັບຈຸດ snap.
 */
export const snapStyle = new Style({
  image: new RegularShape({
    fill: new Fill({ color: "rgba(255, 132, 31, 0.9)" }), // ສີສົ້ມ
    stroke: new Stroke({ width: 1, color: "#ffffff" }),
    points: 4,
    radius: 6,
    radius2: 0,
    angle: Math.PI / 4,
  }),
});

/**
 * ຊອກຫາ features ທີ່ຢູ່ໃກ້ກັບ coordinate ທີ່ໃຫ້ມາທີ່ສຸດ.
 * @param {import("ol/coordinate").Coordinate} coordinate - Coordinate ຂອງເມົ້າ.
 * @param {import("ol/source/Vector").default} source - Source ທີ່ຈະຄົ້ນຫາ.
 * @returns {import("ol/Feature").default | null} Feature ທີ່ຢູ່ໃກ້ທີ່ສຸດ.
 */
export const getClosestFeature = (coordinate, source) => {
  return source.getClosestFeatureToCoordinate(coordinate);
};

/**
 * ສ້າງຈຸດ snap (vertices) ຈາກ geometry ຂອງ feature.
 * @param {import("ol/Feature").default} feature - Feature ທີ່ຈະເອົາ vertices ມາ.
 * @returns {import("ol/Feature").default | null} Feature ໃໝ່ທີ່ມີ MultiPoint geometry ຂອງຈຸດ snap.
 */
export const createSnapPoints = (feature) => {
  if (!feature) return null;
  const geometry = feature.getGeometry();
  let coordinates = [];

  const type = geometry.getType();
  if (type === "Polygon") {
    coordinates = geometry.getCoordinates()[0]; // ເອົາແຕ່ outer ring
  } else if (type === "LineString") {
    coordinates = geometry.getCoordinates();
  } else if (type === "Point") {
    coordinates = [geometry.getCoordinates()];
  } else {
    return null;
  }

  if (coordinates.length > 0) {
    const snapGeometry = new MultiPoint(coordinates);
    const snapFeature = new Feature(snapGeometry);
    snapFeature.setStyle(snapStyle);
    return snapFeature;
  }

  return null;
};
