import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, getAdditionalUserInfo } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();

  // 🌟 NEW: Check state from Home page links. If isSignUp is true, show "Create Account" by default. Otherwise, show "Log In".
  const [isLogin, setIsLogin] = useState(location.state?.isSignUp ? false : true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState(''); 
  const [loading, setLoading] = useState(false);

  // 🌟 NEW: Reload Protection Logic. If the user refreshes their browser while on the Auth screen, send them Home.
  useEffect(() => {
    const isReload = (window.performance.navigation && window.performance.navigation.type === 1) ||
      window.performance
        .getEntriesByType('navigation')
        .map((nav) => nav.type)
        .includes('reload');

    if (isReload) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    
    if (!isLogin && password.length < 8) {
      setError("Please ensure your password is at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        fetch('/api/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: user.email,
            userName: '' 
          })
        }).catch(err => console.log("Welcome email failed:", err));
      }
      navigate('/'); 
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setResetMessage('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const details = getAdditionalUserInfo(result);

      if (details && details.isNewUser) {
        fetch('/api/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: user.email,
            userName: user.displayName 
          })
        }).catch(err => console.log("Welcome email failed:", err));
      }

      navigate('/'); 
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
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

  const criteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const strengthScore = Object.values(criteria).filter(Boolean).length;
  const strengthColors = ['bg-zinc-200', 'bg-red-400', 'bg-amber-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  const CriteriaItem = ({ met, text }) => (
    <li className={`flex items-center gap-2 text-xs font-bold transition-all duration-300 ${met ? 'text-zinc-400 line-through' : 'text-zinc-600'}`}>
      {met ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> : <Circle size={14} className="text-zinc-300 shrink-0" />}
      <span>{text}</span>
    </li>
  );

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-premium p-8 border border-zinc-100">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-12 h-12 rounded-xl shadow-sm" />
            <h1 className="text-4xl font-extrabold text-brandDark tracking-tight">KinTag</h1>
          </div>
          <p className="text-zinc-500 mt-2 font-medium">{isLogin ? 'Welcome back. Access your portal.' : 'Create an account to secure your family.'}</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm text-center border border-red-100">{error}</div>}
        {resetMessage && <div className="bg-green-50 text-green-700 p-3 rounded-xl mb-4 text-sm text-center border border-green-100">{resetMessage}</div>}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
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
              placeholder={isLogin ? "Password" : "Create a Password (max 16)"} 
              required 
              maxLength={16}
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setTimeout(() => setIsPasswordFocused(false), 200)}
              className="w-full p-3.5 pr-12 bg-brandMuted border-transparent rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all" 
            />
            <button 
              type="button" 
              onMouseDown={(e) => e.preventDefault()} 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brandDark transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {!isLogin && (
            <div 
              className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                isPasswordFocused ? 'max-h-[300px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
              }`}
            >
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Password Strength</span>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest ${strengthScore >= 4 ? 'text-emerald-600' : strengthScore >= 2 ? 'text-amber-600' : 'text-red-600'}`}>
                    {password.length === 0 ? 'None' : strengthLabels[strengthScore]}
                  </span>
                </div>
                
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${password.length > 0 && strengthScore >= level ? strengthColors[strengthScore] : 'bg-zinc-200'}`}></div>
                  ))}
                </div>
                
                <ul className="space-y-2">
                  <CriteriaItem met={criteria.length} text="At least 8 characters long" />
                  <CriteriaItem met={criteria.uppercase} text="Contains an uppercase letter" />
                  <CriteriaItem met={criteria.lowercase} text="Contains a lowercase letter" />
                  <CriteriaItem met={criteria.number} text="Contains a number" />
                  <CriteriaItem met={criteria.special} text="Contains a special character (@, $, !, etc)" />
                </ul>
              </div>
            </div>
          )}

          {isLogin && (
            <div className="flex justify-end mt-1">
              <button type="button" onClick={handleResetPassword} className="text-xs font-bold text-zinc-500 hover:text-brandDark transition-colors">
                Forgot Password?
              </button>
            </div>
          )}
          
          <button type="submit" disabled={loading || (!isLogin && password.length < 8)} className="w-full bg-brandDark text-white p-3.5 rounded-xl font-bold hover:bg-brandAccent transition-all shadow-md mt-2 disabled:opacity-50">
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="relative flex items-center justify-center mb-6">
          <hr className="w-full border-zinc-200" />
          <span className="absolute bg-white px-4 text-xs font-bold text-zinc-400 tracking-wider">OR</span>
        </div>

        <button onClick={handleGoogleAuth} disabled={loading} className="w-full flex items-center justify-center space-x-2 bg-white border border-zinc-200 text-brandDark p-3.5 rounded-xl font-bold hover:bg-zinc-50 transition-all shadow-sm">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>

        <p className="text-center mt-8 text-sm text-zinc-600 font-medium">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-brandDark font-bold hover:text-brandGold transition-colors">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}
