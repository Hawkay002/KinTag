importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// 🌟 NEW: This forces the phone to instantly delete the old, double-firing code
self.addEventListener('install', function(event) {
  self.skipWaiting();
});
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

// NOTE: Keep your actual string values here!
firebase.initializeApp({
  apiKey: "AIzaSyAS4oLPUdC6qIWgO6dLwupPn4UVvkl8Uso",
  authDomain: "kintag-4c1ac.firebaseapp.com",
  projectId: "kintag-4c1ac",
  storageBucket: "kintag-4c1ac.firebasestorage.app",
  messagingSenderId: "354412332627",
  appId: "1:354412332627:web:d84f50f789cc8946dd28a6"
});

const messaging = firebase.messaging();
// Let Firebase handle the notifications automatically so the map links work!



