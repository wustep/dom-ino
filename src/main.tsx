import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function getResetRedirectPath(pathname: string) {
  if (pathname === "/reset" || pathname === "/reset/") {
    return "/";
  }

  if (pathname.endsWith("/reset/")) {
    return pathname.slice(0, -"/reset/".length) || "/";
  }

  if (pathname.endsWith("/reset")) {
    return pathname.slice(0, -"/reset".length) || "/";
  }

  return null;
}

const resetRedirectPath = getResetRedirectPath(window.location.pathname);

if (resetRedirectPath) {
  try {
    window.localStorage.clear();
  } catch {
    // Ignore storage access failures and still navigate home.
  }

  window.history.replaceState(null, "", resetRedirectPath);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
