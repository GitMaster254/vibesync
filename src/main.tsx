import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from "./lib/theme";

// Ensure theme class is applied before rendering
initTheme();

createRoot(document.getElementById("root")!).render(<App />);
