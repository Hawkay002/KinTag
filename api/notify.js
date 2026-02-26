import admin from 'firebase-admin';

// Initialize the Firebase Admin SDK securely using Vercel Environment Variables
if (!admin.apps.length) {
  try {
    // Aggressively clean the private key to remove accidental quotes or broken line breaks from Vercel
    const cleanPrivateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^"|"$/g, '')
      : '';

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: cleanPrivateKey,
      }),
    });
  } catch (error) {
    console.log('Firebase admin initialization error:', error.stack);
  }
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  // Accept the 'link' variable from the frontend
  const { ownerId, title, body, link } = req.body;

  try {
    const db = admin.firestore();
    
    // Look up the owner's push notification token in the database
    const userDoc = await db.collection('users').doc(ownerId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "Owner not found" });
    
    const fcmToken = userDoc.data().fcmToken;
    if (!fcmToken) return res.status(400).json({ error: "Owner has no FCM token saved" });

    // Format the Push Notification with click actions for Android/iOS
    const message = {
      notification: { title, body },
      webpush: {
        notification: {
          icon: "https://kintag.vercel.app/kintag-logo.png",
          click_action: link || "https://kintag.vercel.app" // Forces the phone OS to open the map!
        },
        fcmOptions: {
          link: link || "https://kintag.vercel.app"
        }
      },
      token: fcmToken,
    };

    // Fire the notification to the parent's phone!
    await admin.messaging().send(message);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Push Error Details:", error);
    res.status(500).json({ error: error.message, code: error.code });
  }
}
