import { useState, useRef } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, addDoc, collection } from 'firebase/firestore'; 
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, Circle, Loader2, Mail } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha"; // 🌟 NEW

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmail = new URLSearchParams(location.search).get('email') || '';

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null); // 🌟 NEW

  // OTP Verification State
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const processUserDatabase = async (user, displayName) => {
    const emailLower = user.email.toLowerCase();
    const inviteRef = doc(db, "invites", emailLower);
    const inviteSnap = await getDoc(inviteRef);
    
    let familyId = user.uid;

    if (inviteSnap.exists()) {
      familyId = inviteSnap.data().familyId;
      const inviterUid = inviteSnap.data().inviterUid;

      await deleteDoc(inviteRef);

      await addDoc(collection(db, "scans"), {
        familyId: familyId,
        type: 'invite_response',
        profileName: 'Family Update',
        message: `${displayName || emailLower} securely joined your family dashboard!`,
        timestamp: new Date().toISOString()
      });

      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: inviterUid,
          title: `🤝 Guardian Joined!`,
          body: `${displayName || emailLower} created an account and joined your family.`,
          link: `https://kintag.vercel.app/#/?view=notifications` 
        })
      }).catch(() => {});
    }

    await setDoc(doc(db, "users", user.uid), {
      email: emailLower,
      name: displayName,
      familyId: familyId,
      createdAt: new Date().toISOString()
    }, { merge: true });

    fetch('/api/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail: user.email, userName: displayName })
    }).catch(err => console.log("Welcome email failed:", err));
  };

  const handleSendOtp = async () => {
    setError('');
    setOtpLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send verification email.");
      
      setShowOtpModal(true);
      setOtpError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    setVerifyLoading(true);
    const code = otpValues.join('');
    
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), otp: code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid Verification Code.");

      setIsEmailVerified(true);
      setShowOtpModal(false);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!captchaToken) {
      setError("Please complete the security check.");
      return;
    }
    if (!isEmailVerified) {
      setError("Please verify your email address first.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Please ensure your password is at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fullName = [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(' ');
      
      await processUserDatabase(userCredential.user, fullName);
      navigate('/'); 
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    if (!captchaToken) {
      setError("Please complete the security check.");
      return;
    }

    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const details = getAdditionalUserInfo(result);

      if (details && details.isNewUser) {
        await processUserDatabase(result.user, result.user.displayName || '');
      }
      navigate('/'); 
    } catch (err) {
      setError("Google sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    if (value !== '' && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = [...otpValues];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtpValues(newOtp);
      if (pastedData.length < 6) {
        inputRefs.current[pastedData.length].focus();
      } else {
        inputRefs.current[5].focus();
      }
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
    <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-50 p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-premium p-8 border border-zinc-100">
        
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-12 h-12 rounded-xl shadow-sm" />
            <h1 className="text-4xl font-extrabold text-brandDark tracking-tight">KinTag</h1>
          </div>
          <p className="text-zinc-500 mt-2 font-medium">Create an account to secure your family.</p>
          {prefilledEmail && <span className="inline-block mt-2 bg-brandGold/20 text-brandGold px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Invited by Guardian</span>}
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm text-center border border-red-100">{error}</div>}

        <form onSubmit={handleEmailSignup} className="space-y-4 mb-6">
          <input type="text" placeholder="First Name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full p-3.5 bg-brandMuted border-transparent rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all" />
          <input type="text" placeholder="Middle Name (Optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="w-full p-3.5 bg-brandMuted border-transparent rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all" />
          <input type="text" placeholder="Last Name" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full p-3.5 bg-brandMuted border-transparent rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all" />
          
          <div className="relative">
            <input 
              type="email" 
              placeholder="Email Address" 
              required 
              value={email} 
              onChange={(e) => {
                setEmail(e.target.value);
                if (isEmailVerified) setIsEmailVerified(false);
              }} 
              disabled={isEmailVerified}
              className="w-full p-3.5 pr-24 bg-brandMuted border-transparent rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all disabled:opacity-70 disabled:bg-zinc-100" 
            />
            {!isEmailVerified ? (
              <button 
                type="button" 
                onClick={handleSendOtp} 
                disabled={otpLoading || !email.includes('@')}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-brandDark text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-brandAccent transition-all shadow-sm disabled:opacity-50"
              >
                {otpLoading ? <Loader2 size={14} className="animate-spin" /> : 'Verify'}
              </button>
            ) : (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 size={16} /> Verified
              </div>
            )}
          </div>
          
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Create a Password" 
              required 
              maxLength={16}
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setTimeout(() => setIsPasswordFocused(false), 200)}
              className="w-full p-3.5 pr-12 bg-brandMuted border-transparent rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all" 
            />
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brandDark transition-colors">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="Confirm Password" 
              required 
              maxLength={16}
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className={`w-full p-3.5 pr-12 bg-brandMuted border rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all ${confirmPassword && password !== confirmPassword ? 'border-red-300' : 'border-transparent'}`} 
            />
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brandDark transition-colors">
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${isPasswordFocused ? 'max-h-[300px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
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

          {/* 🌟 NEW: Google reCAPTCHA */}
          <div className="flex justify-center mt-4">
            <ReCAPTCHA
              sitekey={import.meta.env.VITE_GOOGLE_RECAPTCHA_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
              onChange={(token) => setCaptchaToken(token)}
            />
          </div>
          
          {/* 🌟 UPDATED: Disabled if Captcha isn't completed */}
          <button type="submit" disabled={loading || password.length < 8 || password !== confirmPassword || !isEmailVerified || !captchaToken} className="w-full bg-brandDark text-white p-3.5 rounded-xl font-bold hover:bg-brandAccent transition-all shadow-md mt-2 disabled:opacity-50">
            {loading ? 'Processing...' : 'Create Account'}
          </button>
        </form>

        <div className="relative flex items-center justify-center mb-6">
          <hr className="w-full border-zinc-200" />
          <span className="absolute bg-white px-4 text-xs font-bold text-zinc-400 tracking-wider">OR</span>
        </div>

        {/* 🌟 UPDATED: Disabled if Captcha isn't completed */}
        <button onClick={handleGoogleSignup} disabled={loading || !captchaToken} className="w-full flex items-center justify-center space-x-2 bg-white border border-zinc-200 text-brandDark p-3.5 rounded-xl font-bold hover:bg-zinc-50 transition-all shadow-sm disabled:opacity-50">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          <span>Sign up with Google</span>
        </button>

        <p className="text-center mt-8 text-sm text-zinc-600 font-medium">
          Already have an account? <Link to="/login" className="text-brandDark font-bold hover:text-brandGold transition-colors">Log In</Link>
        </p>

        {showOtpModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-brandDark/90 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-brandGold/10 text-brandGold rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={32} />
              </div>
              <h2 className="text-2xl font-extrabold text-brandDark mb-2 tracking-tight">Verify Email</h2>
              <p className="text-zinc-500 mb-6 text-sm font-medium leading-relaxed">
                We sent a 6-digit verification code to <strong className="text-brandDark">{email}</strong>.
              </p>

              {otpError && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-bold border border-red-100">{otpError}</div>}

              <div className="flex justify-center gap-2 mb-8">
                {otpValues.map((val, index) => (
                  <input 
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    maxLength={1}
                    value={val}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-brandDark outline-none transition-all"
                  />
                ))}
              </div>

              <button 
                onClick={handleVerifyOtp} 
                disabled={verifyLoading || otpValues.join('').length !== 6}
                className="w-full bg-brandDark text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-brandAccent transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifyLoading ? <Loader2 size={18} className="animate-spin" /> : 'Proceed'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
