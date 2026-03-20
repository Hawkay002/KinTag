import nodemailer from 'nodemailer';

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

  const supportId = sanitizeInput(req.body.supportId, 50);
  const email = sanitizeEmail(req.body.email);
  
  if (!supportId || !email) return res.status(400).json({ error: "Missing required fields" });

  try {
    const htmlTemplate = `
      <div style="font-family: sans-serif; max-w-md; margin: auto; padding: 30px; text-align: center; background: #fafafa; border-radius: 16px; border: 1px solid #e4e4e7;">
        <img src="https://kintag.vercel.app/kintag-logo.png" width="60" style="border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
        <h2 style="color: #18181b; font-size: 24px; margin-bottom: 10px;">Ticket Resolved</h2>
        <p style="color: #52525b; font-size: 16px; line-height: 1.5;">Your support request has been successfully marked as resolved and closed:</p>
        <div style="font-size: 24px; font-family: monospace; font-weight: 900; letter-spacing: 4px; color: #18181b; margin: 30px 0; padding: 15px; background: #ffffff; border-radius: 12px; border: 2px dashed #10b981;">
          ${supportId}
        </div>
        <p style="color: #a1a1aa; font-size: 14px;">Thank you for using KinTag to secure your family!</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"KinTag Support" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: `✅ Ticket Resolved: ${supportId}`,
      html: htmlTemplate,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Resolve Ticket Error:", error);
    res.status(500).json({ error: error.message });
  }
}
