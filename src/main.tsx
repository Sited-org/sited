import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent blank screen from unhandled promise rejections (e.g. lazy import failures)
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled rejection:", event.reason);
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
