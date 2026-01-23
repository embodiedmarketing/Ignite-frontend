import { Bell, Flame, LogOut, User, AlertCircle, Menu } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
import IssueReportDialog from "./IssueReportDialog";
import NotificationBell from "./NotificationBell";
import { apiClient } from "@/services/api.config";
import { useEffect, useState } from "react";
import { onMessageListener, requestForToken } from "@/services/firebase";

// Helper function to detect device type
const getDeviceType = (): "ios" | "android" | "web" => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for iOS
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return "ios";
  }
  
  // Check for Android
  if (/android/i.test(userAgent)) {
    return "android";
  }
  
  // Default to web
  return "web";
};

// Helper function to get or create device ID
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    // Generate a unique device ID
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

// Register service worker for Firebase messaging
const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!("serviceWorker" in navigator)) {
    console.error("[FCM] ❌ Service Worker not supported in this browser");
    return null;
  }

  try {
    // Check if service worker is already registered
    const existingRegistration = await navigator.serviceWorker.getRegistration();
    if (existingRegistration) {
      console.log("[FCM] ✅ Service worker already registered");
      // Wait for it to be ready
      await navigator.serviceWorker.ready;
      return existingRegistration;
    }

    // Register the service worker
    console.log("[FCM] Registering service worker...");
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });
    
    console.log("[FCM] ✅ Service worker registered:", registration);
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log("[FCM] ✅ Service worker ready");
    
    return registration;
  } catch (error: any) {
    console.error("[FCM] ❌ Error registering service worker:", error);
    console.error("[FCM] Error details:", {
      message: error?.message,
      stack: error?.stack,
    });
    return null;
  }
};

// Export function to register FCM token
export const registerFCMToken = async (retryCount = 0, maxRetries = 3) => {
  try {
    console.log(`[FCM] registerFCMToken called (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Check if we're in a secure context (HTTPS or localhost)
    if (typeof window !== "undefined" && !window.isSecureContext && window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      console.warn("[FCM] ⚠️ Not in a secure context. FCM requires HTTPS in production.");
      return;
    }

    // Register service worker first
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error("[FCM] ❌ Failed to register service worker");
      if (retryCount < maxRetries) {
        console.log(`[FCM] Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => registerFCMToken(retryCount + 1, maxRetries), 2000);
      }
      return;
    }

    // Check if we already have a token registered
    const storedToken = localStorage.getItem("fcmToken");
    const registeredToken = localStorage.getItem("fcmTokenRegistered");
    
    // Request new token from Firebase
    console.log("[FCM] Requesting token from Firebase...");
    const currentToken = await requestForToken();
    console.log("[FCM] Token received from Firebase:", currentToken ? "Yes" : "No");
    
    if (!currentToken) {
      console.log("[FCM] ⚠️ No token available from Firebase");
      if (retryCount < maxRetries) {
        console.log(`[FCM] Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => registerFCMToken(retryCount + 1, maxRetries), 2000);
      }
      return;
    }
    
    console.log("[FCM] Token comparison:", {
      currentToken: currentToken.substring(0, 20) + "...",
      storedToken: storedToken ? storedToken.substring(0, 20) + "..." : "null",
      registeredToken: registeredToken || "false",
    });
    
    // If token changed or not registered, send to backend
    if (currentToken !== storedToken || !registeredToken) {
      console.log("[FCM] Registering token with backend...");
      
      const deviceType = getDeviceType();
      const deviceId = getDeviceId();
      
      try {
        const response = await apiClient.post("/api/users/fcm-token", {
          token: currentToken,
          deviceType: deviceType,
          deviceId: deviceId,
        });

        console.log("[FCM] ✅ Backend response:", response.status, response.statusText);

        localStorage.setItem("fcmToken", currentToken);
        localStorage.setItem("fcmTokenRegistered", "true");
        console.log("[FCM] ✅ Token registered successfully", { deviceType, deviceId });
      } catch (apiError: any) {
        console.error("[FCM] ❌ Error calling backend API:", apiError);
        if (apiError.response) {
          console.error("[FCM] API Error response:", {
            status: apiError.response.status,
            data: apiError.response.data,
          });
        } else if (apiError.request) {
          console.error("[FCM] API Error: No response received", apiError.request);
        } else {
          console.error("[FCM] API Error:", apiError.message);
        }
        throw apiError; // Re-throw to be caught by outer catch
      }
    } else {
      console.log("[FCM] ✅ Token already registered and unchanged");
    }
  } catch (error: any) {
    console.error("[FCM] ❌ Error registering FCM token:", error);
    console.error("[FCM] Error details:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
    
    if (error.response) {
      console.error("[FCM] Error response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }
    
    // Retry if we haven't exceeded max retries
    if (retryCount < maxRetries) {
      const delay = Math.min(2000 * (retryCount + 1), 10000); // Exponential backoff, max 10s
      console.log(`[FCM] Retrying in ${delay}ms... (${retryCount + 1}/${maxRetries})`);
      setTimeout(() => registerFCMToken(retryCount + 1, maxRetries), delay);
    } else {
      console.error("[FCM] ❌ Max retries reached. Giving up.");
    }
  }
};

export default function Header() {
  const { user ,isAuthenticated} = useAuth();
  const persistedUser = JSON.parse(localStorage.getItem("user")!);
  const { toast } = useToast();
  const [notification, setNotification] = useState([{ title: "", body: "" }]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window 
      ? Notification.permission 
      : "denied"
  );
  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      await apiClient.post("/api/auth/logout");
      toast({
        title: "Logged out successfully",
        description: "You've been logged out of your account.",
      });
localStorage.removeItem("user");
localStorage.removeItem("fcmToken");
localStorage.removeItem("fcmTokenRegistered");
localStorage.removeItem("deviceId");
      window.location.href = "/login";
    } catch (error) {

      toast({
        title: "Logout failed",
        description: "There was an issue logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };


  const getPersistedUserInitials = () => {
    if (persistedUser?.firstName && persistedUser?.lastName) {
      return `${persistedUser.firstName[0]}${persistedUser.lastName[0]}`.toUpperCase();
    }
    if (persistedUser?.email) {
      return persistedUser.email[0].toUpperCase();
    }
    return "U";
  };


  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };


  // Track notification permission changes
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const currentPermission = Notification.permission;
      setNotificationPermission(currentPermission);
      console.log("[Header] Current notification permission:", currentPermission);
    }
  }, []);



// console.log("isAuthenticatedUser", isAuthenticated, user);
//   useEffect(() => {
//     // Only register FCM token if user is authenticated
//     if (!isAuthenticated || !user) {
//       return;
//     }

//     const registerFCMToken = async () => {
//       try {

//         console.log("registerFCMToken called");
//         // Check if we already have a token registered
//         const storedToken = localStorage.getItem("fcmToken");
//         const registeredToken = localStorage.getItem("fcmTokenRegistered");
        
//         // Request new token from Firebase
//         const currentToken = await requestForToken();
//         console.log("currentToken returned", currentToken);
//         if (!currentToken) {
//           console.log("[FCM] No token available");
//           return;
//         }
// console.log("currentToken", currentToken, storedToken, registeredToken);
//         // If token changed or not registered, send to backend
//         if (currentToken !== storedToken || !registeredToken) {
//           console.log("[FCM] Registering token with backend:", currentToken);
          
//           const deviceType = getDeviceType();
//           const deviceId = getDeviceId();
          
//           await apiClient.post("/api/users/fcm-token", {
//             token: currentToken,
//             deviceType: deviceType,
//             deviceId: deviceId,
//           });

//           localStorage.setItem("fcmToken", currentToken);
//           localStorage.setItem("fcmTokenRegistered", "true");
//           console.log("[FCM] Token registered successfully", { deviceType, deviceId });
//         } else {
//           console.log("[FCM] Token already registered");
//         }
//       } catch (error: any) {
//         console.error("[FCM] Error registering FCM token:", error);
//         if (error.response) {
//           console.error("[FCM] Error response:", error.response.data);
//         }
//       }
//     };

//     registerFCMToken();
//   }, [isAuthenticated, user]);





  const handleMessage = (payload: any) => {
    console.log("[Header] FCM message received:", payload);
    
    const notificationTitle = payload?.notification?.title;
    const notificationBody = payload?.notification?.body
    
    // setNotification([
    //   {
    //     title: notificationTitle,
    //     body: notificationBody,
    //   },
    // ]);

    if ("Notification" in window) {
      const currentPermission = Notification.permission;
      setNotificationPermission(currentPermission);
      
      if (currentPermission === "granted") {
        console.log("[Header] ✅ Showing browser notification");
        try {
          const browserNotification = new Notification(notificationTitle, {
            body: notificationBody,
            tag: payload?.messageId || `notification-${Date.now()}`,
            data: payload?.data,
          });

          browserNotification.onclick = () => {
            console.log("[Header] Notification clicked");
            window.focus();
            browserNotification.close();
            
            // Navigate to the link if available
            if (payload?.data?.link) {
              window.location.href = payload.data.link;
            }
          };

          setTimeout(() => {
            browserNotification.close();
          }, 5000);
        } catch (error: any) {
          console.error("[Header] Error showing browser notification:", error);
        }
      } else if (currentPermission === "default") {
        console.log("[Header] ⚠️ Notification permission not yet requested");
        console.log("[Header] Permission will be requested when FCM token is registered");
      } else {
        console.warn("[Header] ❌ Notification permission denied");
        console.warn("[Header] To enable notifications:");
        console.warn("  1. Click the lock icon (🔒) in the address bar");
        console.warn("  2. Find 'Notifications' and set it to 'Allow'");
        console.warn("  3. Refresh the page");
      }
    } else {
      console.warn("[Header] ❌ Browser does not support notifications");
    }

 
  };
  onMessageListener(handleMessage);







  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-primary rounded-lg flex items-center justify-center">
              <Flame className="text-white w-3 h-3 md:w-4 md:h-4" />
            </div>
            <h1 className="text-lg md:text-xl font-semibold text-slate-900">
              IGNITE
            </h1>
          </div>

         {isAuthenticated ? <div className="flex items-center space-x-2 md:space-x-3">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto">
                  <Avatar className="w-7 h-7 md:w-8 md:h-8">
                    <AvatarImage
                      src={user?.profileImageUrl || undefined}
                      alt={user?.firstName || "User"}
                    />
                    <AvatarFallback className="bg-slate-300 text-xs md:text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="flex-col items-start">
                  <div className="font-medium">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email || "User"}
                  </div>
                  {user?.email && (
                    <div className="text-sm text-slate-500">{user.email}</div>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="flex items-center w-full cursor-pointer"
                  >
                    <User className="w-4 h-4 mr-2" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <IssueReportDialog
                    userId={user?.id || 0}
                    userEmail={user?.email}
                    userName={user?.firstName + " " + user?.lastName}
                    trigger={
                      <div className="flex items-center w-full cursor-pointer">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Report Issue
                      </div>
                    }
                  />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
        :  <div className="flex items-center space-x-2 md:space-x-3">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto">
                  <Avatar className="w-7 h-7 md:w-8 md:h-8">
                    <AvatarImage
                      src={persistedUser?.profileImageUrl || undefined}
                      alt={persistedUser?.firstName || "User"}
                    />
                    <AvatarFallback className="bg-slate-300 text-xs md:text-sm">
                      {getPersistedUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="flex-col items-start">
                  <div className="font-medium">
                    {persistedUser?.firstName && persistedUser?.lastName
                      ? `${persistedUser.firstName} ${persistedUser.lastName}`
                      : persistedUser?.email || "User"}
                  </div>
                  {persistedUser?.email && (
                    <div className="text-sm text-slate-500">{persistedUser.email}</div>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
        </div>
      </div>
    </header>
  );
}
