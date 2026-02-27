import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
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
    console.log('Firebase admin init error:', error.stack);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { ownerId, title, body } = req.body;

  try {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(ownerId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "Owner not found" });
    
    const fcmToken = userDoc.data().fcmToken;
    if (!fcmToken) return res.status(400).json({ error: "Owner has no FCM token saved" });

    const message = {
      notification: { title, body },
      webpush: {
        notification: {
          icon: "https://kintag.vercel.app/kintag-logo.png",
          data: { url: "https://kintag.vercel.app/#/?view=notifications" } // Fallback for Service Worker
        },
        fcmOptions: {
          link: "https://kintag.vercel.app/#/?view=notifications" // Native OS Link
        }
      },
      token: fcmToken,
    };

    await admin.messaging().send(message);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
