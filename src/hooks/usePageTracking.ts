import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./useAuth";
import { apiRequest } from "@/services/queryClient";

// Map routes to friendly section names
const ROUTE_TO_SECTION: Record<string, string> = {
  "/messaging": "Messaging Mastery",
  "/lead-generation/building-your-strategy": "Messaging Strategy",
  "/step/1/strategy-results": "Messaging Strategy Results",
  "/create-offer": "Create Your Offer",
  "/build-offer": "Build Your Offer",
  "/sell-offer": "Sell Your Offer",
  "/lead-generation/launch-your-ads": "Launch Your Ads - Funnel Launch",
  "/launch-sales/launch-your-ads": "Launch Your Ads - Live Launch",
  "/lead-generation/track-and-optimize": "Track & Optimize - Funnel Launch",
  "/launch-sales/track-and-optimize": "Track & Optimize - Live Launch",
  "/audience-growth": "Audience Growth",
  "/dashboard": "Dashboard",
  "/resources": "Resource Library",
  "/bonus": "Bonus Material",
  "/community-forum": "Community Forum",
  "/profile": "Profile",
};

// Routes to track for "continue where you left off"
const TRACKABLE_ROUTES = new Set([
  "/messaging",
  "/lead-generation/building-your-strategy",
  "/step/1/strategy-results",
  "/create-offer",
  "/build-offer",
  "/sell-offer",
  "/lead-generation/launch-your-ads",
  "/launch-sales/launch-your-ads",
  "/lead-generation/track-and-optimize",
  "/launch-sales/track-and-optimize",
  "/audience-growth",
]);

export function usePageTracking() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const hasTracked = useRef(false);
  const lastSavedPath = useRef<string>("");

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Only track significant pages (workbook sections, not dashboard/resources)
    if (!TRACKABLE_ROUTES.has(location)) return;

    // Don't save the same path twice
    if (lastSavedPath.current === location) return;

    // Save the current page as last visited
    const sectionName = ROUTE_TO_SECTION[location] || location;
    
    apiRequest("POST", "/api/auth/last-visited", { 
      path: location, 
      sectionName 
    }).catch((error) => {
      console.error("Failed to save last visited page:", error);
    });

    lastSavedPath.current = location;
    hasTracked.current = true;
  }, [location, isAuthenticated, user]);
}

// Map old routes to new routes for backwards compatibility
const OLD_TO_NEW_ROUTES: Record<string, string> = {
  "/track-optimize": "/lead-generation/track-and-optimize",
  "/track-optimize-live": "/launch-sales/track-and-optimize",
  "/launch-ads": "/lead-generation/launch-your-ads",
  "/launch-ads-live": "/launch-sales/launch-your-ads",
  "/building-strategy": "/lead-generation/building-your-strategy",
  "/messaging-strategy-results": "/step/1/strategy-results",
  "/bonus-material": "/bonus",
  "/community": "/community-forum",
};

// Hook to redirect to last visited page on app load
export function useAutoRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect once when user first loads the app
    if (hasRedirected.current || isLoading || !isAuthenticated || !user) return;

    // Don't redirect if user is already on a specific page (not landing/login/dashboard)
    if (location !== "/" && location !== "/dashboard" && location !== "/login") return;

    // Check if user has a last visited page
    if (user.lastVisitedPath) {
      // Map old routes to new routes
      const targetPath = OLD_TO_NEW_ROUTES[user.lastVisitedPath] || user.lastVisitedPath;
      
      // Only redirect to trackable routes
      if (TRACKABLE_ROUTES.has(targetPath)) {
        console.log(`Redirecting to last visited page: ${targetPath}`);
        setLocation(targetPath);
        hasRedirected.current = true;
      }
    }
  }, [user, isAuthenticated, isLoading, location, setLocation]);
}
