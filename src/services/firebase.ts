// import { initializeApp } from "firebase/app";
// import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

// const apiKey = import.meta.env.VITE_REACT_APP_FIREBASE_API_KEY;

// const firebaseConfig = {
//   apiKey: apiKey,
//   authDomain: "medistan-62fdc.firebaseapp.com",
//   projectId: "medistan-62fdc",
//   storageBucket: "medistan-62fdc.firebasestorage.app",
//   messagingSenderId: "525748056960",
//   appId: "1:525748056960:web:7a0da9753eb1decb70c765"
// };

// const app = initializeApp(firebaseConfig);

// // Initialize messaging only if supported
// let messaging: ReturnType<typeof getMessaging> | null = null;

// // Check if messaging is supported and initialize
// isSupported().then((supported) => {
//   if (supported) {
//     messaging = getMessaging(app);
//     console.log("[Firebase] Messaging initialized successfully");
//   } else {
//     console.warn("[Firebase] Messaging not supported in this browser");
//   }
// }).catch((error) => {
//   console.error("[Firebase] Error checking messaging support:", error);
// });

// // Register service worker
// const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
//   if (!("serviceWorker" in navigator)) {
//     console.error("[Firebase] ❌ Service Worker not supported in this browser");
//     return null;
//   }

//   try {
//     // Check if service worker is already registered
//     const existingRegistration = await navigator.serviceWorker.getRegistration();
//     if (existingRegistration) {
//       console.log("[Firebase] ✅ Service worker already registered");
//       return existingRegistration;
//     }

//     // Register the service worker
//     console.log("[Firebase] Registering service worker...");
//     const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
//       scope: "/",
//     });
    
//     console.log("[Firebase] ✅ Service worker registered:", registration);
    
//     // Wait for service worker to be ready
//     await navigator.serviceWorker.ready;
//     console.log("[Firebase] ✅ Service worker ready");
    
//     return registration;
//   } catch (error: any) {
//     console.error("[Firebase] ❌ Error registering service worker:", error);
//     return null;
//   }
// };

// export const requestForToken = async (): Promise<string | undefined> => {
//   try {
//     // Check if messaging is initialized
//     if (!messaging) {
//       console.warn("[Firebase] Messaging not initialized, checking support...");
//       const supported = await isSupported();
//       if (!supported) {
//         console.error("[Firebase] ❌ Messaging not supported in this browser");
//         return undefined;
//       }
//       messaging = getMessaging(app);
//     }

//     console.log("[Firebase] Requesting notification permission...");
//     const permission = await Notification.requestPermission();
//     console.log("[Firebase] Permission result:", permission);
    
//     if (permission === "granted") {
//       console.log("[Firebase] ✅ Permission granted successfully");
      
//       // Register service worker first
//       const registration = await registerServiceWorker();
//       if (!registration) {
//         console.error("[Firebase] ❌ Failed to register service worker");
//         return undefined;
//       }

//       try {
//         console.log("[Firebase] Requesting FCM token...");
//         const currentToken = await getToken(messaging, {
//           vapidKey:
//             "BPCZ33LkE2ClxMKA1RK2YFL3sR6dvpu60qAxRekkKjrqXEp-wk7RiSrp0iXcfYfCx9Ho7tHnkoAqKxvDVxoP6TU",
//           serviceWorkerRegistration: registration,
//         });

//         console.log("[Firebase] 📦 Token received from getToken:", currentToken);

//         if (currentToken) {
//           console.log("[Firebase] ✅ Token successfully retrieved:", currentToken);
//           return currentToken;
//         } else {
//           console.warn("[Firebase] ⚠️ getToken returned null/undefined");
//           console.warn("[Firebase] This usually means:");
//           console.warn("  - Service worker not properly registered");
//           console.warn("  - VAPID key might be incorrect");
//           console.warn("  - Firebase project configuration issue");
//           console.warn("  - Service worker scope mismatch");
          
//           // Try to get more info about the error
//           if (messaging) {
//             try {
//               const tokenDetails = await getToken(messaging);
//               console.log("[Firebase] Token details (without options):", tokenDetails);
//             } catch (tokenError: any) {
//               console.error("[Firebase] Error getting token (detailed):", tokenError);
//               console.error("[Firebase] Error code:", tokenError?.code);
//               console.error("[Firebase] Error message:", tokenError?.message);
//             }
//           }
//         }
//       } catch (swError: any) {
//         console.error("[Firebase] ❌ Service worker error:", swError);
//         console.error("[Firebase] Error details:", {
//           code: swError?.code,
//           message: swError?.message,
//           stack: swError?.stack,
//         });
//         return undefined;
//       }
//     } else {
//       console.log("[Firebase] ⚠️ Permission for notifications denied:", permission);
//     }
//   } catch (err: any) {
//     console.error("[Firebase] ❌ An error occurred while retrieving token:", err);
//     console.error("[Firebase] Error details:", {
//       name: err?.name,
//       message: err?.message,
//       code: err?.code,
//       stack: err?.stack,
//     });
//   }
  
//   return undefined;
// };

// export const onMessageListener = (callback: (payload: any) => void) => {
//   if (!messaging) {
//     console.warn("[Firebase] Messaging not initialized, cannot set up message listener");
//     return;
//   }
  
//   onMessage(messaging, (payload:any) => {
//     console.log("payload", payload);
//     callback(payload);
//   });
// };






import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const apiKey = import.meta.env.VITE_REACT_APP_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "medistan-62fdc.firebaseapp.com",
  projectId: "medistan-62fdc",
  storageBucket: "medistan-62fdc.appspot.com",
  messagingSenderId: "525748056960",
  appId: "1:525748056960:web:7a0da9753eb1decb70c765",
};

initializeApp(firebaseConfig);

const messaging = getMessaging();

export const requestForToken = async () => {
  try {
    // Check if service worker is supported
    if (!("serviceWorker" in navigator)) {
      console.error("[Firebase] Service Worker not supported");
      return undefined;
    }

    // Wait for service worker to be ready
    let serviceWorkerRegistration: ServiceWorkerRegistration;
    try {
      serviceWorkerRegistration = await navigator.serviceWorker.ready;
      console.log("[Firebase] Service worker ready");
    } catch (swError: any) {
      console.error("[Firebase] Service worker not ready:", swError);
      return undefined;
    }

    const permission = await Notification.requestPermission();
    console.log("[Firebase] Notification permission:", permission);
    
    if (permission === "granted") {
      try {
        const currentToken = await getToken(messaging, {
          vapidKey:
            "BPCZ33LkE2ClxMKA1RK2YFL3sR6dvpu60qAxRekkKjrqXEp-wk7RiSrp0iXcfYfCx9Ho7tHnkoAqKxvDVxoP6TU",
          serviceWorkerRegistration: serviceWorkerRegistration,
        });

        if (currentToken) {
          console.log("[Firebase] ✅ Token retrieved successfully");
          return currentToken;
        } else {
          console.warn("[Firebase] ⚠️ No registration token available. Request permission to generate one.");
          return undefined;
        }
      } catch (tokenError: any) {
        console.error("[Firebase] ❌ Error getting token:", tokenError);
        console.error("[Firebase] Token error details:", {
          code: tokenError?.code,
          message: tokenError?.message,
        });
        return undefined;
      }
    } else {
      console.warn("[Firebase] ⚠️ Permission for notifications denied:", permission);
      return undefined;
    }
  } catch (err: any) {
    console.error("[Firebase] ❌ An error occurred while retrieving token:", err);
    console.error("[Firebase] Error details:", {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    });
    return undefined;
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  onMessage(messaging, (payload) => {
    console.log("payload", payload);
    callback(payload);
  });
};
