// Firebase Cloud Messaging Service Worker
// This file must be in the public directory and accessible at the root URL

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// Note: Service workers can't access environment variables, so we use the same config
// You may need to update the apiKey if it's different from the main app
const firebaseConfig = {
  apiKey: "AIzaSyDxK8vJxK8vJxK8vJxK8vJxK8vJxK8vJ", // Update this with your actual API key
  authDomain: "medistan-62fdc.firebaseapp.com",
  projectId: "medistan-62fdc",
  storageBucket: "medistan-62fdc.firebasestorage.app",
  messagingSenderId: "525748056960",
  appId: "1:525748056960:web:7a0da9753eb1decb70c765"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

