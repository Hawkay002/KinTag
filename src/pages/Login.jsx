import { useState, useEffect } from 'react'; 
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState(''); 
  const [loading, setLoading] = useState(false);

  // Reload Protection: Send to Home if refreshed
  useEffect(() => {
    const isReload = (window.performance.navigation && window.performance.navigation.type === 1) ||
      window.performance.getEntriesByType('navigation').map((nav) => nav.type).includes('reload');
    if (isReload) navigate('/', { replace: true });
  }, [navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
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
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
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
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
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
            <button type="button" onClick={handleResetPassword} className="text-xs font-bold text-zinc-500 hover:text-brandDark transition-colors">
              Forgot Password?
            </button>
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-brandDark text-white p-3.5 rounded-xl font-bold hover:bg-brandAccent transition-all shadow-md mt-2 disabled:opacity-50">
            {loading ? 'Processing...' : 'Log In'}
          </button>
        </form>

        <div className="relative flex items-center justify-center mb-6">
          <hr className="w-full border-zinc-200" />
          <span className="absolute bg-white px-4 text-xs font-bold text-zinc-400 tracking-wider">OR</span>
        </div>

        <button onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center space-x-2 bg-white border border-zinc-200 text-brandDark p-3.5 rounded-xl font-bold hover:bg-zinc-50 transition-all shadow-sm">
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
