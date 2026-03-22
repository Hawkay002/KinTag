import { useState, useEffect } from 'react';
import { Shield, ScanFace, FingerprintPattern } from 'lucide-react';

export default function AppLock({ children }) {
  const [isLocked, setIsLocked] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only lock the app if they have explicitly enabled it in Settings
    const isEnabled = localStorage.getItem('kintag_app_lock_enabled');
    if (isEnabled !== 'true') {
      setIsLocked(false);
    }
  }, []);

  const handleUnlock = async () => {
    setError('');
    try {
      const credentialId = localStorage.getItem('kintag_credential_id');
      if (!credentialId) {
        setIsLocked(false); // Failsafe if localstorage gets corrupted
        return;
      }

      const idBuffer = new Uint8Array(credentialId.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

      const publicKeyCredentialRequestOptions = {
        challenge: window.crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{
          id: idBuffer,
          type: 'public-key',
          transports: ['internal']
        }],
        userVerification: 'required',
        timeout: 60000
      };

      await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      // If the promise resolves, Face ID / Fingerprint was successful!
      setIsLocked(false);
    } catch (err) {
      console.error(err);
      setError("Face ID / Fingerprint failed or was canceled. Please try again.");
    }
  };

  if (!isLocked) {
    return children;
  }

  return (
    <div className="fixed inset-0 z-[999] bg-brandDark text-white flex flex-col items-center justify-center p-6 selection:bg-brandGold selection:text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brandGold/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-white/10 relative z-10 animate-in zoom-in duration-500">
        <Shield size={48} className="text-brandGold" />
      </div>
      
      <h1 className="text-3xl font-extrabold mb-2 tracking-tight relative z-10 text-center">App Locked</h1>
      <p className="text-white/60 font-medium mb-12 text-center max-w-xs relative z-10 leading-relaxed">
        Scan your Touch ID, or enter your device passcode to unlock KinTag.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-8 text-sm font-bold max-w-sm text-center animate-in fade-in relative z-10">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
        <button 
          onClick={handleUnlock}
          className="w-full bg-brandGold text-brandDark py-4 rounded-full font-extrabold shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <FingerprintPattern size={24} />
          Unlock App
        </button>
      </div>
    </div>
  );
}
