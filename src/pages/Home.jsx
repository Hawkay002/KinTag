import { useState, useEffect, useRef, useCallback } from 'react'; 
import { Link } from 'react-router-dom'; 
import { Turnstile } from '@marsidev/react-turnstile';
import { FAQMonochrome } from '../components/ui/faq-monochrome'; 
import { useAuth } from '../context/AuthContext';
import Globe from '../components/ui/Globe'; 
import GlassSurface from '../components/ui/GlassSurface';
import FloatingPhone from '../components/ui/FloatingPhone'; 
import { ContainerScroll, CardSticky } from '../components/ui/CardsStack'; 
import { HugeiconsIcon } from "@hugeicons/react";
import { WhatsappIcon, TelegramIcon } from "@hugeicons/core-free-icons";
import { 
  Shield, MapPin, BellRing, Heart, Smartphone, Github, ArrowRight, 
  CheckCircle2, PawPrint, User, Activity, Info, RefreshCw, Battery, Cloud, 
  Lock, Infinity, Zap, Mail, MessageCircle, Send, 
  Users, Wifi, Database, Phone, AlertTriangle, Trash2, Rocket, WalletCards, Siren, Megaphone, FileText, ShieldCheck, Download, Check, HeartHandshake, Sparkles
} from 'lucide-react';

const stackFeatures = [
  { id: 1, title: "No App Required", description: "Anyone with a smartphone camera can scan the tag. There is absolutely nothing for the finder to download or install.", icon: <Smartphone size={40} className="text-blue-500" /> },
  { id: 2, title: "Precision GPS Pinpointing", description: "When scanned, the finder can securely send their exact coordinates directly to your phone with a single tap.", icon: <MapPin size={40} className="text-emerald-500" /> },
  { id: 3, title: "Lost Mode (Panic Button)", description: "Instantly transform a lost tag into a high-alert distress signal with a flashing missing banner and pulsing emergency dialer.", icon: <Siren size={40} className="text-red-500" /> },
  { id: 4, title: "Instant Push Alerts", description: "The second a tag is scanned, you receive an emergency push notification alerting you that your loved one was found.", icon: <BellRing size={40} className="text-brandGold" /> },
  { id: 5, title: "KinAlert Broadcasts", description: "Trigger an instant localized push notification to all other KinTag users in your zip code to help search for your missing loved one.", icon: <Megaphone size={40} className="text-amber-500" /> },
  { id: 6, title: "Co-Guardian Family Sharing", description: "Invite up to 5 family members. When a tag is scanned, every co-guardian receives an instant push alert simultaneously.", icon: <Users size={40} className="text-indigo-500" /> },
  { id: 7, title: "Caretaker Mode", description: "Generate secure, self-destructing access links for babysitters or dog walkers. They get vital medical and contact info that automatically expires when their shift ends.", icon: <HeartHandshake size={40} className="text-rose-400" /> },
  { id: 8, title: "Secure Document Vault", description: "Upload sensitive medical records or IDs. They remain heavily locked and blurred until the finder explicitly shares their GPS location or calls you.", icon: <FileText size={40} className="text-sky-500" /> },
  { id: 9, title: "Google Wallet Integration", description: "Easily save your kid's, pet's, or elderly parent's mobile ID as a pass in your Google Wallet for instant access and quick sharing.", icon: <WalletCards size={40} className="text-orange-500" /> },
  { id: 10, title: "Critical Medical Info", description: "Display crucial allergies, blood types, special needs, and daily medications instantly to whoever scans the tag.", icon: <Heart size={40} className="text-pink-500" /> },
  { id: 11, title: "And 20+ More Features", description: "From anti-download protections and passive IP fallback scans to microchip linking and instant kill switches. Every detail is meticulously designed to keep your family safe.", icon: <Sparkles size={40} className="text-brandGold" /> }
];

// Returns 'low' | 'mid' | 'high'
// 'low' requires BOTH signals to be weak simultaneously —
// a 4GB phone with 8 cores is mid/high, not low.
function getDeviceTier() {
  if (typeof window === 'undefined') return 'mid';
  const mem = navigator.deviceMemory;     // capped at 8 by spec
  const cores = navigator.hardwareConcurrency;

  // High-end: max RAM cap (flagship) OR many cores
  if (mem !== undefined && mem >= 8) return 'high';
  if (cores !== undefined && cores > 6) return 'high';

  // Low-end: BOTH signals must confirm it — avoids false positives
  // where a capable phone happens to report low on one metric
  const memLow = mem !== undefined && mem < 4;
  const coresLow = cores !== undefined && cores <= 4;
  if (memLow && coresLow) return 'low';

  // Everything else (4GB + 8 cores, unknown APIs, etc.) → mid
  return 'mid';
}

export default function Home() {
  const { currentUser } = useAuth();
  const [showGithubTooltip, setShowGithubTooltip] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [deviceTier] = useState(() => getDeviceTier());

  // 🌟 NEW: Network Status Monitor
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // 🌟 Auto-verify if offline (Bypass Turnstile)
  useEffect(() => {
    if (!isOnline && !isVerified) {
      setIsVerified(true);
    }
  }, [isOnline, isVerified]);

  // FIX: Wrap scroll handler in useCallback so it doesn't get re-created on
  // every render. The previous version captured `isScrolled` from closure,
  // causing a new listener reference on every render and unnecessary work.
  const handleScroll = useCallback(() => {
    const scrolled = window.scrollY > 20;
    // Use functional updater to avoid stale closure on isScrolled
    setIsScrolled(prev => {
      if (prev !== scrolled) return scrolled;
      return prev;
    });
  }, []); // no deps — functional updater means we don't need isScrolled here

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.pwaDeferredPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    if (window.pwaDeferredPrompt) setDeferredPrompt(window.pwaDeferredPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      window.pwaDeferredPrompt = null;
    }
  };

  const scrollToHowItWorks = (e) => {
    e.preventDefault();
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleGithubClick = (e) => {
    e.preventDefault();
    setShowGithubTooltip(true);
    setTimeout(() => setShowGithubTooltip(false), 2500);
  };

  const faqData = [
    { q: "Is there a monthly subscription fee?", a: "No! The core KinTag platform is entirely free to use. We don't believe in holding your family's safety hostage behind a monthly paywall. You only pay for your own blank NFC tags or printing if you choose to.", meta: "Pricing" },
    { q: "Does the finder need to download an app?", a: "No. That is the magic of KinTag. In a panic, you don't want a finder struggling to download an app. They simply point their standard phone camera at the QR code, and it opens a secure, native webpage instantly.", meta: "Access" },
    { q: "Can my spouse and I both receive alerts?", a: "Yes! With our Family Sharing feature, you can invite up to 5 co-guardians. If your child or pet's tag is scanned, every guardian receives an instant push notification on their own phone, and everyone can manage the profiles.", meta: "Family" },
    { q: "Can I add the mobile ID to Google Wallet?", a: "Yes. You can save your kid's, pet's, or an elderly person's mobile ID directly to Google Wallet using the 'Add to Google Wallet' button on the ID screen. This makes it quick and easy to access or share when needed.", meta: "Access" },
    { q: "Can I upload medical records or government IDs?", a: "Yes. Our Secure Document Vault allows you to attach sensitive files like Rabies Certificates or Autism Medical IDs. To protect your privacy, these documents remain heavily blurred and locked until the finder physically taps 'Share Location' or calls your emergency contact.", meta: "Vault" },
    { q: "Can strangers download my child's photos or documents?", a: "No. We have implemented strict anti-download protections across all public profiles. Right-clicking, image dragging, and mobile long-press saving are completely disabled to protect your family's data.", meta: "Privacy" },
    { q: "What is 'Lost Mode' (The Panic Button)?", a: "If your loved one goes missing, you can activate 'Lost Mode' from your dashboard. It instantly transforms their digital ID into a high-alert distress signal with a flashing missing banner and pulsing emergency dialer to urge finders to call immediately.", meta: "Safety" },
    { q: "What is a KinAlert Community Broadcast?", a: "When you activate Lost Mode, you can optionally send a 'KinAlert'. This blasts an instant push notification to all other KinTag users in your Zip Code, turning your neighborhood into an active search party.", meta: "Community" },
    { q: "Why do I need to provide my Zip Code?", a: "Your Zip Code securely connects you to the KinAlert network. It ensures you only receive emergency push notifications for kids or pets that go missing in your immediate local area, and allows you to ask locals for help if yours goes missing.", meta: "Location" },
    { q: "How do I let the community know my pet/child was found?", a: "Simply toggle 'Lost Mode' off in your dashboard! This automatically restores their standard digital ID and sends a green 'Safe & Sound' notification to the local community to call off the search.", meta: "Community" },
    { q: "What happens if the finder denies GPS access?", a: "KinTag uses a dual-layer alert system. Even if the finder taps 'No' to sharing their exact GPS coordinates, our system performs a 'Passive Scan' which grabs their general IP-based city/region and sends you an instant push notification anyway.", meta: "Location" },
    { q: "What if a tag gets lost or stolen?", a: "We built an instant 'Kill Switch'. From your dashboard, you can click one button to disable any profile. If someone scans the lost tag, they will be blocked by a secure 'Profile Disabled' screen, protecting your data.", meta: "Security" },
    { q: "Do I have to buy special tags directly from you?", a: "Not at all. You can generate and download high-resolution QR codes directly from your dashboard to print on standard paper/stickers, or you can buy cheap, blank NFC tags from Amazon and program them yourself.", meta: "Hardware" },
    { q: "What is an NFC tag and how do I use it?", a: "NFC (Near Field Communication) is the same technology used for contactless payments. You can buy blank NFC stickers online and use free apps to program your unique KinTag URL onto them. Anyone who taps their phone to the sticker will instantly open your profile.", meta: "Hardware" },
    { q: "What if I move or change my phone number?", a: "Because KinTag is a cloud-based digital ID, any changes you make in your dashboard are instantly updated on the live tag. You never have to engrave, print, or buy a new physical tag just because you moved.", meta: "Account" },
    { q: "Does the tag have a battery I need to charge?", a: "No. Unlike bulky GPS collars that constantly die and require charging, KinTag relies on the battery and cellular data of the Good Samaritan's smartphone. Your tag will never run out of power.", meta: "Hardware" },
    { q: "Will the QR code fade or expire?", a: "The link embedded in the QR code will never expire as long as your account is active. If you print it on paper, we recommend placing clear tape over it to waterproof it and prevent smudging.", meta: "Hardware" },
    { q: "Can I print the tags myself?", a: "Absolutely. When you create a profile, you get a 'Download QR' button. You can print this at home, scale it down, and laminate it onto a backpack or dog collar.", meta: "Customization" },
    { q: "Can I create profiles for multiple pets or kids?", a: "Yes! Your single KinTag dashboard can hold multiple profiles. You can create unique cards and QR codes for every child, dog, or cat in your household.", meta: "Family" },
    { q: "How do I delete my data if I stop using KinTag?", a: "You have total ownership of your data. We built a 'Danger Zone' in your profile settings where you can permanently wipe your account, all created profiles, and all scan histories from our servers instantly.", meta: "Privacy" },
    { q: "Can I self-host this application?", a: "Yes. KinTag was built to be open and transparent. Developers can clone the repository and hook it up to their own private database for ultimate ownership.", meta: "Open Source" }
  ].map(item => ({ question: item.q, answer: item.a, meta: item.meta }));

  // 🌟 Only render Turnstile if online
  if (!isVerified && isOnline) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 selection:bg-brandGold selection:text-white">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 border border-zinc-100">
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-12 h-12 rounded-xl animate-pulse" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brandDark tracking-tight mb-2">Checking your browser...</h1>
          <p className="text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
            Please wait a moment to ensure you are a real person before accessing KinTag.
          </p>
        </div>
        <div className="animate-in fade-in zoom-in-95 duration-500 delay-300 min-h-[65px]">
          <Turnstile siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={() => setIsVerified(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-brandGold selection:text-white relative w-full">
      
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

      {/* NAVBAR */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-5xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[1.01]'}`}
          // FIX: will-change: transform tells the browser to keep this element
          // on its own GPU layer. Without this, every scroll tick that changes
          // isScrolled causes a full-page repaint to apply the transform.
          style={{ willChange: 'transform' }}
        >
          <GlassSurface width="100%" borderRadius={40}>
            <nav className="relative z-10 px-3 py-2 md:py-3 md:px-6 flex items-center justify-between w-full">
              <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                <div className="relative overflow-hidden rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.05)] bg-white">
                  <img src="/kintag-logo.png" alt="KinTag Logo" className="w-8 h-8 rounded-xl transform group-hover:scale-110 transition-transform duration-500" />
                </div>
                <span className="text-xl font-extrabold text-brandDark tracking-tight drop-shadow-sm">KinTag</span>
              </div>
              <div className="flex items-center space-x-3 md:space-x-5">
                {currentUser ? (
                  <Link to="/dashboard" className="bg-brandDark text-white text-sm font-bold px-5 py-2 md:px-6 md:py-2.5 rounded-full hover:bg-brandAccent hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all relative overflow-hidden">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]"></div>
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="text-sm font-bold text-zinc-600 hover:text-brandDark transition-colors drop-shadow-sm">Log In</Link>
                    <Link to="/signup" className="bg-brandDark text-white text-sm font-bold px-5 py-2 md:px-6 md:py-2.5 rounded-full hover:bg-brandAccent hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all relative overflow-hidden">
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]"></div>
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </GlassSurface>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-[#fafafa]">
        
        {/* Glow */}
        <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brandGold/20 via-emerald-400/10 to-transparent rounded-full pointer-events-none z-0"></div>

        <div className="absolute top-0 left-0 w-full h-[100vh] flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <div
            className="aspect-square opacity-80 shrink-0 [mask-image:linear-gradient(to_bottom,black_0%,black_50%,transparent_100%)]"
            style={{
              // low-end  → original safe size, no edge bleed
              // mid/high → 120vw so globe touches both screen edges
              width: deviceTier === 'low'
                ? 'min(100vw, 800px)'
                : 'clamp(100vw, 120vw, 900px)',
            }}
          >
             <Globe className="!max-w-none !w-full !h-full" tier={deviceTier} />
          </div>
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 w-full flex flex-col pt-32 pb-20 px-4 max-w-5xl mx-auto">
          
          {/* Badge at the top */}
          <div className="w-full flex justify-center mt-4">
            <ScrollReveal delay={0}>
              <div className="inline-flex items-center space-x-2.5 bg-white/50 backdrop-blur-sm border border-zinc-200 px-4 py-2 rounded-full shadow-sm cursor-default">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-600">V1.2.1 is now live!</span>
              </div>
            </ScrollReveal>
          </div>
          
          <div className="w-full flex flex-col items-center mt-[25vh] md:mt-[30vh]">
            <ScrollReveal delay={100}>
              <h1 className="text-5xl md:text-[5.5rem] font-extrabold text-brandDark tracking-tight leading-[1.05] drop-shadow-md text-center">
                The ultimate digital <br className="hidden md:block"/> safety net for your family.
              </h1>
            </ScrollReveal>
            
            <ScrollReveal delay={200}>
              <p className="text-lg md:text-xl text-zinc-500 font-medium max-w-2xl mx-auto mt-8 mb-10 leading-relaxed text-center">
                Link custom QR codes or NFC tags to life-saving digital profiles for your kids and pets. If they ever wander off, a simple scan sends you their exact GPS location instantly.
              </p>
            </ScrollReveal>
            
            <ScrollReveal delay={300}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 w-full">
                <Link to={currentUser ? "/dashboard" : "/signup"} className="group w-full sm:w-auto flex items-center justify-center space-x-3 bg-brandDark text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-brandAccent transition-all shadow-[0_8px_30px_rgb(24,24,27,0.3)] hover:shadow-[0_8px_40px_rgb(24,24,27,0.4)] hover:-translate-y-1 active:scale-95 relative overflow-hidden">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  <span>{currentUser ? "Go to your Dashboard" : "Try KinTag for Free"}</span>
                  <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                </Link>
                
                {deferredPrompt ? (
                  <button onClick={handleInstallApp} className="group w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/80 backdrop-blur-md text-brandDark border border-zinc-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:border-zinc-300 transition-all shadow-sm hover:-translate-y-1 active:scale-95">
                    <Download size={18} />
                    <span>Install App</span>
                  </button>
                ) : (
                  <button onClick={scrollToHowItWorks} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/80 backdrop-blur-md text-brandDark border border-zinc-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:border-zinc-300 transition-all shadow-sm hover:-translate-y-1 active:scale-95">
                    How it works
                  </button>
                )}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-extrabold text-zinc-400 uppercase tracking-widest mb-16">
                <span className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-md"><CheckCircle2 size={16} className="text-emerald-500"/> 100% Free Forever</span>
                <span className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-md"><Lock size={16} className="text-brandGold"/> Secure & Encrypted</span>
                <span className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-md"><Shield size={16} className="text-blue-500"/> No App Required</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={500} className="w-full flex flex-col items-center">
              <div className="flex justify-center mb-10">
                <div className="inline-flex items-center gap-2 bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 text-white px-4 py-2 rounded-full shadow-2xl">
                  <Info size={14} className="text-brandGold shrink-0" />
                  <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase">
                    Live Preview: Action buttons disabled
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-center items-center gap-16 md:gap-24 perspective-[1200px] w-full pb-10 md:pb-0">
                <FloatingPhone 
                  imageSrc="/preview-left.jpg" 
                  facing="left"
                  className="w-[280px] md:w-[320px] aspect-[9/19.5]"
                />
                
                <FloatingPhone 
                  imageSrc="/preview-right.jpg" 
                  facing="right"
                  className="w-[280px] md:w-[310px] aspect-[9/20]"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-32 bg-white relative scroll-mt-24 border-t border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-extrabold text-brandDark tracking-tight mb-5">How KinTag Works</h2>
              <p className="text-zinc-500 font-medium text-xl">Three simple steps to ultimate peace of mind.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-1 bg-zinc-100 z-0 rounded-full overflow-hidden">
               <div className="w-full h-full bg-gradient-to-r from-transparent via-brandGold to-transparent opacity-50 animate-[shimmer_3s_infinite]"></div>
            </div>
            
            <ScrollReveal delay={0}>
              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-32 h-32 bg-white border border-zinc-200 shadow-xl rounded-[2.5rem] flex items-center justify-center mb-8 group-hover:-translate-y-2 group-hover:shadow-2xl transition-all duration-500">
                  <span className="text-4xl font-extrabold text-brandDark bg-zinc-50 w-20 h-20 rounded-2xl flex items-center justify-center">1</span>
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-4">Create a Profile</h3>
                <p className="text-zinc-500 font-medium leading-relaxed px-6">Sign up and build a detailed digital ID card containing emergency contacts, medical info, and behavioral details.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-32 h-32 bg-white border border-zinc-200 shadow-xl rounded-[2.5rem] flex items-center justify-center mb-8 group-hover:-translate-y-2 group-hover:shadow-2xl transition-all duration-500">
                  <span className="text-4xl font-extrabold text-brandDark bg-zinc-50 w-20 h-20 rounded-2xl flex items-center justify-center">2</span>
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-4">Attach the Tag</h3>
                <p className="text-zinc-500 font-medium leading-relaxed px-6">Print the QR code or program an NFC sticker and attach it to your child's backpack, pet's collar, or medical bracelet.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-32 h-32 bg-white border border-zinc-200 shadow-xl rounded-[2.5rem] flex items-center justify-center mb-8 group-hover:-translate-y-2 group-hover:shadow-2xl transition-all duration-500">
                  <span className="text-4xl font-extrabold text-brandDark bg-zinc-50 w-20 h-20 rounded-2xl flex items-center justify-center">3</span>
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-4">Stay Protected</h3>
                <p className="text-zinc-500 font-medium leading-relaxed px-6">If they wander off, a Good Samaritan scans the tag and you instantly receive their GPS location on your phone.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="py-32 bg-zinc-50 border-t border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-extrabold text-brandDark tracking-tight mb-5">Built for every family member.</h2>
              <p className="text-zinc-500 font-medium text-xl">One platform, multiple use cases.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ScrollReveal delay={0}>
              <div className="group relative bg-white p-10 rounded-[3rem] shadow-sm border border-zinc-200 hover:shadow-xl hover:border-blue-200 transition-all duration-500 overflow-hidden h-full flex flex-col items-center text-center">
                <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 border border-blue-100 group-hover:scale-110 transition-transform duration-500">
                  <User size={36} className="text-blue-500" />
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-4">Kids & Children</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">Give your child a digital lifeline. The moment they wander, a scan sends you their precise GPS location and triggers an immediate community alert.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="group relative bg-white p-10 rounded-[3rem] shadow-sm border border-zinc-200 hover:shadow-xl hover:border-amber-200 transition-all duration-500 overflow-hidden h-full flex flex-col items-center text-center">
                <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mb-8 border border-amber-100 group-hover:scale-110 transition-transform duration-500">
                  <PawPrint size={36} className="text-amber-500" />
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-4">Pets & Animals</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">A smarter alternative to engraved tags. Display vaccinations, microchip ID, and vet contacts instantly to any finder — no app needed.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="group relative bg-white p-10 rounded-[3rem] shadow-sm border border-zinc-200 hover:shadow-xl hover:border-pink-200 transition-all duration-500 overflow-hidden h-full flex flex-col items-center text-center">
                <div className="absolute top-0 left-0 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                <div className="w-20 h-20 bg-pink-50 rounded-2xl flex items-center justify-center mb-8 border border-pink-100 group-hover:scale-110 transition-transform duration-500">
                  <Activity size={36} className="text-pink-500" />
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-4">Seniors & Medical</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">A critical safety net for elderly family members prone to wandering, detailing their medical conditions and primary caregivers instantly.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="py-32 bg-white relative">
        <div className="w-full relative z-10 px-4">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-brandDark tracking-tight mb-5">Smarter than a standard ID.</h2>
              <p className="text-zinc-500 font-medium text-xl">Scroll to explore how KinTag brings them home safely and quickly.</p>
            </div>
          </ScrollReveal>

          <ContainerScroll className="max-w-3xl mx-auto pt-10 pb-32">
            {stackFeatures.map((feature, index) => (
              <CardSticky 
                key={feature.id} 
                index={index} 
                incrementY={20} 
                className="mb-[20vh] md:mb-[24vh]"
              >
                <div className={`rounded-[2.5rem] p-8 md:p-10 border flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 relative overflow-hidden transition-colors ${feature.id === 11 ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-brandDark'}`}>
                  
                  {feature.id === 11 && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brandGold/20 via-brandGold/5 to-transparent rounded-full pointer-events-none"></div>
                  )}

                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${feature.id === 11 ? 'bg-white/10 border border-white/20 text-brandGold' : 'bg-zinc-50 border border-zinc-100 text-brandDark'}`}>
                    {feature.icon}
                  </div>
                  <div className="relative z-10">
                    <h3 className={`text-2xl font-extrabold mb-3 tracking-tight ${feature.id === 11 ? 'text-white' : 'text-brandDark'}`}>{feature.title}</h3>
                    <p className={`font-medium leading-relaxed text-sm md:text-base ${feature.id === 11 ? 'text-zinc-400' : 'text-zinc-500'}`}>{feature.description}</p>
                  </div>
                </div>
              </CardSticky>
            ))}
          </ContainerScroll>
        </div>
      </section>

      <section className="py-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="bg-zinc-950 rounded-[4rem] p-10 md:p-20 shadow-2xl relative overflow-hidden border border-zinc-800 flex flex-col md:flex-row items-center gap-16 group">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brandGold/20 via-brandGold/5 to-transparent rounded-full pointer-events-none transition-colors duration-700"></div>
              <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-emerald-500/5 to-transparent rounded-full pointer-events-none transition-colors duration-700"></div>

              <div className="flex-1 relative z-10 text-center md:text-left">
                <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full mb-8">
                  <Smartphone size={16} className="text-brandGold" />
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/90">Experience KinTag Native</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.05] mb-6">
                  Get the app.
                </h2>
                <p className="text-zinc-400 font-medium text-xl leading-relaxed mb-10 max-w-lg mx-auto md:mx-0">
                  For the best, full-screen experience without browser distractions, install the KinTag Web App directly to your device.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                  {deferredPrompt ? (
                    <button onClick={handleInstallApp} className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-brandGold text-brandDark px-10 py-5 rounded-full font-bold text-lg shadow-[0_0_40px_rgba(251,191,36,0.3)] hover:shadow-[0_0_60px_rgba(251,191,36,0.5)] hover:-translate-y-1 active:scale-95 transition-all">
                      <Download size={20} />
                      <span>Install Web App</span>
                    </button>
                  ) : (
                    <div className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-white/10 backdrop-blur text-white/50 px-10 py-5 rounded-full font-bold text-lg border border-white/10 cursor-not-allowed">
                      <CheckCircle2 size={20} />
                      <span>Web App Installed</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-start justify-center md:justify-start gap-2 mt-8 max-w-md mx-auto md:mx-0 text-zinc-500 text-sm font-medium">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <p className="text-left leading-tight">iOS Users: Tap Share in Safari → "Add to Home Screen".</p>
                </div>
              </div>

              <div className="relative z-10 shrink-0 hidden lg:block perspective-[1000px]">
                <div className="w-64 h-64 bg-gradient-to-br from-brandGold to-amber-600 rounded-[3rem] shadow-2xl flex items-center justify-center transform rotate-12 hover:rotate-0 hover:scale-105 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  <img src="/kintag-logo.png" alt="KinTag Icon" className="w-32 h-32 rounded-[2rem] shadow-inner bg-white p-2" />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-24 px-4 bg-white border-b border-zinc-100">
        <ScrollReveal>
          <div className="max-w-6xl mx-auto relative">
            <div className="bg-zinc-50 rounded-[4rem] p-10 md:p-20 border border-zinc-200 flex flex-col md:flex-row gap-16 items-center">
              
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center space-x-2 bg-white border border-zinc-200 px-5 py-2 rounded-full shadow-sm">
                  <Heart size={16} className="text-rose-500" />
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-brandDark">The KinTag Story</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-brandDark tracking-tight leading-[1.1]">
                  Built by a solo developer.<br/>Driven by pure passion.
                </h2>
                <div className="space-y-5 text-zinc-600 font-medium leading-relaxed text-lg">
                  <p>
                    I built KinTag in a single week. When I looked for a way to safeguard my own family, I found an industry plagued by bulky hardware, clunky apps, and predatory monthly subscriptions. 
                  </p>
                  <p>
                    I realized I couldn't trust massive corporations with my family's deeply personal data. More importantly, I absolutely refused to be trapped in a subscription cycle for something so crucial. <strong className="text-brandDark font-extrabold">Think about it: one forgotten payment, and your child's safety net is instantly turned off.</strong> I couldn't live with that anxiety.
                  </p>
                  <p className="text-2xl font-extrabold text-brandDark pt-4">
                    That is exactly why KinTag is <span className="text-emerald-500 border-b-4 border-emerald-200 pb-1">100% free for lifetime.</span>
                  </p>
                </div>
              </div>
              
              <div className="flex-1 w-full bg-white p-10 md:p-12 rounded-[3rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-100 transform md:-translate-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>
                <h3 className="text-brandDark font-extrabold mb-8 text-2xl">The KinTag Promise:</h3>
                <ul className="space-y-6 mb-10">
                  <li className="flex items-start text-zinc-600 font-bold text-lg gap-4"><Check size={24} className="text-emerald-500 shrink-0 mt-0.5 bg-emerald-50 rounded-full p-1"/> Fully encrypted Firebase database</li>
                  <li className="flex items-start text-zinc-600 font-bold text-lg gap-4"><Check size={24} className="text-emerald-500 shrink-0 mt-0.5 bg-emerald-50 rounded-full p-1"/> Zero hidden paywalls or premium lockouts</li>
                  <li className="flex items-start text-zinc-600 font-bold text-lg gap-4"><Check size={24} className="text-emerald-500 shrink-0 mt-0.5 bg-emerald-50 rounded-full p-1"/> You have absolute ownership of your data</li>
                  <li className="flex items-start text-zinc-600 font-bold text-lg gap-4"><Check size={24} className="text-emerald-500 shrink-0 mt-0.5 bg-emerald-50 rounded-full p-1"/> Built specifically for parents, by a parent</li>
                </ul>
                
                <Link to={currentUser ? "/dashboard" : "/signup"} className="w-full flex items-center justify-center gap-2 bg-brandDark text-white py-4 px-6 rounded-full font-bold text-base hover:bg-brandAccent hover:-translate-y-0.5 active:scale-95 transition-all shadow-lg group/btn relative overflow-hidden">
                  <span className="whitespace-nowrap z-10">{currentUser ? "Go to Dashboard" : "Create Your Free KinTag"}</span>
                  <ArrowRight size={18} className="transform transition-transform duration-300 group-hover/btn:translate-x-1.5 z-10" />
                  <div className="absolute inset-0 w-full h-full bg-white/10 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                </Link>
              </div>

            </div>
          </div>
        </ScrollReveal>
      </section>

      <FAQMonochrome faqs={faqData} />

      <section className="py-32 bg-zinc-50 border-t border-zinc-200 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-brandDark tracking-tight mb-5">Join the Community</h2>
              <p className="text-zinc-500 font-medium text-xl">Self-host it yourself, check the logs, or just say hello.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <ScrollReveal delay={0}>
              <div className="bg-white rounded-[3rem] p-10 border border-zinc-200 shadow-sm h-full flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
                <div>
                  <h2 className="text-3xl font-extrabold text-brandDark tracking-tight mb-4 flex items-center gap-3">
                    <Github size={32} className="text-zinc-400 group-hover:text-brandDark transition-colors" /> Open & Self-Hostable
                  </h2>
                  <p className="text-zinc-500 font-medium leading-relaxed mb-8 text-lg">
                    Are you a developer? You shouldn't have to rely on third-party servers for your family's safety. KinTag is designed to be completely self-hostable. 
                  </p>
                  
                  <div className="bg-zinc-950 rounded-2xl p-6 shadow-inner border border-zinc-800 text-left mb-8 max-w-full">
                    <div className="flex gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <pre className="text-emerald-400 font-mono text-[11px] sm:text-xs overflow-x-hidden whitespace-pre-wrap">
                      <code>
<span className="text-zinc-500"># Clone the repository</span><br/>
<span className="text-blue-400">git clone</span> https://github.com/...<br/><br/>
<span className="text-zinc-500"># Install dependencies</span><br/>
<span className="text-blue-400">npm</span> install<br/><br/>
<span className="text-zinc-500"># Setup your Firebase config</span><br/>
<span className="text-blue-400">cp</span> .env.example .env<br/><br/>
<span className="text-zinc-500"># Start local server</span><br/>
<span className="text-blue-400">npm run</span> dev
                      </code>
                    </pre>
                  </div>
                </div>

                <div className="relative inline-block w-max">
                  <button onClick={handleGithubClick} className="inline-flex items-center justify-center space-x-2 bg-zinc-100 border border-zinc-200 text-zinc-400 px-6 py-3 rounded-full font-bold cursor-not-allowed transition-all">
                    <span>View GitHub Repository</span>
                  </button>
                  {showGithubTooltip && (
                    <div className="absolute top-1/2 left-[calc(100%+14px)] -translate-y-1/2 bg-brandDark text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl animate-in fade-in slide-in-from-left-2 duration-200 whitespace-nowrap z-10">
                      Coming soon
                      <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[5px] border-r-brandDark"></div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>

            <div className="flex flex-col gap-8">
              
              <ScrollReveal delay={150}>
                <div className="bg-brandDark text-white rounded-[3rem] p-10 shadow-xl border border-zinc-800 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-rose-500/30 transition-colors duration-700"></div>
                  <Heart size={32} className="text-rose-500 mb-6" />
                  <h2 className="text-3xl font-extrabold tracking-tight mb-4">Keep KinTag Alive.</h2>
                  <p className="text-white/70 font-medium leading-relaxed mb-8">
                    Currently, the platform relies entirely on free server tiers. If you believe in this mission and want to help me scale it to protect more families, or if you just want to say hi, my inbox is always open!
                  </p>
                  <div className="flex flex-wrap gap-4 relative z-10">
                    <a href="mailto:shovith2@gmail.com" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-6 py-3 rounded-full font-bold transition-all text-sm">
                      <Mail size={16} /> Email
                    </a>
                    <a href="https://wa.me/918777845713" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-6 py-3 rounded-full font-bold transition-all text-sm">
                      <HugeiconsIcon icon={WhatsappIcon} size={18} /> WhatsApp
                    </a>
                    <a href="https://t.me/X_o_x_o_002" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-6 py-3 rounded-full font-bold transition-all text-sm">
                      <HugeiconsIcon icon={TelegramIcon} size={18} /> Telegram
                    </a>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <div className="bg-white rounded-[3rem] p-10 border border-zinc-200 shadow-sm flex flex-col justify-center h-full group hover:shadow-lg transition-all duration-500">
                  <Rocket size={32} className="text-brandGold mb-6 group-hover:-translate-y-1 transition-transform" />
                  <h2 className="text-3xl font-extrabold text-brandDark tracking-tight mb-4">Constantly Evolving</h2>
                  <p className="text-zinc-500 font-medium leading-relaxed mb-8">
                    KinTag is actively maintained and frequently updated with new features and community-requested tools.
                  </p>
                  <Link to="/changelog" className="inline-flex w-max items-center justify-center space-x-2 bg-zinc-50 text-brandDark px-8 py-3.5 rounded-full font-bold border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 transition-all shadow-sm group/btn">
                    <span>Read the Changelog</span>
                    <ArrowRight size={16} className="transform transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </ScrollReveal>

            </div>
          </div>
        </div>
      </section>

      <section className="py-32 bg-white text-center px-4 border-t border-zinc-100">
        <ScrollReveal>
          <div className="w-20 h-20 bg-brandGold/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
             <Shield size={40} className="text-brandGold" />
          </div>
          <h2 className="text-5xl md:text-6xl font-extrabold text-brandDark tracking-tight mb-6">Ready to secure them?</h2>
          <p className="text-zinc-500 font-medium text-xl mb-10 max-w-lg mx-auto">Join the platform and create your first highly-secured digital tag in under 2 minutes.</p>
          
          <Link to={currentUser ? "/dashboard" : "/signup"} className="inline-flex items-center justify-center space-x-3 bg-brandDark text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-brandAccent transition-all shadow-[0_10px_40px_rgb(24,24,27,0.3)] hover:-translate-y-1 active:scale-95 group">
            <span>{currentUser ? "Go to Dashboard" : "Get Started for Free"}</span>
            <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300" />
          </Link>
        </ScrollReveal>
      </section>

      <footer className="bg-[#fafafa] py-12 border-t border-zinc-200 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4 opacity-40 hover:opacity-100 transition-opacity">
          <img src="/kintag-logo.png" alt="Logo" className="w-6 h-6 rounded-md grayscale" />
          <span className="font-extrabold text-brandDark tracking-tight">KinTag</span>
        </div>
        <p className="text-sm text-zinc-400 font-bold">© {new Date().getFullYear()} KinTag. All rights reserved.</p>
      </footer>
    </div>
  );
}

// FIX: Removed `blur-[4px]` from the hidden state.
// CSS blur (filter: blur) forces the browser to create a new compositing layer
// and re-run a Gaussian blur pass on EVERY frame during the reveal animation.
// On low-end phones this is the single biggest cause of the freeze because
// it blocks the main thread while the GPU catches up.
// The reveal still looks great with just opacity + translateY — no visual loss.
function ScrollReveal({ children, delay = 0, className = "" }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    
    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);
    
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div 
      ref={ref} 
      style={{
        transitionDelay: `${delay}ms`,
        // FIX: will-change: transform + opacity tells the browser to pre-promote
        // this element to its own GPU layer BEFORE the animation starts,
        // preventing the "stutter on first appear" on high-end phones.
        willChange: isVisible ? 'auto' : 'transform, opacity',
      }}
      // REMOVED: blur-[4px] from the hidden state — this was the freeze cause.
      // KEPT: opacity and translateY which are GPU-composited for free.
      className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      } ${className}`}
    >
      {children}
    </div>
  );
}
