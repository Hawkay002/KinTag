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
  
  const { email, otp } = req.body; 
  if (!email || !otp) return res.status(400).json({ error: "Missing required fields" });

  try {
    const db = admin.firestore();
    const otpRef = db.collection('otps').doc(email.toLowerCase());
    const otpDoc = await otpRef.get();

    if (!otpDoc.exists) return res.status(400).json({ error: "No verification code found. Please resend." });

    const data = otpDoc.data();

    if (Date.now() > data.expiresAt) {
      await otpRef.delete();
      return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }

    if (data.code !== otp) {
      return res.status(400).json({ error: "Invalid verification code. Please try again." });
    }

    // Success! Clean up the used OTP
    await otpRef.delete();

    res.status(200).json({ success: true, message: "Email successfully verified!" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ error: error.message });
  }
}
