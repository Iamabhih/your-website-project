import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Verify React is properly loaded
if (typeof React.useState !== 'function') {
  console.error('React hooks not available - forcing reload to clear cache');
  window.location.reload();
  throw new Error('React initialization failed');
}

// Render application
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
