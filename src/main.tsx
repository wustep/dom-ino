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

function decodeQueryValue(raw: string) {
  try {
    return decodeURIComponent(raw.replace(/\+/g, "%20"));
  } catch {
    return raw;
  }
}

function getBootstrapFetchUrl(search: string) {
  if (search.startsWith("?fetch=")) {
    const rawFetchUrl = search.slice("?fetch=".length).trim();
    return rawFetchUrl ? decodeQueryValue(rawFetchUrl) : null;
  }

  const fetchUrl = new URLSearchParams(search).get("fetch")?.trim();
  return fetchUrl || null;
}

const resetRedirectPath = getResetRedirectPath(window.location.pathname);
const bootstrapFetchUrl = getBootstrapFetchUrl(window.location.search);

if (resetRedirectPath) {
  try {
    window.localStorage.clear();
  } catch {
    // Ignore storage access failures and still navigate home.
  }
}

if (resetRedirectPath || bootstrapFetchUrl) {
  const nextPathname = resetRedirectPath ?? window.location.pathname;
  window.history.replaceState(null, "", `${nextPathname}${window.location.hash}`);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App initialFetchUrl={bootstrapFetchUrl} />
  </StrictMode>
);
