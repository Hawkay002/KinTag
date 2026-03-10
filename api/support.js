export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { supportId, name, email, platform, countryCode, contactValue, message } = req.body;

  // Make sure these are added to your Vercel / local .env file!
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return res.status(500).json({ error: "Telegram Bot is not configured on the server." });
  }

  let contactInfo = "";
  let replyUrl = "";
  let replyText = "";

  // 🌟 NEW: Create the pre-filled response message dynamically
  // We truncate their original message to 60 chars so the URL doesn't break
  const shortUserMessage = message.length > 60 ? message.substring(0, 60) + '...' : message;
  
  // Create the exact message you want to send them, heavily URL-encoded so it transfers perfectly
  const preFilledMessage = `Hello ${name}, we've received your KinTag support request (${supportId}) regarding: "${shortUserMessage}"\n\nCould you please elaborate about this a bit more so we can help you quickly?`;
  const encodedText = encodeURIComponent(preFilledMessage);

  // Format the contact info and create the dynamic reply button
  if (platform === 'whatsapp') {
    const cleanPhone = contactValue.replace(/\D/g, ''); // Remove non-numeric characters
    const fullPhone = countryCode.replace('+', '') + cleanPhone;
    contactInfo = `WhatsApp: ${countryCode} ${contactValue}`;
    // Attach the pre-filled text to the WhatsApp link
    replyUrl = `https://wa.me/${fullPhone}?text=${encodedText}`;
    replyText = "Reply on WhatsApp";
  } else {
    const cleanTg = contactValue.startsWith('@') ? contactValue.substring(1) : contactValue;
    contactInfo = `Telegram: @${cleanTg}`;
    // Attach the pre-filled text to the Telegram link
    replyUrl = `https://t.me/${cleanTg}?text=${encodedText}`;
    replyText = "Reply on Telegram";
  }

  // Format the admin notification message safely using HTML
  const tgMessage = `🚨 <b>New Support Request</b>\n\n<b>ID:</b> <code>${supportId}</code>\n<b>Name:</b> ${name}\n<b>Email:</b> ${email}\n<b>Platform:</b> ${contactInfo}\n\n<b>Message:</b>\n${message}`;

  const payload = {
    chat_id: chatId,
    text: tgMessage,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: replyText, url: replyUrl }]
      ]
    }
  };

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Failed to send message to Telegram.");
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Support API Error:", err);
    res.status(500).json({ error: err.message });
  }
}
