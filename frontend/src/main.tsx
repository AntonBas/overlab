import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App.tsx";
import { reloadForNewBuild } from "./utils/staleBuild";

window.addEventListener("vite:preloadError", (event) => {
  if (reloadForNewBuild()) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

const bootScreen = document.querySelector(".boot");
if (bootScreen) {
  window.setTimeout(() => {
    bootScreen.classList.add("boot--hidden");
    window.setTimeout(() => bootScreen.remove(), 400);
  }, 50);
}
