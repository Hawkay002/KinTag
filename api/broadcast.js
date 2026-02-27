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
  const { title, body } = req.body;

  try {
    const db = admin.firestore();
    const usersSnap = await db.collection('users').get();
    const tokens = [];
    
    usersSnap.forEach(doc => {
      if (doc.data().fcmToken) tokens.push(doc.data().fcmToken);
    });

    if (tokens.length === 0) return res.status(200).json({ success: true, message: "No tokens found." });

    const message = {
      notification: { title, body },
      webpush: {
        notification: {
          icon: "https://kintag.vercel.app/kintag-logo.png",
          data: { url: "https://kintag.vercel.app/#/?view=notifications" }
        },
        fcmOptions: {
          link: "https://kintag.vercel.app/#/?view=notifications"
        }
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    res.status(200).json({ success: true, sentCount: response.successCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
