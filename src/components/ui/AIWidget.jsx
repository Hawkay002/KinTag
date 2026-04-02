import React, { useState, useEffect, useRef } from 'react';
import { Mic, ArrowRight, X, Volume2, VolumeX, Loader2, Info } from 'lucide-react';

export default function AIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'ai', content: "Hi there! I'm KinBot, Welcome to KinTag. I'm here to help you get started with our digital safety platform for your family, pets, or loved ones.\n\nAre you looking to learn more about how it works, or would you like help getting set up?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [voicePreference, setVoicePreference] = useState('female'); 
  
  // Audio Playback State
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [audioLoadingId, setAudioLoadingId] = useState(null);
  const [audioErrorId, setAudioErrorId] = useState(null);
  const audioContextRef = useRef(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, speakingMessageId, audioErrorId]);

  const sanitizeTranscript = (text) => {
    let clean = text;
    clean = clean.replace(/king\s?tag/gi, 'KinTag');
    clean = clean.replace(/can\s?tag/gi, 'KinTag');
    clean = clean.replace(/kim\s?tag/gi, 'KinTag');
    return clean;
  };

  const stopAudio = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setSpeakingMessageId(null);
  };

  const playGeminiAudio = async (base64Audio, messageId) => {
    if (!base64Audio) return;
    stopAudio();

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const binaryString = window.atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const dataView = new DataView(bytes.buffer);
      const floatArray = new Float32Array(bytes.length / 2);
      for (let i = 0; i < floatArray.length; i++) {
        const int16 = dataView.getInt16(i * 2, true); 
        floatArray[i] = int16 / 32768.0;
      }
      
      const buffer = audioCtx.createBuffer(1, floatArray.length, 24000);
      buffer.getChannelData(0).set(floatArray);
      
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      
      setSpeakingMessageId(messageId);
      source.onended = () => setSpeakingMessageId(null);
      source.start();

    } catch (err) {
      console.error("Audio playback error:", err);
      setSpeakingMessageId(null);
    }
  };

  // 🌟 NEW: Fetch audio on demand only when the button is clicked
  const fetchAndPlayAudio = async (text, messageId) => {
    if (!isOnline) return;
    stopAudio(); 
    setAudioLoadingId(messageId);
    setAudioErrorId(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isAudioRequest: true, 
          textToSpeak: text,
          voicePreference: voicePreference 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Failed to load audio");

      if (data.audioBase64) {
        playGeminiAudio(data.audioBase64, messageId);
      }
    } catch (err) {
      console.error(err);
      setAudioErrorId(messageId);
      setTimeout(() => setAudioErrorId(null), 3000); // Clear error after 3s
    } finally {
      setAudioLoadingId(null);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support voice input.");
      return;
    }
    
    setIsOpen(true);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false; 
    recognitionRef.current.interimResults = true; 
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      stopAudio(); 
    };

    let finalTranscript = '';
    recognitionRef.current.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInputText(interim || finalTranscript);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        const cleanText = sanitizeTranscript(finalTranscript);
        setInputText('');
        executeSend(cleanText); 
      }
    };

    recognitionRef.current.start();
  };

  const cancelListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInputText('');
    }
  };

  const executeSend = async (textToSend) => {
    const text = textToSend || sanitizeTranscript(inputText);
    if (!text.trim() || !isOnline) return;

    stopAudio(); 
    setIsOpen(true);

    const userMsg = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          isAudioRequest: false // Explicitly state we only want text
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Connection error");

      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', content: data.reply }]);
      
      // Note: We no longer auto-play audio here!

    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: error.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[100] flex flex-col items-center pointer-events-none">
      
      {/* ── THE CHAT BOX ── */}
      {isOpen && (
        <div className="bg-[#1c1c1e] rounded-[2rem] w-full mb-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-zinc-800/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto relative">
          
          <button onClick={() => { setIsOpen(false); stopAudio(); }} className="absolute top-4 right-4 bg-zinc-800 p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors z-10">
            <X size={16} />
          </button>

          <div className="flex items-center justify-between px-5 pt-5 pb-2">
             <select 
                value={voicePreference} 
                onChange={(e) => {
                  setVoicePreference(e.target.value);
                  stopAudio();
                }}
                className="bg-zinc-800 border border-zinc-700 text-[10px] uppercase font-bold tracking-wider text-zinc-300 rounded-lg px-2 py-1 outline-none appearance-none cursor-pointer hover:bg-zinc-700 transition-colors"
              >
                <option value="female">Female Voice</option>
                <option value="male">Male Voice</option>
              </select>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[50vh]">
            {!isOnline && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs p-3 rounded-2xl font-bold text-center flex items-center justify-center gap-2">
                <Info size={14}/> AI is resting while you are offline.
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {/* 🌟 NEW: Added bottom margin to AI bubbles to make room for the absolute button */}
                <div className={`relative group/bubble max-w-[85%] ${msg.role === 'ai' ? 'mb-5' : ''}`}>
                  
                  <div className={`p-4 rounded-2xl text-[15px] leading-relaxed font-medium transition-all duration-500 relative z-10 whitespace-pre-wrap
                    ${msg.role === 'user' ? 'bg-[#2c2c2e] text-white rounded-br-sm' : 'bg-[#2c2c2e] text-zinc-300 rounded-bl-sm'} 
                    ${msg.id === speakingMessageId ? 'ring-1 ring-brandGold/50 shadow-[0_0_15px_rgba(205,164,52,0.15)] bg-[#353538] text-white' : ''}`}>
                    {msg.content}
                  </div>

                  {/* 🌟 NEW: The Hover Speaker Button */}
                  {msg.role === 'ai' && msg.id !== 'welcome' && ( // Optional: Don't show on the hardcoded welcome message if you prefer
                    <div className="absolute -bottom-6 left-2 flex items-center gap-2 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-200 z-20">
                      <button 
                        onClick={() => msg.id === speakingMessageId ? stopAudio() : fetchAndPlayAudio(msg.content, msg.id)}
                        disabled={audioLoadingId === msg.id}
                        className={`p-1.5 rounded-full bg-[#1c1c1e] border border-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center justify-center 
                          ${msg.id === speakingMessageId ? 'text-brandGold border-brandGold/30' : ''}`}
                      >
                        {audioLoadingId === msg.id ? (
                          <Loader2 size={12} className="animate-spin text-brandGold" />
                        ) : msg.id === speakingMessageId ? (
                          <VolumeX size={12} />
                        ) : (
                          <Volume2 size={12} />
                        )}
                      </button>

                      {/* Error Tooltip */}
                      {audioErrorId === msg.id && (
                        <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 animate-in fade-in slide-in-from-left-1">
                          Voice limit reached
                        </span>
                      )}
                    </div>
                  )}

                </div>
              </div>
            ))}
            
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

          <div className="bg-[#1c1c1e] border-t border-zinc-800/80 py-2.5 text-center shrink-0">
             <p className="text-[11px] text-zinc-500 font-medium tracking-wide">Powered by <strong className="text-zinc-300 font-bold">KinBot AI</strong></p>
          </div>
        </div>
      )}

      {/* ── THE PILL INPUT ── */}
      <div className="h-16 w-full bg-zinc-900 rounded-full flex items-center p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-zinc-800 pointer-events-auto transition-all duration-300">
        
        {isListening ? (
          <>
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
            <button onClick={cancelListening} className="w-14 h-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0">
              <X size={20} />
            </button>
          </>
        ) : (
          <>
            <button onClick={startListening} disabled={!isOnline} className="w-14 h-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors disabled:opacity-50 shrink-0">
              <Mic size={20} />
            </button>
            <div className="flex-1 h-full bg-white rounded-full flex items-center pl-4 pr-1.5 transition-all">
              <input
                disabled={!isOnline || isLoading}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onFocus={() => setIsOpen(true)}
                onKeyDown={(e) => e.key === 'Enter' && executeSend()}
                placeholder={isOnline ? "Ask me anything..." : "AI offline..."}
                className="flex-1 bg-transparent outline-none text-zinc-900 font-medium placeholder:text-zinc-400 min-w-0"
              />
              <button 
                onClick={() => executeSend()} 
                disabled={!isOnline || !inputText.trim()} 
                className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-white hover:bg-black transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 shrink-0"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
