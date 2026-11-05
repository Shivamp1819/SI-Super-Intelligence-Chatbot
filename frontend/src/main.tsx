import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { Toaster } from "react-hot-toast";
import axios from "axios";

// Automatically resolve API URL: relative /api/v1 proxies seamlessly via Vite dev server or production reverse proxy
const resolveApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Relative URL works on localhost, mobile network IP, and production
  return "/api/v1";
};

axios.defaults.baseURL = resolveApiBaseUrl();
axios.defaults.withCredentials = true;
axios.defaults.timeout = 25000;

// Pre-warm Web Speech API voices asynchronously so they are ready immediately without blocking
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      try {
        window.speechSynthesis.getVoices();
      } catch (_) {}
    };
  } catch (_) {}
}
import { ThemeContextProvider } from "./context/ThemeContext.tsx";
import ErrorBoundary from "./components/shared/ErrorBoundary.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeContextProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-right" />
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ThemeContextProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
