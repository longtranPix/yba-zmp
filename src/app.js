// React core
import React from "react";
import { createRoot } from "react-dom/client";

// ✅ FIX: Proper CSS import order to resolve @charset issue
// Import ZaUI first as it likely contains the @charset rule
import "zmp-ui/zaui.css";

// Import Tailwind
import "./css/tailwind.scss";

// Import custom styles
import "./css/app.scss";
import "./css/cubable.css";

// Expose app configuration
import appConfig from "../app-config.json";
if (!window.APP_CONFIG) {
  window.APP_CONFIG = appConfig;
}

// Mount the app
import App from "./components/app";
const root = createRoot(document.getElementById("app"));
root.render(React.createElement(App));
