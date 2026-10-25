import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { SmoothScroll } from "./lib/smooth";
import { AppProvider } from "./lib/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <SmoothScroll />
      <App />
    </AppProvider>
  </StrictMode>,
);
