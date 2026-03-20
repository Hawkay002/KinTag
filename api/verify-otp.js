import admin from 'firebase-admin';

// --- SECURITY UTILITIES ---
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; 
const MAX_REQUESTS_PER_WINDOW = 5; 

const sanitizeInput = (input, maxLength = 255) => {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[<>{}()$]/g, '').trim().substring(0, maxLength);
};

const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.replace(/[<>{}()$\s]/g, '').toLowerCase().substring(0, 255);
};
// --------------------------

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
  
  // --- RATE LIMITER ---
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown-ip';
  const currentTime = Date.now();
  if (rateLimitMap.has(ip)) {
    const clientData = rateLimitMap.get(ip);
    if (currentTime < clientData.resetTime) {
      if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }
      clientData.count += 1;
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: currentTime + RATE_LIMIT_WINDOW_MS });
    }
  } else {
    rateLimitMap.set(ip, { count: 1, resetTime: currentTime + RATE_LIMIT_WINDOW_MS });
  }
  // --------------------

  const email = sanitizeEmail(req.body.email);
  const otp = sanitizeInput(req.body.otp, 10); 
  
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
