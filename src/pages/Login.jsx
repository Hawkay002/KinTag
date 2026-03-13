import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react'; 
import ReCAPTCHA from "react-google-recaptcha"; 

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false); 
  const [captchaToken, setCaptchaToken] = useState(null); 

  const syncUserDatabase = async (user) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    const inviteRef = doc(db, "invites", user.email.toLowerCase());
    const inviteSnap = await getDoc(inviteRef);
    
    let familyId = userDoc.exists() && userDoc.data().familyId ? userDoc.data().familyId : user.uid;
    if (inviteSnap.exists()) {
      familyId = inviteSnap.data().familyId; 
    }

    await setDoc(userDocRef, {
      email: user.email.toLowerCase(),
      familyId: familyId,
    }, { merge: true });
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');

    if (!captchaToken) {
      setError("Please complete the security check.");
      return;
    }

    setLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      await syncUserDatabase(userCred.user);
      navigate('/'); 
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setResetMessage('');

    if (!captchaToken) {
      setError("Please complete the security check.");
      return;
    }

    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      await syncUserDatabase(result.user);
      navigate('/'); 
    } catch (err) {
      setError("Google log-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setResetMessage('');
    
    if (!email) {
      setError("Please enter your email address first, then click 'Forgot Password?'.");
      return;
    }
    
    setResetLoading(true);
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      setResetMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#fafafa] p-4 py-12 relative overflow-hidden selection:bg-brandGold selection:text-white">
      
      {/* Premium Background Elements */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-r from-brandGold/20 via-emerald-400/10 to-transparent rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] p-8 border border-zinc-200/80 relative z-10 flex flex-col">
        
        {/* Header */}
        <div className="text-center mb-8 shrink-0">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-10 h-10 rounded-xl shadow-sm" />
            <h1 className="text-3xl font-extrabold text-brandDark tracking-tight">KinTag</h1>
          </div>
          <p className="text-zinc-500 font-medium">Welcome back. Access your portal.</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-bold text-center border border-red-100 animate-in fade-in slide-in-from-top-2">{error}</div>}
        {resetMessage && <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl mb-6 text-sm font-bold text-center border border-emerald-100 animate-in fade-in slide-in-from-top-2">{resetMessage}</div>}

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <input 
            type="email" 
            placeholder="Email Address" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 outline-none transition-all font-medium" 
          />
          
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full p-4 pr-12 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 outline-none transition-all font-medium" 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brandDark transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex justify-end mt-2">
            <button 
              type="button" 
              onClick={handleResetPassword} 
              disabled={resetLoading} 
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-brandDark transition-colors disabled:opacity-50"
            >
              {resetLoading && <Loader2 size={12} className="animate-spin" />}
              {resetLoading ? 'Sending...' : 'Forgot Password?'}
            </button>
          </div>

          <div className="flex justify-center w-full bg-zinc-50 p-4 rounded-2xl border border-zinc-200 shadow-inner overflow-hidden mt-6 mb-2">
            <div className="scale-90 sm:scale-100 transform origin-center">
              <ReCAPTCHA
                sitekey={import.meta.env.VITE_GOOGLE_RECAPTCHA_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                onChange={(token) => setCaptchaToken(token)}
              />
            </div>
          </div>
          
          <button type="submit" disabled={loading || !captchaToken} className="w-full bg-brandDark text-white py-4 rounded-xl font-bold hover:bg-brandAccent transition-all shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Log In'}
          </button>
        </form>

        <div className="relative flex items-center justify-center mb-6">
          <hr className="w-full border-zinc-200" />
          <span className="absolute bg-white px-4 text-[10px] font-extrabold text-zinc-400 tracking-widest uppercase">OR</span>
        </div>

        <button onClick={handleGoogleLogin} disabled={loading || !captchaToken} className="w-full flex items-center justify-center space-x-3 bg-white border border-zinc-200 text-brandDark py-3.5 rounded-xl font-bold hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm disabled:opacity-50">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          <span>Log in with Google</span>
        </button>

        <p className="text-center mt-8 text-sm text-zinc-500 font-medium">
          Don't have an account? <Link to="/signup" className="text-brandDark font-bold hover:text-brandGold transition-colors">Sign Up</Link>
        </p>

      </div>
    </div>
  );
}
