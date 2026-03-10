importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// NOTE: We completely removed the self.skipWaiting() and self.clients.claim() blocks 
// so the Update Toast can pause and wait for the user!

firebase.initializeApp({
  apiKey: "AIzaSyAS4oLPUdC6qIWgO6dLwupPn4UVvkl8Uso",
  authDomain: "kintag-4c1ac.firebaseapp.com",
  projectId: "kintag-4c1ac",
  storageBucket: "kintag-4c1ac.firebasestorage.app",
  messagingSenderId: "354412332627",
  appId: "1:354412332627:web:d84f50f789cc8946dd28a6"
});

const messaging = firebase.messaging();

// 🌟 FIXED: Clean, direct link opener
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); 
  
  // Grabs the map URL perfectly from the new payload structure
  const targetUrl = event.notification.data?.url || "https://kintag.vercel.app";

  event.waitUntil(
    clients.openWindow(targetUrl)
  );
});
