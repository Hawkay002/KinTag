import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { userEmail, userName } = req.body;

  try {
    // 1. Log into your Google SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL, // Your Gmail address
        pass: process.env.SMTP_PASSWORD // Your 16-digit Google App Password
      }
    });

    // Uses their name if they used Google, otherwise uses their Email ID
    const greetingName = userName || userEmail;

    // 2. Build the beautiful Welcome Email with Logo and Button
    const mailOptions = {
      from: `"KinTag Team" <${process.env.SMTP_EMAIL}>`,
      to: userEmail,
      subject: 'Welcome to the KinTag Family!',
      html: `
        <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: auto; padding: 30px; color: #18181b; background-color: #ffffff; border: 1px solid #f4f4f5; border-radius: 24px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);">
          
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://kintag.vercel.app/kintag-logo.png" alt="KinTag Logo" style="width: 72px; height: 72px; border-radius: 16px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
          </div>

          <h1 style="color: #d97706; text-align: center; font-size: 24px; margin-bottom: 8px;">Hi ${greetingName}!</h1>
          <h2 style="text-align: center; font-size: 18px; color: #18181b; margin-top: 0; margin-bottom: 24px;">Welcome to KinTag.</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #3f3f46;">We are so incredibly glad you are taking the next step in securing the kids and pets you love most.</p>
          <p style="font-size: 16px; line-height: 1.6; color: #3f3f46;">Your account is ready to go. Head over to your dashboard to create your very first digital contact card and download your custom QR code.</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://kintag.vercel.app/#/" style="background-color: #18181b; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 14px; font-weight: bold; font-size: 16px; display: inline-block;">Go to Dashboard</a>
          </div>

          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
          
          <p style="font-size: 14px; color: #71717a; text-align: center; margin: 0;">Stay safe,<br/><strong style="color: #18181b;">The KinTag Team</strong></p>
        </div>
      `
    };

    // 3. Send it!
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ success: true, message: "Welcome email sent!" });
  } catch (error) {
    console.error("SMTP Error:", error);
    res.status(500).json({ error: error.message });
  }
}
