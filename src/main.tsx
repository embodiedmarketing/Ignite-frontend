import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Production-ready React initialization with deployment environment compatibility
function initializeReactApp() {
  const container = document.getElementById("root");
  
  if (!container) {
    console.error("Root container not found");
    return;
  }

  try {
    // Clear any existing content to prevent conflicts
    container.innerHTML = "";
    
    const root = createRoot(container);
    root.render(<App />);
    
    console.log("React app initialized successfully");
    return true;
  } catch (error) {
    console.error("React initialization failed:", error);
    
    // Show user-friendly error state
    container.innerHTML = `
      <div style="
        max-width: 600px; margin: 40px auto; padding: 30px;
        font-family: system-ui, -apple-system, sans-serif;
        background: #f8f9fa; border-radius: 12px; text-align: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      ">
        <h1 style="color: #4593ed; margin-bottom: 20px; font-size: 28px;">Launch Platform</h1>
        <p style="font-size: 18px; margin-bottom: 15px; color: #333;">
          Initializing your AI-powered entrepreneurship platform...
        </p>
        <div style="margin: 25px 0;">
          <div style="
            width: 50px; height: 50px; margin: 0 auto;
            border: 4px solid #e9ecef; border-top: 4px solid #4593ed;
            border-radius: 50%; animation: spin 1s linear infinite;
          "></div>
        </div>
        <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
          Loading AI coaching system and interactive workbooks...
        </p>
        <button onclick="window.location.reload()" style="
          background: #4593ed; color: white; border: none; padding: 12px 24px;
          border-radius: 6px; font-size: 16px; cursor: pointer;
          transition: background 0.2s;
        " onmouseover="this.style.background='#3a7bd5'" onmouseout="this.style.background='#4593ed'">
          Refresh Application
        </button>
      </div>
      <style>
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      </style>
    `;
    
    return false;
  }
}

// Multiple initialization strategies for maximum deployment compatibility
function setupApplicationInitialization() {
  let initializationAttempted = false;
  
  function attemptInitialization() {
    if (initializationAttempted) return;
    initializationAttempted = true;
    
    const success = initializeReactApp();
    
    if (!success) {
      // Retry after a short delay
      setTimeout(() => {
        initializationAttempted = false;
        attemptInitialization();
      }, 2000);
    }
  }
  
  // Strategy 1: DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attemptInitialization);
  } else {
    attemptInitialization();
  }
  
  // Strategy 2: Window load (ensures all resources are loaded)
  window.addEventListener("load", () => {
    setTimeout(attemptInitialization, 100);
  });
  
  // Strategy 3: Delayed initialization for deployment environments
  setTimeout(() => {
    const root = document.getElementById("root");
    if (root && root.children.length === 0) {
      initializationAttempted = false;
      attemptInitialization();
    }
  }, 1000);
}

// Initialize only in browser environment
if (typeof window !== "undefined" && typeof document !== "undefined") {
  setupApplicationInitialization();
}
