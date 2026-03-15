import admin from 'firebase-admin';

// Initialize the Firebase Admin SDK securely
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
  
  const { type, ownerId, title, body } = req.body;

  try {
    const db = admin.firestore();

    // 🌟 THE NEW GLOBAL BROADCAST LOGIC
    if (type === 'broadcast') {
      const usersSnap = await db.collection('users').get();
      const tokens = [];
      
      usersSnap.forEach(doc => {
        if (doc.data().fcmToken) tokens.push(doc.data().fcmToken);
      });

      if (tokens.length === 0) {
        return res.status(200).json({ success: true, message: "No tokens found." });
      }

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
        tokens: tokens, // Array of all tokens in database
      };

      const response = await admin.messaging().sendMulticast(message);
      return res.status(200).json({ success: true, sentCount: response.successCount });
    }

    // ---------------------------------------------------------
    // ORIGINAL LOGIC FOR SCANS / ALERTS (Specific User)
    // ---------------------------------------------------------
    if (!ownerId) {
      return res.status(400).json({ error: "Owner ID required for direct notifications" });
    }

    const userDoc = await db.collection('users').doc(ownerId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "Owner not found" });
    
    const fcmToken = userDoc.data().fcmToken;
    if (!fcmToken) return res.status(400).json({ error: "Owner has no FCM token saved" });

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
      token: fcmToken,
    };

    await admin.messaging().send(message);
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Push Error Details:", error);
    
    // Automatically clean up dead tokens to prevent crashes
    if (error.code === 'messaging/registration-token-not-registered') {
        if (ownerId) {
            const db = admin.firestore();
            await db.collection('users').doc(ownerId).update({
                fcmToken: admin.firestore.FieldValue.delete()
            });
            return res.status(200).json({ success: true, message: "Dead token cleaned up automatically." });
        }
    }

    return res.status(500).json({ error: error.message, code: error.code });
  }
}
