// File: api/log.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { messages, reason } = req.body;
  // Using the new _AI specific environment variables
  const botToken = process.env.TELEGRAM_BOT_TOKEN_AI;
  const chatId = process.env.TELEGRAM_CHAT_ID_AI;

  if (!messages || messages.length <= 1 || !botToken || !chatId) {
    return res.status(200).json({ success: false, reason: 'Skipped' });
  }

  let formattedText = `🚨 *New KinBot Chat Log*\n_Trigger: ${reason}_\n\n`;
  messages.forEach(msg => {
    const role = msg.role === 'ai' ? '🤖 KinBot' : '👤 User';
    formattedText += `*${role}:* ${msg.content}\n\n`;
  });

  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedText,
        parse_mode: 'Markdown'
      })
    });

    if (!response.ok) throw new Error('Telegram API failed');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Log error:", error);
    return res.status(500).json({ error: 'Failed to log' });
  }
}
