import { useCallback } from "react";
import shp from "shpjs";
import shpwrite from "shp-write";
import { KML, GeoJSON } from "ol/format";
import { fromLonLat, toLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { v4 as uuidv4 } from "uuid";
import { saveAs } from "file-saver";

export const useFileImportExport = (
  setImportedLayers,
  setActivePanel,
  mapInstance,
  importedLayers
) => {
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
              .split(/\r\n|\n/)
              .filter((line) => line.trim() !== "");
            if (lines.length < 2)
              throw new Error(
                "CSV file must have a header and at least one data row."
              );
            const headers = lines[0]
              .split(",")
              .map((h) => h.trim().toLowerCase());
            const lonIndex = headers.findIndex(
              (h) => h === "lon" || h === "longitude"
            );
            const latIndex = headers.findIndex(
              (h) => h === "lat" || h === "latitude"
            );
            if (lonIndex !== -1 && latIndex !== -1) {
              for (let i = 1; i < lines.length; i++) {
                const data = lines[i].split(",");
                if (data.length < headers.length) continue;
                const lon = parseFloat(data[lonIndex]);
                const lat = parseFloat(data[latIndex]);
                if (!isNaN(lon) && !isNaN(lat)) {
                  const properties = {};
                  headers.forEach((header, index) => {
                    properties[header] = data[index]?.trim() || "";
                  });
                  features.push(
                    new Feature({
                      geometry: new Point(fromLonLat([lon, lat])),
                      ...properties,
                    })
                  );
                }
              }
            } else {
              throw new Error("CSV file must contain 'lat' and 'lon' columns.");
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
            const newLayer = {
              id: uuidv4(),
              name: file.name,
              features: features,
              visible: true,
              opacity: 1,
              style: null,
            };
            setImportedLayers((prevLayers) => [newLayer, ...prevLayers]);
            setActivePanel("layers");
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
    [setImportedLayers, setActivePanel]
  );

  const handleExportData = useCallback(
    async (layerId, format) => {
      let features;
      let layerName;
      if (layerId === "editorLayer") {
        const layerToExport = mapInstance
          .getLayers()
          .getArray()
          .find((l) => l.get("name") === "editorLayer");
        features = layerToExport?.getSource().getFeatures() || [];
        layerName = "Drawn_Features";
      } else {
        const layerToExport = importedLayers.find((l) => l.id === layerId);
        features = layerToExport?.features || [];
        layerName = layerToExport?.name.split(".")[0] || "Exported_Layer";
      }
      if (!features || features.length === 0) {
        alert("No features to export in the selected layer.");
        return;
      }
      const formatOptions = {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      };
      try {
        switch (format) {
          case "geojson": {
            const geojsonFormat = new GeoJSON();
            const geojsonString = geojsonFormat.writeFeatures(
              features,
              formatOptions
            );
            saveAs(
              new Blob([geojsonString], { type: "application/json" }),
              `${layerName}.geojson`
            );
            break;
          }
          case "kml": {
            const kmlFormat = new KML();
            const kmlString = kmlFormat.writeFeatures(features, formatOptions);
            saveAs(
              new Blob([kmlString], {
                type: "application/vnd.google-earth.kml+xml",
              }),
              `${layerName}.kml`
            );
            break;
          }
          case "csv": {
            const pointFeatures = features.filter(
              (f) => f.getGeometry().getType() === "Point"
            );
            if (pointFeatures.length === 0) {
              alert("No point features found in this layer to export as CSV.");
              return;
            }
            let csvContent = "";
            const headers = new Set(["longitude", "latitude"]);
            pointFeatures.forEach((f) => {
              Object.keys(f.getProperties()).forEach((key) => {
                if (key !== "geometry") headers.add(key);
              });
            });
            const headerArray = Array.from(headers);
            csvContent += headerArray.join(",") + "\r\n";
            pointFeatures.forEach((f) => {
              const coords = toLonLat(f.getGeometry().getCoordinates());
              const properties = f.getProperties();
              const row = headerArray.map((header) => {
                if (header === "longitude") return coords[0];
                if (header === "latitude") return coords[1];
                const value = properties[header] || "";
                return `"${String(value).replace(/"/g, '""')}"`;
              });
              csvContent += row.join(",") + "\r\n";
            });
            saveAs(
              new Blob([csvContent], { type: "text/csv;charset=utf-8;" }),
              `${layerName}.csv`
            );
            break;
          }
          case "shp": {
            const geojsonFormat = new GeoJSON();
            const geojson = geojsonFormat.writeFeaturesObject(
              features,
              formatOptions
            );
            shpwrite.download(geojson);
            break;
          }
          default:
            alert(`Format '${format}' is not supported yet.`);
        }
      } catch (error) {
        console.error("Export failed:", error);
        alert(`An error occurred during export: ${error.message}`);
      }
    },
    [mapInstance, importedLayers]
  );

  return {
    handleFileImport,
    handleExportData,
  };
};
