import React, { useState, useEffect, useRef } from 'react';
import { Mic, ArrowRight, X, Volume2, VolumeX, Loader2, Power, Copy, Check } from 'lucide-react';

// 🌟 YOUR EXACT HUGEICONS IMPORTS
import { HugeiconsIcon } from "@hugeicons/react";
import { WhatsappIcon, TelegramIcon } from "@hugeicons/core-free-icons";

// 🛑 REPLACE THESE WITH YOUR ACTUAL PROFILE LINKS
const MY_WHATSAPP_LINK = "https://wa.me/918777845713"; 
const MY_TELEGRAM_LINK = "https://t.me/X_o_x_o_002";

const WELCOME_MESSAGE = { id: 'welcome', role: 'ai', content: "Hi! I'm KinBot, welcome to KinTag. How can I help you today?" };

export default function AIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice, Audio & UI States
  const [isListening, setIsListening] = useState(false);
  const [voicePreference, setVoicePreference] = useState('female'); 
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [audioLoadingId, setAudioLoadingId] = useState(null);
  const [audioErrorId, setAudioErrorId] = useState(null);
  const [copiedId, setCopiedId] = useState(null); // Tracks which message was copied
  
  const audioContextRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const hasExportedRef = useRef(false);

  // ─── UTILITIES ───
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000); // Reset checkmark after 2s
  };

  // ─── CHAT LOGGING ENGINE ───
  const exportChatToTelegram = async (reason, currentMessages) => {
    if (currentMessages.length <= 1 || hasExportedRef.current) return;
    
    try {
      await fetch('/api/log', {
        method: 'POST',
        keepalive: true, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages, reason })
      });
      hasExportedRef.current = true; 
    } catch (e) {
      console.error("Failed to export chat:", e);
    }
  };

  const handleEndChat = () => {
    stopAudio();
    exportChatToTelegram("Manual 'End Chat' Button", messages);
    setMessages([WELCOME_MESSAGE]);
    setIsOpen(false);
    hasExportedRef.current = false; 
  };

  // ─── LISTENERS (Network, Unload, & Timers) ───
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    const handleBeforeUnload = () => {
      exportChatToTelegram("Page Refresh/Leave", messages);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.speechSynthesis.getVoices(); 

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [messages]);

  useEffect(() => {
    if (messages.length > 1) {
      hasExportedRef.current = false; 
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      
      inactivityTimerRef.current = setTimeout(() => {
        exportChatToTelegram("2-Minute Inactivity", messages);
      }, 120000); 
    }

    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [messages, isOpen, speakingMessageId]);

  // ─── AUDIO ENGINE ───
  const stopAudio = () => {
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
  };

  const playCloudAudio = async (base64, id) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;
      const bytes = new Uint8Array(window.atob(base64).split("").map(c => c.charCodeAt(0)));
      const float32 = new Float32Array(bytes.length / 2);
      const dv = new DataView(bytes.buffer);
      for (let i = 0; i < float32.length; i++) float32[i] = dv.getInt16(i * 2, true) / 32768.0;
      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      setSpeakingMessageId(id);
      source.onended = () => setSpeakingMessageId(null);
      source.start();
    } catch (e) { setSpeakingMessageId(null); }
  };

  const playBrowserTTS = (text, id) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voicePreference === 'female' 
      ? voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha'))
      : voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david'));
    
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const fetchAudio = async (text, id) => {
    if (!isOnline) return;
    stopAudio(); setAudioLoadingId(id); setAudioErrorId(null);
    try {
      const res = await fetch('/api/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ isAudioRequest: true, textToSpeak: text, voicePreference }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      playCloudAudio(data.audioBase64, id);
    } catch (e) { 
      playBrowserTTS(text, id);
      setAudioErrorId(id); setTimeout(() => setAudioErrorId(null), 3000); 
    } finally { setAudioLoadingId(null); }
  };

  // ─── TEXT CHAT SUBMISSION ───
  const executeSend = async (overrideText = null) => {
    const text = (overrideText || inputText).trim();
    if (!text || !isOnline) return;
    
    stopAudio(); setIsOpen(true);
    const userMsg = { id: Date.now().toString(), role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInputText(''); setIsLoading(true);
    
    try {
      const res = await fetch('/api/chat', { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ messages: history, isAudioRequest: false }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: data.reply }]);
    } catch (e) { 
      setMessages(prev => [...prev, { id: 'err', role: 'ai', content: `⚠️ ${e.message}` }]); 
    } finally { setIsLoading(false); }
  };

  // ─── SPEECH TO TEXT ───
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    setIsOpen(true);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false; recognitionRef.current.interimResults = true; recognitionRef.current.lang = 'en-US';
    recognitionRef.current.onstart = () => { setIsListening(true); stopAudio(); };
    let finalTranscript = '';
    recognitionRef.current.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setInputText(interim || finalTranscript);
    };
    recognitionRef.current.onend = () => {
      setIsListening(false);
      const cleanedText = finalTranscript.trim().replace(/king\s?tag/gi, 'KinTag').replace(/can\s?tag/gi, 'KinTag');
      if (cleanedText) executeSend(cleanedText);
    };
    recognitionRef.current.start();
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[100] flex flex-col items-center pointer-events-none">
      
      {/* ── CHAT WINDOW (Added smooth fade-in and slide-up animation) ── */}
      {isOpen && (
        <div className="bg-[#1c1c1e] rounded-[2rem] w-full mb-4 shadow-2xl border border-zinc-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-24 duration-500 ease-out pointer-events-auto">
          
          <div className="p-4 flex justify-between items-center border-b border-zinc-800">
            <select value={voicePreference} onChange={(e) => { setVoicePreference(e.target.value); stopAudio(); }} className="bg-zinc-800 text-[10px] uppercase font-bold text-zinc-300 rounded-lg px-2 py-1 outline-none cursor-pointer">
              <option value="female">Female Voice</option>
              <option value="male">Male Voice</option>
            </select>
            
            <div className="flex items-center gap-2">
              <button onClick={handleEndChat} className="flex items-center gap-1 text-[10px] uppercase font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg transition-colors">
                <Power size={12} /> End Chat
              </button>
              <button onClick={() => { setIsOpen(false); stopAudio(); }} className="text-zinc-400 hover:text-white transition-colors ml-2">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[50vh]">
            {!isOnline && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs p-3 rounded-2xl font-bold text-center">
                KinBot is offline. Please check your connection.
              </div>
            )}
            
            {messages.map((msg) => {
              const textContent = msg.content.toLowerCase();
              const mentionsWhatsApp = textContent.includes('whatsapp');
              const mentionsTelegram = textContent.includes('telegram');

              return (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`relative group max-w-[85%] w-full ${msg.role === 'ai' ? 'mb-5' : ''}`}>
                    
                    {/* Added pt-8 so text doesn't overlap with the top-corner copy buttons */}
                    <div className={`relative p-4 pt-8 rounded-2xl text-[15px] leading-relaxed transition-all whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#2c2c2e] text-white rounded-br-sm ml-auto w-fit' : 'bg-[#2c2c2e] text-zinc-300 rounded-bl-sm'} ${msg.id === speakingMessageId ? 'ring-2 ring-brandGold shadow-[0_0_15px_rgba(205,164,52,0.15)] text-white bg-[#353538]' : ''}`}>
                      
                      {/* 🌟 ALWAYS VISIBLE COPY BUTTONS */}
                      <button 
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className={`absolute top-2 ${msg.role === 'ai' ? 'right-2' : 'left-2'} p-1 rounded-md hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center`}
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>

                      {msg.content}
                      
                      {/* HUGEICONS SMART BUTTONS */}
                      {msg.role === 'ai' && (mentionsWhatsApp || mentionsTelegram) && (
                        <div className="flex flex-row gap-2 mt-4 pt-4 border-t border-zinc-700/50 w-full">
                          {mentionsWhatsApp && (
                            <a href={MY_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/30 py-2 px-2 rounded-xl text-[11px] font-bold transition-colors min-w-0">
                              <HugeiconsIcon icon={WhatsappIcon} size={16} className="shrink-0" />
                              <span className="truncate">WhatsApp</span>
                            </a>
                          )}
                          {mentionsTelegram && (
                            <a href={MY_TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 bg-[#2AABEE]/10 text-[#2AABEE] hover:bg-[#2AABEE]/20 border border-[#2AABEE]/30 py-2 px-2 rounded-xl text-[11px] font-bold transition-colors min-w-0">
                              <HugeiconsIcon icon={TelegramIcon} size={16} className="shrink-0" />
                              <span className="truncate">Telegram</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* HOVER SPEAKER BUTTON */}
                    {msg.role === 'ai' && msg.id !== 'welcome' && msg.id !== 'err' && (
                      <div className="absolute -bottom-6 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 z-20">
                        <button onClick={() => msg.id === speakingMessageId ? stopAudio() : fetchAudio(msg.content, msg.id)} disabled={audioLoadingId === msg.id} className={`p-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors flex items-center justify-center ${msg.id === speakingMessageId ? 'text-brandGold border-brandGold/30' : ''}`}>
                          {audioLoadingId === msg.id ? <Loader2 size={12} className="animate-spin text-brandGold" /> : msg.id === speakingMessageId ? <VolumeX size={12} /> : <Volume2 size={12} />}
                        </button>
                        {audioErrorId === msg.id && <span className="text-[10px] text-zinc-400 font-medium bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">Local Voice</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="p-4 rounded-2xl bg-[#2c2c2e] flex gap-1.5 items-center h-12">
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
          
          <div className="bg-[#1c1c1e] border-t border-zinc-800/80 py-2.5 px-4 flex flex-col gap-1 text-center shrink-0">
             <p className="text-[11px] text-zinc-500 font-medium tracking-wide">Powered by <strong className="text-zinc-300 font-bold">KinBot AI</strong></p>
             <p className="text-[9px] text-zinc-600 leading-tight">By using this bot you're consenting to let us use your chat data to improve this AI.</p>
          </div>
        </div>
      )}

      {/* ── INPUT PILL (Added smooth inner transitions) ── */}
      <div className="h-16 w-full bg-zinc-900 rounded-full flex items-center p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-zinc-800 pointer-events-auto relative overflow-hidden transition-all duration-300">
        
        {/* Voice Mode Wrapper */}
        <div className={`absolute inset-1.5 right-1.5 flex transition-all duration-300 ease-in-out ${isListening ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
            <div className="flex-1 h-full bg-white rounded-full flex items-center pl-2 pr-5 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center relative shrink-0">
                  <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-20"></div>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
                <span className="text-sm font-extrabold tracking-widest text-zinc-800 uppercase truncate max-w-[120px] sm:max-w-[180px]">
                  {inputText || "Listening..."}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <div className="w-1 h-3 bg-zinc-400 rounded-full animate-[bounce_1s_infinite]"></div>
                <div className="w-1 h-5 bg-zinc-600 rounded-full animate-[bounce_1s_infinite_0.2s]"></div>
                <div className="w-1 h-4 bg-zinc-500 rounded-full animate-[bounce_1s_infinite_0.4s]"></div>
                <div className="w-1 h-2 bg-zinc-400 rounded-full animate-[bounce_1s_infinite_0.1s]"></div>
              </div>
            </div>
            <button onClick={() => { if(recognitionRef.current) recognitionRef.current.stop(); setIsListening(false); setInputText(''); }} className="w-14 h-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0">
              <X size={20} />
            </button>
        </div>

        {/* Text Mode Wrapper */}
        <div className={`w-full h-full flex items-center transition-all duration-300 ease-in-out ${!isListening ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
            <button onClick={startListening} disabled={!isOnline} className="w-14 h-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors disabled:opacity-50 shrink-0">
              <Mic size={20} />
            </button>
            <div className="flex-1 h-full bg-white rounded-full flex items-center pl-4 pr-1.5 transition-all">
              <input disabled={!isOnline || isLoading} type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onFocus={() => setIsOpen(true)} onKeyDown={(e) => e.key === 'Enter' && executeSend()} placeholder={isOnline ? "Ask me anything..." : "AI offline..."} className="flex-1 bg-transparent outline-none text-zinc-900 font-medium placeholder:text-zinc-400 min-w-0" />
              <button onClick={() => executeSend()} disabled={!isOnline || !inputText.trim() || isLoading} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-white hover:bg-black transition-transform active:scale-95 disabled:opacity-50 shrink-0">
                <ArrowRight size={18} />
              </button>
            </div>
        </div>

      </div>
    </div>
  );
}
