import admin from 'firebase-admin';
import nodemailer from 'nodemailer';

// --- SECURITY UTILITIES ---
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; 
const MAX_REQUESTS_PER_WINDOW = 3; 

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

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

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
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const db = admin.firestore();
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await db.collection('otps').doc(email.toLowerCase()).set({
      code: otp,
      expiresAt: Date.now() + 15 * 60 * 1000 
    });

    const htmlTemplate = `
      <div style="font-family: sans-serif; max-w-md; margin: auto; padding: 30px; text-align: center; background: #fafafa; border-radius: 16px; border: 1px solid #e4e4e7;">
        <img src="https://kintag.vercel.app/kintag-logo.png" width="60" style="border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
        <h2 style="color: #18181b; font-size: 24px; margin-bottom: 10px;">Verify your Email</h2>
        <p style="color: #52525b; font-size: 16px; line-height: 1.5;">Here is your secure verification code for KinTag:</p>
        <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #18181b; margin: 30px 0; padding: 20px; background: #ffffff; border-radius: 12px; border: 2px dashed #e4e4e7;">
          ${otp}
        </div>
        <p style="color: #a1a1aa; font-size: 12px;">This code expires in 15 minutes. Do not share it with anyone.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"KinTag Security" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: '🔒 Your KinTag Verification Code',
      html: htmlTemplate,
    });

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ error: error.message });
  }
}
