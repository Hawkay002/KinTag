import React, { useState, useEffect, useRef } from 'react';
import { Mic, ArrowRight, X, Volume2, VolumeX, Loader2, Info } from 'lucide-react';

export default function AIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Chat State
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'ai', content: "Hi there! Welcome to KinTag. I'm here to help you get started with our digital safety platform for your family, pets, or loved ones.\n\nAre you looking to learn more about how it works, or would you like help getting set up?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Voice & Audio State
  const [isListening, setIsListening] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [voicePreference, setVoicePreference] = useState('female'); 
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const audioContextRef = useRef(null);
  
  // UX Popups
  const [hasAgreedToAudio, setHasAgreedToAudio] = useState(false);
  const [showAudioPopup, setShowAudioPopup] = useState(false);
  const [pendingText, setPendingText] = useState('');

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    setHasAgreedToAudio(localStorage.getItem('kintag_audio_agreed') === 'true');
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
  }, [messages, isOpen, speakingMessageId]);

  const sanitizeTranscript = (text) => {
    let clean = text;
    clean = clean.replace(/king\s?tag/gi, 'KinTag');
    clean = clean.replace(/can\s?tag/gi, 'KinTag');
    clean = clean.replace(/kim\s?tag/gi, 'KinTag');
    return clean;
  };

  // 🌟 NEW: The Gemini Cloud Audio Player
  const stopAudio = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setSpeakingMessageId(null);
  };

  const playGeminiAudio = async (base64Audio, messageId) => {
    if (!audioEnabled || !base64Audio) return;
    stopAudio();

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;

      // Decode Base64 to Binary
      const binaryString = window.atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert 16-bit PCM to Float32 Array for Web Audio API
      const dataView = new DataView(bytes.buffer);
      const floatArray = new Float32Array(bytes.length / 2);
      for (let i = 0; i < floatArray.length; i++) {
        const int16 = dataView.getInt16(i * 2, true); 
        floatArray[i] = int16 / 32768.0;
      }
      
      // Load into Audio Buffer (Gemini returns 24000 Hz)
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
        handleSendMessage(cleanText, true); 
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

  const handleSendMessage = async (textOverride = null, fromVoice = false) => {
    const textToSend = textOverride || sanitizeTranscript(inputText);
    if (!textToSend.trim() || !isOnline) return;

    if (!fromVoice && !hasAgreedToAudio) {
      setPendingText(textToSend);
      setShowAudioPopup(true);
      return;
    }

    executeSend(textToSend);
  };

  const executeSend = async (text) => {
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
          voicePreference: voicePreference // 🌟 SENDING THE TOGGLE TO THE BACKEND
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', content: data.reply }]);
      
      if (data.audioBase64) {
        playGeminiAudio(data.audioBase64, aiMsgId);
      }

    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: "Sorry, I'm offline or having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptAudioWarning = () => {
    localStorage.setItem('kintag_audio_agreed', 'true');
    setHasAgreedToAudio(true);
    setShowAudioPopup(false);
    executeSend(pendingText);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[100] flex flex-col items-center pointer-events-none">
      
      {/* ── AUDIO WARNING POPUP ── */}
      {showAudioPopup && (
        <div className="absolute bottom-[80px] w-full bg-[#1c1c1e] border border-zinc-700 shadow-2xl rounded-3xl p-5 pointer-events-auto animate-in fade-in zoom-in-95 duration-200 z-50">
          <div className="flex gap-3 mb-4">
            <Volume2 className="text-brandGold shrink-0" size={24} />
            <div>
              <h3 className="text-white font-bold mb-1">Voice Replies Enabled</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                To give you the best experience, KinBot speaks its replies out loud. Please lower your volume manually if you are in a quiet place.
              </p>
            </div>
          </div>
          <button 
            onClick={acceptAudioWarning}
            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
          >
            Got it
          </button>
        </div>
      )}

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
              <button onClick={() => { setAudioEnabled(!audioEnabled); stopAudio(); }} className="mr-8 text-zinc-400 hover:text-white transition-colors">
                {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[50vh]">
            {!isOnline && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs p-3 rounded-2xl font-bold text-center flex items-center justify-center gap-2">
                <Info size={14}/> AI is resting while you are offline.
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl max-w-[85%] text-[15px] leading-relaxed font-medium transition-all duration-500 ${msg.role === 'user' ? 'bg-[#2c2c2e] text-white' : 'bg-[#2c2c2e] text-zinc-300'} ${msg.id === speakingMessageId ? 'ring-1 ring-brandGold/50 shadow-[0_0_15px_rgba(205,164,52,0.15)] bg-[#353538] text-white' : ''}`}>
                  {msg.content}
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
            <div ref={messagesEndRef} className="h-6" /> 
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
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isOnline ? "Ask me anything..." : "AI offline..."}
                className="flex-1 bg-transparent outline-none text-zinc-900 font-medium placeholder:text-zinc-400 min-w-0"
              />
              <button 
                onClick={() => handleSendMessage()} 
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
