import { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
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
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
      navigate('/'); 
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-premium p-8 border border-zinc-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-brandDark tracking-tight">Safety ID</h1>
          <p className="text-zinc-500 mt-2 font-medium">{isLogin ? 'Welcome back. Access your portal.' : 'Create an account to secure your family.'}</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm text-center border border-red-100">{error}</div>}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3.5 bg-brandMuted border-transparent rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all" />
          <input type="password" placeholder="Password (min 6 characters)" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3.5 bg-brandMuted border-transparent rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all" />
          
          <button type="submit" disabled={loading} className="w-full bg-brandDark text-white p-3.5 rounded-xl font-bold hover:bg-brandAccent transition-all shadow-md">
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
          <button onClick={() => setIsLogin(!isLogin)} className="text-brandDark font-bold hover:text-brandGold transition-colors">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}
