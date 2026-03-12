import { useState, useRef } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, addDoc, collection } from 'firebase/firestore'; 
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, Circle, Loader2, Mail, ArrowRight, ArrowLeft, ShieldCheck, User, KeyRound, Send } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";
import { motion, AnimatePresence } from "framer-motion";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmail = new URLSearchParams(location.search).get('email') || '';

  // Stepper State
  const [activeStep, setActiveStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const totalSteps = 4;

  // Form State
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
  const [captchaToken, setCaptchaToken] = useState(null);

  // OTP Verification State
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // --- NAVIGATION LOGIC ---
  const goToStep = (newStep) => {
    setDirection(newStep > activeStep ? 1 : -1);
    setActiveStep(newStep);
    setError('');
  };

  const nextStep = () => goToStep(Math.min(activeStep + 1, totalSteps));
  const prevStep = () => goToStep(Math.max(activeStep - 1, 1));

  const isNextDisabled = () => {
    if (activeStep === 1) return !isEmailVerified;
    if (activeStep === 2) return password.length < 8 || password !== confirmPassword || !password;
    if (activeStep === 3) return !firstName.trim() || !lastName.trim();
    if (activeStep === 4) return !captchaToken || loading;
    return false;
  };

  // --- FIREBASE LOGIC ---
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
          title: `👥 Guardian Joined!`,
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

  // --- OTP LOGIC ---
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
      
      setShowOtpInput(true);
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
      setShowOtpInput(false);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setVerifyLoading(false);
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

  // --- SUBMISSION LOGIC ---
  const handleEmailSignup = async () => {
    setError('');
    if (!captchaToken) return setError("Please complete the security check.");
    
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

  // 🌟 Google Sign-Up (Moved to Step 1, bypasses Captcha requirements automatically!)
  const handleGoogleSignup = async () => {
    setError('');
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

  // --- PASSWORD STRENGTH LOGIC ---
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

  // --- FRAMER MOTION VARIANTS ---
  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0, filter: "blur(4px)" }),
    center: { x: 0, opacity: 1, filter: "blur(0px)" },
    exit: (dir) => ({ x: dir < 0 ? 40 : -40, opacity: 0, filter: "blur(4px)", position: "absolute" })
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#fafafa] p-4 py-12 relative overflow-hidden selection:bg-brandGold selection:text-white">
      
      {/* Premium Background Elements */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-r from-brandGold/20 via-emerald-400/10 to-transparent rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] p-8 border border-zinc-200/80 relative z-10 flex flex-col min-h-[600px]">
        
        {/* Header */}
        <div className="text-center mb-8 shrink-0">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-10 h-10 rounded-xl shadow-sm" />
            <h1 className="text-3xl font-extrabold text-brandDark tracking-tight">KinTag</h1>
          </div>
          <p className="text-zinc-500 font-medium">Create an account to secure your family.</p>
        </div>

        {/* Custom Stepper Indicator */}
        <div className="flex w-full justify-between items-center mb-10 relative px-2 shrink-0">
           <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-1.5 bg-zinc-100 rounded-full z-0"></div>
           <div className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 bg-brandDark rounded-full z-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" style={{ width: `calc(${((activeStep - 1) / 3) * 100}% - 16px)` }}></div>
           
           {[
             { id: 1, icon: <Mail size={16}/> },
             { id: 2, icon: <KeyRound size={16}/> },
             { id: 3, icon: <User size={16}/> },
             { id: 4, icon: <ShieldCheck size={16}/> }
           ].map((step) => {
             const isPast = step.id < activeStep;
             const isActive = step.id === activeStep;
             return (
               <button
                 key={step.id}
                 onClick={() => {
                   if (step.id < activeStep || (step.id === activeStep + 1 && !isNextDisabled())) {
                     goToStep(step.id);
                   }
                 }}
                 disabled={step.id > activeStep && isNextDisabled()}
                 className={`relative flex items-center justify-center w-10 h-10 rounded-full font-extrabold text-sm transition-all duration-500 z-10 ${
                   isActive ? "bg-white border-[3px] border-brandDark text-brandDark shadow-md scale-110" 
                   : isPast ? "bg-brandDark text-white border-2 border-brandDark shadow-sm" 
                   : "bg-zinc-50 border-2 border-zinc-200 text-zinc-400"
                 }`}
               >
                 {isPast ? <CheckCircle2 size={18} /> : step.icon}
               </button>
             );
           })}
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-bold text-center border border-red-100 shrink-0 animate-in fade-in">{error}</div>}

        {/* Form Area - Framer Motion Wrapper */}
        <div className="flex-1 relative flex flex-col justify-center">
          <AnimatePresence mode="popLayout" custom={direction}>
            
            {/* STEP 1: EMAIL & VERIFICATION */}
            {activeStep === 1 && (
              <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, type: "spring", bounce: 0.2 }} className="w-full space-y-5">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-extrabold text-brandDark mb-2">Email Address</h2>
                  <p className="text-zinc-500 text-sm font-medium">We'll use this to send you emergency scan alerts.</p>
                </div>

                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    required 
                    value={email} 
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (isEmailVerified) setIsEmailVerified(false);
                      if (showOtpInput) setShowOtpInput(false);
                    }} 
                    disabled={isEmailVerified || showOtpInput}
                    className="w-full p-4 pl-12 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 outline-none transition-all disabled:opacity-70 disabled:bg-zinc-100 font-medium" 
                  />
                  <Mail size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isEmailVerified ? 'text-emerald-500' : 'text-zinc-400'}`} />
                  
                  {isEmailVerified && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                      <CheckCircle2 size={16} /> Verified
                    </div>
                  )}
                </div>

                {!isEmailVerified && !showOtpInput && (
                  <button type="button" onClick={handleSendOtp} disabled={otpLoading || !email.includes('@')} className="w-full bg-brandDark text-white p-4 rounded-xl font-bold hover:bg-brandAccent transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2">
                    {otpLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {otpLoading ? 'Sending...' : 'Send Verification Code'}
                  </button>
                )}

                {showOtpInput && !isEmailVerified && (
                  <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 shadow-inner animate-in fade-in slide-in-from-top-4">
                    <p className="text-sm font-medium text-zinc-500 text-center mb-4">Enter the 6-digit code sent to your email.</p>
                    {otpError && <p className="text-xs text-red-600 font-bold text-center mb-4">{otpError}</p>}
                    <div className="flex justify-center gap-2 mb-6">
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
                          className="w-10 h-12 text-center text-xl font-black bg-white border-2 border-zinc-200 rounded-xl focus:border-brandDark outline-none transition-all shadow-sm"
                        />
                      ))}
                    </div>
                    <button type="button" onClick={handleVerifyOtp} disabled={verifyLoading || otpValues.join('').length !== 6} className="w-full bg-emerald-500 text-white p-3.5 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2">
                      {verifyLoading ? <Loader2 size={18} className="animate-spin" /> : 'Verify Code'}
                    </button>
                  </div>
                )}

                {/* 🌟 GOOGLE SIGN-UP (Properly moved to Step 1) */}
                {!isEmailVerified && !showOtpInput && (
                  <div className="animate-in fade-in duration-500">
                    <div className="relative flex items-center justify-center w-full my-6">
                      <hr className="w-full border-zinc-200" />
                      <span className="absolute bg-white px-4 text-[10px] font-extrabold text-zinc-400 tracking-widest uppercase">OR</span>
                    </div>

                    <button type="button" onClick={handleGoogleSignup} disabled={loading} className="w-full flex items-center justify-center space-x-3 bg-white border border-zinc-200 text-brandDark py-3.5 rounded-xl font-bold hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm disabled:opacity-50">
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                      <span>Continue with Google</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: PASSWORD */}
            {activeStep === 2 && (
              <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, type: "spring", bounce: 0.2 }} className="w-full space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-extrabold text-brandDark mb-2">Secure Account</h2>
                  <p className="text-zinc-500 text-sm font-medium">Create a strong password to protect your data.</p>
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
                    className="w-full p-4 pr-12 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 outline-none transition-all font-medium" 
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
                    className={`w-full p-4 pr-12 bg-zinc-50 border rounded-xl focus:bg-white focus:outline-none transition-all font-medium ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-zinc-200 focus:border-brandDark focus:ring-2 focus:ring-brandDark/10'}`} 
                  />
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brandDark transition-colors">
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${isPasswordFocused || password.length > 0 ? 'max-h-[300px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                  <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Password Strength</span>
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest ${strengthScore >= 4 ? 'text-emerald-600' : strengthScore >= 2 ? 'text-amber-600' : 'text-red-600'}`}>
                        {password.length === 0 ? 'None' : strengthLabels[strengthScore]}
                      </span>
                    </div>
                    <div className="flex gap-1.5 mb-5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div key={level} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${password.length > 0 && strengthScore >= level ? strengthColors[strengthScore] : 'bg-zinc-200'}`}></div>
                      ))}
                    </div>
                    <ul className="space-y-2.5">
                      <CriteriaItem met={criteria.length} text="At least 8 characters long" />
                      <CriteriaItem met={criteria.uppercase} text="Contains an uppercase letter" />
                      <CriteriaItem met={criteria.lowercase} text="Contains a lowercase letter" />
                      <CriteriaItem met={criteria.number} text="Contains a number" />
                      <CriteriaItem met={criteria.special} text="Contains a special character (@, $, !, etc)" />
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: NAME */}
            {activeStep === 3 && (
              <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, type: "spring", bounce: 0.2 }} className="w-full space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-extrabold text-brandDark mb-2">Personal Details</h2>
                  <p className="text-zinc-500 text-sm font-medium">What should we call you on the dashboard?</p>
                </div>
                <input type="text" placeholder="First Name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 outline-none transition-all font-medium" />
                <input type="text" placeholder="Middle Name (Optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 outline-none transition-all font-medium" />
                <input type="text" placeholder="Last Name" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 outline-none transition-all font-medium" />
              </motion.div>
            )}

            {/* STEP 4: CAPTCHA & FINAL SUBMIT */}
            {activeStep === 4 && (
              <motion.div key="step4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, type: "spring", bounce: 0.2 }} className="w-full space-y-6 flex flex-col items-center">
                <div className="text-center mb-2">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
                    <ShieldCheck size={32} />
                  </div>
                  <h2 className="text-2xl font-extrabold text-brandDark mb-2">Final Step</h2>
                  <p className="text-zinc-500 text-sm font-medium px-4">Complete the security check below to create your KinTag account.</p>
                </div>

                <div className="flex justify-center w-full bg-zinc-50 p-4 rounded-2xl border border-zinc-200 shadow-inner overflow-hidden">
                  <div className="scale-90 sm:scale-100 transform origin-center">
                    <ReCAPTCHA
                      sitekey={import.meta.env.VITE_GOOGLE_RECAPTCHA_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                      onChange={(token) => setCaptchaToken(token)}
                    />
                  </div>
                </div>

                <button type="button" onClick={handleEmailSignup} disabled={loading || !captchaToken} className="w-full bg-brandDark text-white py-4 rounded-xl font-bold hover:bg-brandAccent transition-all shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center gap-2">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer Navigation Buttons */}
        {activeStep < 4 && (
          <div className="flex justify-between w-full mt-10 pt-6 border-t border-zinc-100 shrink-0">
            <button 
              type="button" 
              onClick={prevStep} 
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all text-sm ${activeStep === 1 ? 'opacity-0 pointer-events-none' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-brandDark'}`}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button 
              type="button" 
              onClick={nextStep} 
              disabled={isNextDisabled()} 
              className="flex items-center gap-2 bg-brandDark text-white px-8 py-3 rounded-full font-bold text-sm shadow-md hover:bg-brandAccent hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:shadow-md active:scale-95 group"
            >
              Next Step <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Back to Login Global Link */}
        {activeStep === 1 && (
          <p className="text-center mt-8 text-sm text-zinc-500 font-medium">
            Already have an account? <Link to="/login" className="text-brandDark font-bold hover:text-brandGold transition-colors">Log In</Link>
          </p>
        )}

      </div>
    </div>
  );
}
