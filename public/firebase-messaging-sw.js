// Import Firebase standalone scripts
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// NOTE: You must paste your actual string values here. This file cannot read .env variables.
firebase.initializeApp({
  apiKey: "AIzaSyAS4oLPUdC6qIWgO6dLwupPn4UVvkl8Uso",
  authDomain: "kintag-4c1ac.firebaseapp.com",
  projectId: "kintag-4c1ac",
  storageBucket: "kintag-4c1ac.firebasestorage.app",
  messagingSenderId: "354412332627",
  appId: "1:354412332627:web:d84f50f789cc8946dd28a6"
});

// Retrieve an instance of Firebase Messaging so it can handle background messages
const messaging = firebase.messaging();

// Customize how background notifications look on the phone
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/kintag-logo.png' // Uses your app logo
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
