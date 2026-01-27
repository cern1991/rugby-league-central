import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const currentUrl = new URL(window.location.href);
const redirectParam = currentUrl.searchParams.get("redirect");

if (redirectParam) {
  let normalized = redirectParam.startsWith("/") ? redirectParam : `/${redirectParam}`;
  try {
    const url = new URL(normalized, window.location.origin);
    normalized = url.pathname + url.search + url.hash;
  } catch {
    normalized = "/";
  }
  window.history.replaceState(null, "", normalized);
}

createRoot(document.getElementById("root")!).render(<App />);
