import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/AppProvider";
import "./index.css";

// --- App-level Configuration ---
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import { projectionDefs } from "./config/projections";

// This setup runs once when the application starts
proj4.defs(projectionDefs);
register(proj4);
// --- End Configuration ---

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
