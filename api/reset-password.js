import admin from 'firebase-admin';
import nodemailer from 'nodemailer';

// 1. Initialize Firebase Admin
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

// 2. Configure your Google SMTP Transporter
// (Use the exact same env variables you use for your welcome email)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,     // Your Gmail address
    pass: process.env.SMTP_PASSWORD,  // Your 16-character Google App Password
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // 3. Generate the actual reset link from Firebase
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    // 4. Build your Custom HTML Template
    const customHtmlTemplate = `
      <div style="font-family: sans-serif; max-w-md; margin: auto; padding: 30px; background: #fafafa; border-radius: 16px; border: 1px solid #e4e4e7; text-align: center;">
        <img src="https://kintag.vercel.app/kintag-logo.png" width="60" style="border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
        <h2 style="color: #18181b; font-size: 24px; margin-bottom: 10px; font-weight: 800;">Reset Your Password</h2>
        <p style="color: #52525b; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
          We received a request to reset the password for your KinTag account. Click the button below to choose a new password.
        </p>
        <a href="${resetLink}" style="display: inline-block; background-color: #18181b; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
          Reset Password
        </a>
        <p style="color: #a1a1aa; font-size: 12px; margin-top: 40px;">
          If you didn't request this, you can safely ignore this email. Your password will not change until you create a new one.
        </p>
      </div>
    `;

    // 5. Send the email using Google SMTP
    await transporter.sendMail({
      from: `"KinTag Security" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: '🔒 Reset your KinTag Password',
      html: customHtmlTemplate,
    });

    res.status(200).json({ success: true, message: "Custom reset email sent via Google SMTP!" });
  } catch (error) {
    console.error("Reset Email Error:", error);
    
    // Handle the specific case where the user doesn't exist in Firebase
    if (error.code === 'auth/user-not-found') {
        return res.status(404).json({ error: "No account found with this email address." });
    }
    
    res.status(500).json({ error: error.message });
  }
}
