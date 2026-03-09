import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react'; 
import ReCAPTCHA from "react-google-recaptcha"; // 🌟 NEW

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false); 
  const [captchaToken, setCaptchaToken] = useState(null); // 🌟 NEW

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
    <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-premium p-8 border border-zinc-100">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-12 h-12 rounded-xl shadow-sm" />
            <h1 className="text-4xl font-extrabold text-brandDark tracking-tight">KinTag</h1>
          </div>
          <p className="text-zinc-500 mt-2 font-medium">Welcome back. Access your portal.</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm text-center border border-red-100">{error}</div>}
        {resetMessage && <div className="bg-green-50 text-green-700 p-3 rounded-xl mb-4 text-sm text-center border border-green-100">{resetMessage}</div>}

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <input 
            type="email" 
            placeholder="Email Address" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full p-3.5 bg-brandMuted border-transparent rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all" 
          />
          
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full p-3.5 pr-12 bg-brandMuted border-transparent rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all" 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brandDark transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex justify-end mt-1">
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

          {/* 🌟 NEW: Google reCAPTCHA */}
          <div className="flex justify-center mt-4">
            <ReCAPTCHA
              sitekey={import.meta.env.VITE_GOOGLE_RECAPTCHA_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
              onChange={(token) => setCaptchaToken(token)}
            />
          </div>
          
          {/* 🌟 UPDATED: Disabled if Captcha isn't completed */}
          <button type="submit" disabled={loading || !captchaToken} className="w-full bg-brandDark text-white p-3.5 rounded-xl font-bold hover:bg-brandAccent transition-all shadow-md mt-2 disabled:opacity-50">
            {loading ? 'Processing...' : 'Log In'}
          </button>
        </form>

        <div className="relative flex items-center justify-center mb-6">
          <hr className="w-full border-zinc-200" />
          <span className="absolute bg-white px-4 text-xs font-bold text-zinc-400 tracking-wider">OR</span>
        </div>

        {/* 🌟 UPDATED: Disabled if Captcha isn't completed */}
        <button onClick={handleGoogleLogin} disabled={loading || !captchaToken} className="w-full flex items-center justify-center space-x-2 bg-white border border-zinc-200 text-brandDark p-3.5 rounded-xl font-bold hover:bg-zinc-50 transition-all shadow-sm disabled:opacity-50">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          <span>Log in with Google</span>
        </button>

        <p className="text-center mt-8 text-sm text-zinc-600 font-medium">
          Don't have an account? <Link to="/signup" className="text-brandDark font-bold hover:text-brandGold transition-colors">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
