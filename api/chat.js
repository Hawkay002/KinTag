import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const rateLimitMap = new Map();
const LIMIT_WINDOW_MS = 60 * 1000; 
const MAX_REQUESTS = 10; 

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  if (!process.env.GEMINI_API_KEY) {
    console.error("CRITICAL: GEMINI_API_KEY is missing from environment variables.");
    return res.status(500).json({ error: "API Key Configuration Error" });
  }

  try {
    // ─── 1. RATE LIMITING SHIELD ───
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown_ip';
    const currentTime = Date.now();

    if (rateLimitMap.has(ip)) {
      const userRequests = rateLimitMap.get(ip);
      const recentRequests = userRequests.filter(ts => currentTime - ts < LIMIT_WINDOW_MS);
      if (recentRequests.length >= MAX_REQUESTS) {
        return res.status(429).json({ error: "Rate limit reached. Try again in 60 seconds." });
      }
      recentRequests.push(currentTime);
      rateLimitMap.set(ip, recentRequests);
    } else {
      rateLimitMap.set(ip, [currentTime]);
    }

    const { messages, voicePreference, isAudioRequest, textToSpeak } = req.body; 

    // ─── 2. ON-DEMAND AUDIO REQUESTS (Gemini 2.5 TTS) ───
    if (isAudioRequest) {
      if (!textToSpeak) return res.status(400).json({ error: 'No text provided for audio generation.' });

      const voiceName = voicePreference === 'male' ? 'Puck' : 'Kore';
      const ttsUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      const ttsResponse = await fetch(ttsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: textToSpeak }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } }
          }
        })
      });

      const ttsData = await ttsResponse.json();
      if (!ttsResponse.ok) throw new Error(ttsData.error?.message || "Voice Generation Failed");
      return res.status(200).json({ audioBase64: ttsData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data });
    }

    // ─── 3. TEXT CHAT REQUESTS (Gemma 3 27B) ───
    let kintagKnowledge = "You are KinBot, a helpful assistant for KinTag.";
    try {
      const brainPath = path.join(process.cwd(), 'kintag-brain.md');
      kintagKnowledge = fs.readFileSync(brainPath, 'utf8');
    } catch (err) { }

    // 🌟 THE FIX: Initialize model WITHOUT systemInstruction
    const model = genAI.getGenerativeModel({ 
      model: 'gemma-3-27b-it' 
    });

    let systemContextAdded = false;

    // Format history and strip the hardcoded welcome message
    const formattedHistory = messages.slice(0, -1)
      .filter(msg => msg.id !== 'welcome') 
      .map(msg => {
        let text = msg.content;
        
        // 🌟 THE FIX: Inject the knowledge base into the very first user message
        if (msg.role === 'user' && !systemContextAdded) {
          text = `[System Context: ${kintagKnowledge}]\n\n${text}`;
          systemContextAdded = true;
        }

        return {
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: [{ text }]
        };
      });

    let latestMessageText = messages[messages.length - 1].content;
    
    // 🌟 THE FIX: If there is no history, inject the knowledge into the current message
    if (!systemContextAdded) {
      latestMessageText = `[System Context: ${kintagKnowledge}]\n\n${latestMessageText}`;
    }

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(latestMessageText);
    
    return res.status(200).json({ reply: result.response.text() });

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message || 'Internal connection error. Please try again.' });
  }
}
