import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── RATE LIMITER CONFIGURATION ───
const rateLimitMap = new Map();
const LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 7; // Max 7 messages per minute per IP

// Clean up the memory map every 10 minutes so Vercel doesn't run out of RAM
setInterval(() => rateLimitMap.clear(), 10 * 60 * 1000);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // ─── STEP 1: RATE LIMITING LOGIC ───
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown_ip';
    const currentTime = Date.now();

    if (rateLimitMap.has(ip)) {
      const userRequests = rateLimitMap.get(ip);
      const recentRequests = userRequests.filter(timestamp => currentTime - timestamp < LIMIT_WINDOW_MS);
      
      if (recentRequests.length >= MAX_REQUESTS) {
        return res.status(429).json({ 
          error: "You're sending messages too fast! Please wait a minute and try again." 
        });
      }
      
      recentRequests.push(currentTime);
      rateLimitMap.set(ip, recentRequests);
    } else {
      rateLimitMap.set(ip, [currentTime]);
    }

    // ─── STEP 2: MESSAGE VALIDATION ───
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Valid messages array is required' });
    }

    // ─── STEP 3: KINTAG BRAIN INITIALIZATION ───
    let kintagKnowledge = "You are a helpful assistant for KinTag.";
    try {
      const brainPath = path.join(process.cwd(), 'kintag-brain.md');
      kintagKnowledge = fs.readFileSync(brainPath, 'utf8');
    } catch (err) {
      console.warn("Could not find kintag-brain.md, using fallback knowledge.");
    }

    // 🔥 UPDATED TO GEMINI-2.5-FLASH
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', 
      systemInstruction: kintagKnowledge 
    });

    // ─── STEP 4: CHAT GENERATION ───
    // Format the chat history for Gemini
    let formattedHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Gemini API strictly requires the history to start with a 'user' message.
    // We remove the initial KinBot welcome message from the array before sending it.
    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    const latestMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(latestMessage);
    const aiReply = result.response.text();

    return res.status(200).json({ reply: aiReply });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: 'Failed to generate response.' });
  }
}
