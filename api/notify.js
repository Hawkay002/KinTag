import admin from 'firebase-admin';

// Initialize the Firebase Admin SDK securely using Vercel Environment Variables
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // This replace function ensures the key formats correctly on Vercel
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.log('Firebase admin initialization error', error.stack);
  }
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { ownerId, title, body } = req.body;

  try {
    const db = admin.firestore();
    
    // Look up the owner's push notification token in the database
    const userDoc = await db.collection('users').doc(ownerId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "Owner not found" });
    
    const fcmToken = userDoc.data().fcmToken;
    if (!fcmToken) return res.status(400).json({ error: "Owner has no FCM token saved" });

    // Format the Push Notification
    const message = {
      notification: { title, body },
      token: fcmToken,
    };

    // Fire the notification to the parent's phone!
    await admin.messaging().send(message);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Push Error:", error);
    res.status(500).json({ error: error.message });
  }
}
