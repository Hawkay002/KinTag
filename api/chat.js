import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── RATE LIMITER CONFIGURATION ───
const rateLimitMap = new Map();
const LIMIT_WINDOW_MS = 60 * 1000; 
const MAX_REQUESTS = 7; 

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
    const { messages, voicePreference } = req.body; // 🌟 NEW: We receive the voice preference
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

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', 
      systemInstruction: kintagKnowledge 
    });

    // ─── STEP 4: GENERATE TEXT CHAT ───
    let formattedHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    const latestMessage = messages[messages.length - 1].content;
    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(latestMessage);
    const aiReply = result.response.text();

    // ─── STEP 5: GENERATE HYPER-REALISTIC AUDIO (GEMINI TTS) ───
    let audioBase64 = null;
    try {
      // 'Puck' is Gemini's male voice. 'Kore' is the female voice.
      const voiceName = voicePreference === 'male' ? 'Puck' : 'Kore';
      
      // We use the REST API here to ensure we hit the dedicated TTS model
      const ttsUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      const ttsResponse = await fetch(ttsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: aiReply }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName }
              }
            }
          }
        })
      });

      const ttsData = await ttsResponse.json();
      if (ttsData.candidates && ttsData.candidates[0].content?.parts?.[0]?.inlineData?.data) {
        audioBase64 = ttsData.candidates[0].content.parts[0].inlineData.data;
      }
    } catch (ttsError) {
      console.error("TTS Generation Error:", ttsError);
      // If audio fails for any reason, the text chat will still work perfectly!
    }

    return res.status(200).json({ reply: aiReply, audioBase64: audioBase64 });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: 'Failed to generate response.' });
  }
}
