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
    console.log('Firebase admin initialization error:', error.stack);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { title, body } = req.body;

  try {
    const db = admin.firestore();
    
    // 1. Fetch ALL users from the database to grab their push tokens
    const usersSnap = await db.collection('users').get();
    const tokens = [];
    
    usersSnap.forEach(doc => {
      const fcmToken = doc.data().fcmToken;
      if (fcmToken) tokens.push(fcmToken);
    });

    if (tokens.length === 0) {
      return res.status(200).json({ success: true, message: "No users have notifications enabled yet." });
    }

    // 2. Build the Campaign Message
    const message = {
      notification: { title, body },
      webpush: {
        notification: {
          icon: "https://kintag.vercel.app/kintag-logo.png"
        },
        fcmOptions: {
          link: "https://kintag.vercel.app/#/?view=notifications"
        }
      },
      tokens: tokens, // 🌟 Sends to the array of ALL tokens simultaneously!
    };

    // 3. Fire the Broadcast!
    const response = await admin.messaging().sendMulticast(message);
    
    res.status(200).json({ success: true, sentCount: response.successCount });
  } catch (error) {
    console.error("Broadcast Error:", error);
    res.status(500).json({ error: error.message });
  }
}
