import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

// Force clear any cached React instances on HMR
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    // Cleanup on module replacement
    console.log('[HMR] Cleaning up...');
  });
}

// Temporarily removed StrictMode to prevent double-mounting during development
createRoot(rootElement).render(<App />);
