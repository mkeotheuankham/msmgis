import { useEffect } from "react";
import proj4 from "proj4";

/**
 * Custom hook to set up all necessary coordinate system projections using proj4.
 * This includes WGS84, Indian 1975, and Lao 1997 datums.
 * This should be used once in the main App component.
 */
const useCoordinateSetup = () => {
  useEffect(() => {
    // Define all projections used in the application
    proj4.defs([
      // Geographic Coordinate Systems
      ["EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs"],
      [
        "EPSG:4240",
        "+title=Indian 1975 +proj=longlat +ellps=evrst30 +towgs84=214,836,303,0,0,0,0 +no_defs",
      ],
      [
        "EPSG:4674",
        "+title=Lao 1997 +proj=longlat +ellps=krass +towgs84=-46.012,127.108,38.131,0,0,0,0 +no_defs",
      ],

      // WGS84 UTM Zones
      ["WGS84_UTM47N", "+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs"],
      ["WGS84_UTM48N", "+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs"],

      // Indian 1975 UTM Zones
      [
        "INDIAN1975_UTM47N",
        "+proj=utm +zone=47 +ellps=evrst30 +towgs84=214,836,303,0,0,0,0 +units=m +no_defs",
      ],
      [
        "INDIAN1975_UTM48N",
        "+proj=utm +zone=48 +ellps=evrst30 +towgs84=214,836,303,0,0,0,0 +units=m +no_defs",
      ],

      // Lao 1997 UTM Zones
      [
        "LAO1997_UTM47N",
        "+proj=utm +zone=47 +ellps=krass +towgs84=-46.012,127.108,38.131,0,0,0,0 +units=m +no_defs",
      ],
      [
        "LAO1997_UTM48N",
        "+proj=utm +zone=48 +ellps=krass +towgs84=-46.012,127.108,38.131,0,0,0,0 +units=m +no_defs",
      ],
    ]);

    console.log("All coordinate systems initialized.");
  }, []); // Empty dependency array ensures this runs only once on mount
};

export default useCoordinateSetup;
