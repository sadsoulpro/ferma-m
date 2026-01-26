import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress external analytics errors (PostHog in preview environment)
window.addEventListener('error', (e) => {
  if (e.message?.includes('postMessage') || e.message?.includes('PerformanceServerTiming')) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.message?.includes('postMessage') || e.reason?.message?.includes('PerformanceServerTiming')) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
