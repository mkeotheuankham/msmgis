import { useState, useCallback } from "react";
import shp from "shpjs";
import { GeoJSON, KML } from "ol/format";
import { fromLonLat, toLonLat } from "ol/proj";
import proj4 from "proj4";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";

/**
 * Custom hook to handle file import and export logic.
 * @param {function} addLayer - Function to add a new layer to the application state.
 * @param {Array} importedLayers - The current list of imported layers.
 * @param {import('ol/Map').default} mapInstance - The OpenLayers map instance.
 * @returns {object} An object containing modal states and file handling functions.
 */
const useFileHandler = (addLayer, importedLayers, mapInstance) => {
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);

  const handleFileImport = useCallback(
    async (file) => {
      if (!file) return;
      const extension = file.name.split(".").pop().toLowerCase();
      const reader = new FileReader();

      reader.onload = async (e) => {
        const content = e.target.result;
        let features = [];
        try {
          if (extension === "csv") {
            const lines = content
              .split("\n")
              .filter((line) => line.trim() !== "");
            const header = lines[0]
              .toLowerCase()
              .split(",")
              .map((h) => h.trim().replace(/"/g, ""));
            const dataLines = lines.slice(1);

            const getIndex = (aliases) =>
              aliases
                .map((alias) => header.indexOf(alias))
                .find((i) => i !== -1) ?? -1;

            const lonIndex = getIndex(["lon", "longitude"]);
            const latIndex = getIndex(["lat", "latitude"]);
            const eastingIndex = getIndex(["easting", "x"]);
            const northingIndex = getIndex(["northing", "y"]);
            const zoneIndex = getIndex(["zone"]);
            const datumIndex = getIndex(["datum"]);

            if (lonIndex !== -1 && latIndex !== -1) {
              // WGS84 Case
              dataLines.forEach((line) => {
                const parts = line.split(",");
                const properties = {};
                header.forEach((h, i) => {
                  properties[h] = parts[i]?.trim();
                });
                const lon = parseFloat(parts[lonIndex]);
                const lat = parseFloat(parts[latIndex]);
                if (!isNaN(lon) && !isNaN(lat)) {
                  features.push(
                    new Feature({
                      geometry: new Point(fromLonLat([lon, lat])),
                      ...properties,
                    })
                  );
                }
              });
            } else if (
              eastingIndex !== -1 &&
              northingIndex !== -1 &&
              zoneIndex !== -1
            ) {
              // UTM Case
              dataLines.forEach((line) => {
                const parts = line.split(",");
                const properties = {};
                header.forEach((h, i) => {
                  properties[h] = parts[i]?.trim();
                });

                const easting = parseFloat(parts[eastingIndex]);
                const northing = parseFloat(parts[northingIndex]);
                const zone = parseInt(parts[zoneIndex], 10);
                const datumName =
                  (datumIndex !== -1
                    ? parts[datumIndex]?.trim().toLowerCase()
                    : "wgs84") || "wgs84";

                if (!isNaN(easting) && !isNaN(northing) && !isNaN(zone)) {
                  let sourceProjection;
                  if (datumName.includes("lao") || datumName.includes("97")) {
                    sourceProjection =
                      zone === 47 ? "LAO1997_UTM47N" : "LAO1997_UTM48N";
                  } else if (datumName.includes("indian")) {
                    sourceProjection =
                      zone === 47 ? "INDIAN1975_UTM47N" : "INDIAN1975_UTM48N";
                  } else {
                    // Default to WGS84
                    sourceProjection =
                      zone === 47 ? "WGS84_UTM47N" : "WGS84_UTM48N";
                  }
                  const wgs84Coords = proj4(sourceProjection, "EPSG:4326", [
                    easting,
                    northing,
                  ]);
                  const mapCoords = fromLonLat(wgs84Coords);
                  features.push(
                    new Feature({
                      geometry: new Point(mapCoords),
                      ...properties,
                    })
                  );
                }
              });
            } else {
              throw new Error(
                "CSV headers must include 'lon/lat' or 'easting/northing/zone'."
              );
            }
          } else if (extension === "kml") {
            const kmlFormat = new KML({
              extractStyles: true,
              showPointNames: true,
            });
            features = kmlFormat.readFeatures(content, {
              dataProjection: "EPSG:4326",
              featureProjection: "EPSG:3857",
            });
          } else if (extension === "zip") {
            const geojson = await shp(content);
            const geoJsonFormat = new GeoJSON();
            features = geoJsonFormat.readFeatures(geojson, {
              dataProjection: "EPSG:4326",
              featureProjection: "EPSG:3857",
            });
          } else if (extension === "geojson" || extension === "json") {
            const geoJsonFormat = new GeoJSON();
            features = geoJsonFormat.readFeatures(JSON.parse(content), {
              dataProjection: "EPSG:4326",
              featureProjection: "EPSG:3857",
            });
          }

          if (features.length > 0) {
            addLayer(file.name, features);
            alert(`Layer "${file.name}" imported successfully.`);
          } else {
            alert("No valid features found or file format is incorrect.");
          }
        } catch (error) {
          console.error("Error importing file:", error);
          alert(`Failed to import file: ${error.message}`);
        }
      };

      if (extension === "zip") {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    },
    [addLayer]
  );

  const handleExportData = useCallback(
    (layerId, format) => {
      if (!mapInstance) return;

      const getLayerByName = (name) => {
        let layerFound = null;
        mapInstance.getLayers().forEach((layer) => {
          if (layer.get("name") === name) layerFound = layer;
        });
        return layerFound;
      };

      let featuresToExport = [];
      let layerName = "export";

      if (layerId === "editorLayer") {
        const editorLayer = getLayerByName("editorLayer");
        if (editorLayer)
          featuresToExport = editorLayer.getSource().getFeatures();
        layerName = "drawn_features";
      } else {
        const importedLayer = importedLayers.find((l) => l.id === layerId);
        if (importedLayer) {
          featuresToExport = importedLayer.features;
          layerName = importedLayer.name.split(".")[0];
        }
      }

      if (featuresToExport.length === 0) {
        alert("The selected layer has no features to export.");
        return;
      }

      let data,
        mimeType,
        fileName = `${layerName}.${format}`;
      try {
        if (format === "geojson") {
          data = new GeoJSON().writeFeatures(featuresToExport, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          });
          mimeType = "application/json";
        } else if (format === "kml") {
          data = new KML().writeFeatures(featuresToExport, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          });
          mimeType = "application/vnd.google-earth.kml+xml";
        } else if (format === "csv") {
          const allProperties = new Set();
          featuresToExport.forEach((f) =>
            Object.keys(f.getProperties()).forEach(
              (p) => p !== "geometry" && allProperties.add(p)
            )
          );
          const headers = [
            "longitude",
            "latitude",
            ...Array.from(allProperties),
          ];

          const rows = featuresToExport
            .map((feature) => {
              const geometry = feature.getGeometry();
              if (geometry.getType() !== "Point") return null;
              const coords = toLonLat(geometry.getCoordinates());
              const row = { longitude: coords[0], latitude: coords[1] };
              headers.slice(2).forEach((prop) => {
                const value = feature.get(prop) ?? "";
                row[prop] = String(value).includes(",") ? `"${value}"` : value;
              });
              return headers.map((h) => row[h]).join(",");
            })
            .filter(Boolean);

          data = [headers.join(","), ...rows].join("\n");
          mimeType = "text/csv";
        }

        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error exporting data:", error);
        alert(`Failed to export data: ${error.message}`);
      }
    },
    [mapInstance, importedLayers]
  );

  return {
    isImportModalVisible,
    setIsImportModalVisible,
    isExportModalVisible,
    setIsExportModalVisible,
    handleFileImport,
    handleExportData,
  };
};

export default useFileHandler;
