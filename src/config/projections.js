// src/config/projections.js

/**
 * ນິຍາມລະບົບພິກັດຕ່າງໆທີ່ໃຊ້ໃນໂຄງການ (Proj4js definitions).
 */
export const projectionDefs = [
  ["EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs"],
  [
    "EPSG:4240",
    "+title=Indian 1975 +proj=longlat +ellps=evrst30 +towgs84=214,836,303,0,0,0,0 +no_defs",
  ],
  [
    "EPSG:4674",
    "+title=Lao 1997 +proj=longlat +ellps=krass +towgs84=-46.012,127.108,38.131,0,0,0,0 +no_defs",
  ],
  ["WGS84_UTM47N", "+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs"],
  ["WGS84_UTM48N", "+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs"],
  [
    "INDIAN1975_UTM47N",
    "+proj=utm +zone=47 +ellps=evrst30 +towgs84=214,836,303,0,0,0,0 +units=m +no_defs",
  ],
  [
    "INDIAN1975_UTM48N",
    "+proj=utm +zone=48 +ellps=evrst30 +towgs84=214,836,303,0,0,0,0 +units=m +no_defs",
  ],
  [
    "LAO1997_UTM47N",
    "+proj=utm +zone=47 +ellps=krass +towgs84=-46.012,127.108,38.131,0,0,0,0 +units=m +no_defs",
  ],
  [
    "LAO1997_UTM48N",
    "+proj=utm +zone=48 +ellps=krass +towgs84=-46.012,127.108,38.131,0,0,0,0 +units=m +no_defs",
  ],
];

/**
 * ລາຍຊື່ລະບົບພິກັດ UTM ທີ່ໃຫ້ຜູ້ໃຊ້ເລືອກ.
 */
export const utmProjections = [
  { key: "WGS84_UTM47N", name: "WGS 84 / UTM zone 47N" },
  { key: "WGS84_UTM48N", name: "WGS 84 / UTM zone 48N" },
  { key: "INDIAN1975_UTM47N", name: "Indian 1975 / UTM zone 47N" },
  { key: "INDIAN1975_UTM48N", name: "Indian 1975 / UTM zone 48N" },
  { key: "LAO1997_UTM47N", name: "Lao 1997 / UTM zone 47N" },
  { key: "LAO1997_UTM48N", name: "Lao 1997 / UTM zone 48N" },
  { key: "EPSG:4326", name: "WGS 84 (Latitude/Longitude)" },
];
