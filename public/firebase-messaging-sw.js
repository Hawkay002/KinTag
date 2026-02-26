importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// 🌟 FORCE UPDATE: Instantly destroys the old double-notification code on the phone
self.addEventListener('install', function(event) {
  self.skipWaiting();
});
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

// NOTE: Paste your Firebase string values back in here!
firebase.initializeApp({
  apiKey: "AIzaSyAS4oLPUdC6qIWgO6dLwupPn4UVvkl8Uso",
  authDomain: "kintag-4c1ac.firebaseapp.com",
  projectId: "kintag-4c1ac",
  storageBucket: "kintag-4c1ac.firebasestorage.app",
  messagingSenderId: "354412332627",
  appId: "1:354412332627:web:d84f50f789cc8946dd28a6"
});

const messaging = firebase.messaging();

// 🌟 BULLETPROOF LINK OPENER: Forces the phone to open Google Maps when tapped
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Clears the notification from the tray
  
  // Grabs the map URL we securely passed from the Vercel backend
  const urlToOpen = event.notification.data?.url || "https://kintag.vercel.app";

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Forces the browser to open the link
      return clients.openWindow(urlToOpen);
    })
  );
});


