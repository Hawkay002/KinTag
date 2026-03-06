import admin from 'firebase-admin';
import nodemailer from 'nodemailer';

// Initialize Firebase Admin (Same as your other APIs)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^"|"$/g, ''),
    }),
  });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { email } = req.body;

  try {
    const db = admin.firestore();
    
    // 1. Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 2. Save to Firestore (Expires in 15 minutes)
    await db.collection('otps').doc(email.toLowerCase()).set({
      code: otp,
      expiresAt: Date.now() + 15 * 60 * 1000 
    });

    // 3. Email the OTP using your custom template
    const htmlTemplate = `
      <div style="font-family: sans-serif; max-w-md; margin: auto; padding: 30px; text-align: center; background: #fafafa; border-radius: 16px; border: 1px solid #e4e4e7;">
        <h2 style="color: #18181b;">Verify your Email</h2>
        <p style="color: #52525b; font-size: 16px;">Here is your secure verification code for KinTag:</p>
        <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #18181b; margin: 30px 0;">
          ${otp}
        </div>
        <p style="color: #a1a1aa; font-size: 12px;">This code expires in 15 minutes.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"KinTag Security" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: '🔒 Your KinTag Verification Code',
      html: htmlTemplate,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
