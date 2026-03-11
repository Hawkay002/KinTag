import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom'; 
import { Turnstile } from '@marsidev/react-turnstile';
import { CardStack } from '../components/ui/card-stack'; 
import { FAQMonochrome } from '../components/ui/faq-monochrome'; 
import { 
  Shield, MapPin, BellRing, Heart, Smartphone, Github, ArrowRight, 
  CheckCircle2, PawPrint, User, Activity, Info, RefreshCw, Battery, Cloud, 
  Lock, Infinity, Zap, Mail, MessageCircle, Send, 
  Users, Wifi, Database, Phone, AlertTriangle, Trash2, Rocket, Siren, Megaphone, FileText, ShieldCheck, Download,
  ChevronRight
} from 'lucide-react';

const stackFeatures = [
  { id: 1, title: "No App Required", description: "Anyone with a smartphone camera can scan the tag. There is absolutely nothing for the finder to download or install.", icon: <Smartphone size={40} className="text-blue-500" /> },
  { id: 2, title: "Instant Setup", description: "Skip the wait times of ordering custom engraved metals. Create an account and secure your child or pet in under 2 minutes.", icon: <Zap size={40} className="text-yellow-500" /> },
  { id: 3, title: "Unlimited Scans", description: "There is absolutely no cap on how many times your QR codes or NFC tags can be scanned.", icon: <Infinity size={40} className="text-rose-500" /> },
  { id: 4, title: "Precision GPS Pinpointing", description: "When scanned, the finder can securely send their exact coordinates directly to your phone with a single tap.", icon: <MapPin size={40} className="text-emerald-500" /> },
  { id: 5, title: "Passive Location Fallback", description: "Even if the finder denies GPS access, KinTag will passively log their general IP-based city and send an alert.", icon: <Wifi size={40} className="text-rose-400" /> },
  { id: 6, title: "Instant Push Alerts", description: "The second a tag is scanned, you receive an emergency push notification alerting you that your loved one was found.", icon: <BellRing size={40} className="text-brandGold" /> },
  { id: 7, title: "One-Tap Emergency Dial", description: "A massive, clear button allows the finder to instantly dial your emergency contact number without copying it.", icon: <Phone size={40} className="text-emerald-600" /> },
  { id: 8, title: "Lost Mode (Panic Button)", description: "Instantly transform a lost tag into a high-alert distress signal with a flashing missing banner and pulsing emergency dialer.", icon: <Siren size={40} className="text-red-500" /> },
  { id: 9, title: "KinAlert Broadcasts", description: "Trigger an instant localized push notification to all other KinTag users in your zip code to help search for your missing loved one.", icon: <Megaphone size={40} className="text-amber-500" /> },
  { id: 10, title: "Secure Document Vault", description: "Upload sensitive medical records or IDs. They remain heavily locked and blurred until the finder explicitly shares their GPS location or calls you.", icon: <FileText size={40} className="text-indigo-500" /> },
  { id: 11, title: "Anti-Download Protection", description: "Strict UI protections prevent strangers from right-clicking, dragging, or long-pressing to save your photos and documents.", icon: <ShieldCheck size={40} className="text-emerald-600" /> },
  { id: 12, title: "Co-Guardian Family Sharing", description: "Invite up to 5 family members. When a tag is scanned, every co-guardian receives an instant push alert simultaneously.", icon: <Users size={40} className="text-indigo-500" /> },
  { id: 13, title: "Behavioral Alerts", description: "Highlight critical non-verbal behaviors, special needs, or fears so the finder knows exactly how to approach them.", icon: <AlertTriangle size={40} className="text-amber-500" /> },
  { id: 14, title: "Critical Medical Info", description: "Display crucial allergies, blood types, and daily medications instantly to whoever scans the tag.", icon: <Heart size={40} className="text-pink-500" /> },
  { id: 15, title: "Microchip Linking", description: "Store your pet's official microchip ID number visibly so veterinarians can cross-reference it instantly.", icon: <Database size={40} className="text-zinc-600" /> },
  { id: 16, title: "Vaccination Records", description: "Display rabies and core vaccination statuses to reassure finders that your pet is safe to handle.", icon: <Activity size={40} className="text-sky-500" /> },
  { id: 17, title: "Dynamic Updates", description: "Moved to a new house? Changed your phone number? Update your profile instantly without ever needing to print a new tag.", icon: <RefreshCw size={40} className="text-teal-500" /> },
  { id: 18, title: "Cloud Synced", description: "All your profiles are securely backed up to the cloud. Access and manage your dashboard from any device.", icon: <Cloud size={40} className="text-sky-400" /> },
  { id: 19, title: "Complete Data Control", description: "You own your data. Permanently wipe your account, profiles, and scan histories from our servers at any time.", icon: <Trash2 size={40} className="text-zinc-800" /> },
  { id: 20, title: "Zero Battery Required", description: "Unlike bulky GPS collars that constantly die and require charging, KinTag relies on the battery and cellular data of the Good Samaritan's smartphone. Your tag will never run out of power.", icon: <Battery size={40} className="text-orange-500" /> }
];

export default function Home() {
  const [showGithubTooltip, setShowGithubTooltip] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.pwaDeferredPrompt = e;
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    if (window.pwaDeferredPrompt) {
      setDeferredPrompt(window.pwaDeferredPrompt);
    }

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

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-brandGold selection:text-white">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/10 flex items-center justify-center mx-auto mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-brandGold/20 to-emerald-500/20 animate-pulse"></div>
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-12 h-12 rounded-xl relative z-10 shadow-lg" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">Securing Connection</h1>
          <p className="text-zinc-400 font-medium max-w-sm mx-auto leading-relaxed">
            Performing a secure browser check before granting access to the platform.
          </p>
        </div>
        
        <div className="animate-in fade-in zoom-in-95 duration-500 delay-300 min-h-[65px] opacity-80 mix-blend-screen">
          <Turnstile siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={() => setIsVerified(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-brandGold selection:text-white animate-in fade-in duration-700 w-full">
      
      {/* 🌟 NEW: FLOATING GLASSMORPHIC NAVBAR */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav className="pointer-events-auto bg-white/70 backdrop-blur-xl border border-white rounded-full px-4 py-3 flex items-center justify-between w-full max-w-5xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:bg-white/90">
          <div className="flex items-center space-x-3 pl-2">
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-7 h-7 rounded-lg shadow-sm" />
            <span className="text-lg font-extrabold text-brandDark tracking-tight">KinTag</span>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link to="/login" className="text-sm font-bold text-zinc-500 hover:text-brandDark transition-colors px-3">Log In</Link>
            <Link to="/signup" className="bg-brandDark text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-brandAccent transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </nav>
      </div>

      {/* 🌟 NEW: "AURORA" DARK HERO SECTION */}
      <section className="relative pt-40 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-zinc-950 rounded-b-[2.5rem] md:rounded-b-[4rem] shadow-2xl">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] opacity-30 pointer-events-none mix-blend-screen">
           <div className="absolute inset-0 bg-gradient-to-b from-brandGold via-emerald-600 to-transparent blur-[120px] rounded-full transform rotate-12 scale-150" />
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 px-4">
          
          <ScrollReveal delay={0}>
            <div className="inline-flex items-center space-x-2.5 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full mb-8 shadow-2xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-300">V1.1.1 is now live</span>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-extrabold text-white tracking-tighter leading-[1.05] mb-8 drop-shadow-2xl">
              The ultimate digital <br className="hidden md:block"/> safety net for your family.
            </h1>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <p className="text-lg md:text-xl text-zinc-400 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
              Link custom QR codes or NFC tags to life-saving digital profiles for your kids and pets. If they ever wander off, a simple scan sends you their exact GPS location instantly.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/signup" className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white text-brandDark px-8 py-4 rounded-full font-extrabold text-lg hover:bg-zinc-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:-translate-y-1">
                <span>Try KinTag for Free</span>
                <ChevronRight size={20} />
              </Link>
              
              {deferredPrompt ? (
                <button onClick={handleInstallApp} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/10 text-white backdrop-blur-md border border-white/10 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all hover:-translate-y-1">
                  <Download size={20} />
                  <span>Install Native App</span>
                </button>
              ) : (
                <button onClick={scrollToHowItWorks} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/5 text-zinc-300 backdrop-blur-md border border-white/10 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all hover:-translate-y-1">
                  How it works
                </button>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-extrabold text-zinc-500 uppercase tracking-widest mb-16">
              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> 100% Free Forever</span>
              <span className="flex items-center gap-2"><Lock size={16} className="text-brandGold"/> Secure & Encrypted</span>
              <span className="flex items-center gap-2"><Shield size={16} className="text-blue-500"/> No App Required</span>
            </div>
          </ScrollReveal>

          {/* Iframes with glowing bezels */}
          <ScrollReveal delay={500}>
            <div className="relative mx-auto max-w-5xl mt-8">
              <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-16 perspective-[1200px] w-full pb-10 md:pb-0">
                
                {/* iPhone Mockup */}
                <div className="relative w-[280px] md:w-[320px] aspect-[9/19.5] rounded-[2.25rem] md:rounded-[3rem] border-[8px] md:border-[10px] border-zinc-900 bg-zinc-900 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden transform md:rotate-y-[12deg] md:rotate-x-[6deg] z-20 hover:rotate-y-0 hover:rotate-x-0 hover:scale-[1.05] transition-all duration-700 ease-out group shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-30 mix-blend-overlay"></div>
                  <div className="relative w-full h-full bg-zinc-100 overflow-hidden rounded-[1.75rem] md:rounded-[2.4rem]">
                     <div className="absolute top-0 left-0 w-[375px] h-[813px] origin-top-left max-md:[transform:scale(0.704)] md:[transform:scale(0.8)]">
                        <iframe src="https://kintag.vercel.app/#/id/kJeMwTQgTnuARri1gwc3?preview=true" className="w-full h-full border-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} title="Live Kid Profile View" />
                     </div>
                  </div>
                </div>

                {/* Android Mockup */}
                <div className="relative w-[280px] md:w-[310px] aspect-[9/20] rounded-[2rem] md:rounded-[2.75rem] border-[8px] md:border-[10px] border-zinc-800 bg-zinc-800 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden transform md:rotate-y-[-12deg] md:rotate-x-[6deg] z-10 hover:rotate-y-0 hover:rotate-x-0 hover:scale-[1.05] transition-all duration-700 ease-out group shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-tl from-white/5 to-transparent pointer-events-none z-30 mix-blend-overlay"></div>
                  <div className="relative w-full h-full bg-zinc-100 overflow-hidden rounded-[1.5rem] md:rounded-[2.1rem]">
                     <div className="absolute top-0 left-0 w-[375px] h-[834px] origin-top-left max-md:[transform:scale(0.704)] md:[transform:scale(0.7733)]">
                        <iframe src="https://kintag.vercel.app/#/id/OSCIDGkJXSIh9mTmOVtr?preview=true" className="w-full h-full border-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} title="Live Pet Profile View" />
                     </div>
                  </div>
                </div>

              </div>
              
              {/* Context Label */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md border border-white/10 text-zinc-400 px-4 py-2 rounded-full shadow-2xl z-40">
                 <Info size={14} className="text-brandGold shrink-0" />
                 <span className="text-[10px] font-bold tracking-widest uppercase">Live Interactive Previews</span>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* 🌟 NEW: SLEEK "HOW IT WORKS" */}
      <section id="how-it-works" className="py-32 bg-zinc-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-extrabold text-brandDark tracking-tighter mb-4">Brilliantly Simple.</h2>
              <p className="text-zinc-500 font-medium text-lg max-w-2xl mx-auto">Zero technical skills required. We engineered the complexity out so you can secure your family in minutes.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent -translate-y-1/2 z-0"></div>
            
            <ScrollReveal delay={0}>
              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 bg-white shadow-xl rounded-3xl flex items-center justify-center mb-8 border border-zinc-100 group-hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-white"></div>
                  <span className="relative text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brandDark to-zinc-500">1</span>
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-3 tracking-tight">Create Profile</h3>
                <p className="text-zinc-500 font-medium leading-relaxed px-4">Sign up and build a detailed digital ID card containing emergency contacts, medical info, and behavioral triggers.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 bg-white shadow-xl rounded-3xl flex items-center justify-center mb-8 border border-zinc-100 group-hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-white"></div>
                  <span className="relative text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brandDark to-zinc-500">2</span>
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-3 tracking-tight">Attach Tag</h3>
                <p className="text-zinc-500 font-medium leading-relaxed px-4">Download your custom QR code or link a blank NFC sticker. Attach it to a pet's collar or a kid's backpack.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 bg-white shadow-xl rounded-3xl flex items-center justify-center mb-8 border border-zinc-100 group-hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-white"></div>
                  <span className="relative text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brandGold to-amber-600">3</span>
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-3 tracking-tight">Get Scanned</h3>
                <p className="text-zinc-500 font-medium leading-relaxed px-4">If they are lost, a Good Samaritan scans the tag. You instantly get an alert with their exact GPS location.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 🌟 NEW: BENTO BOX "WHO IS IT FOR" */}
      <section className="py-24 bg-white border-y border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-brandDark tracking-tighter mb-4">Who is KinTag for?</h2>
              <p className="text-zinc-500 font-medium text-lg">Engineered specifically for the most vulnerable members of your family.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <ScrollReveal delay={0} className="md:col-span-4">
              <div className="bg-zinc-50 p-10 rounded-[2.5rem] border border-zinc-200/60 hover:bg-white hover:shadow-2xl hover:border-blue-500/20 transition-all duration-500 group h-full flex flex-col">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <User size={32} />
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-3 tracking-tight">Children</h3>
                <p className="text-zinc-500 font-medium leading-relaxed flex-1">Perfect for amusement parks, crowded malls, or field trips. Alert finders to non-verbal behaviors or severe allergies before they even approach.</p>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={150} className="md:col-span-4">
              <div className="bg-zinc-50 p-10 rounded-[2.5rem] border border-zinc-200/60 hover:bg-white hover:shadow-2xl hover:border-amber-500/20 transition-all duration-500 group h-full flex flex-col">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <PawPrint size={32} />
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-3 tracking-tight">Pets & Animals</h3>
                <p className="text-zinc-500 font-medium leading-relaxed flex-1">A massive upgrade from engraved metal. Easily share their microchip number, temperament, and diet restrictions instantly if they escape the yard.</p>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={300} className="md:col-span-4">
              <div className="bg-zinc-50 p-10 rounded-[2.5rem] border border-zinc-200/60 hover:bg-white hover:shadow-2xl hover:border-pink-500/20 transition-all duration-500 group h-full flex flex-col">
                <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Activity size={32} />
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-3 tracking-tight">Seniors & Medical</h3>
                <p className="text-zinc-500 font-medium leading-relaxed flex-1">A critical safety net for elderly family members prone to wandering, detailing their medical conditions, daily medications, and primary caregivers.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* INTERACTIVE CARD STACK FEATURES */}
      <section className="py-32 bg-zinc-50 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent h-40 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-brandDark tracking-tighter mb-4">Smarter than a standard ID.</h2>
              <p className="text-zinc-500 font-medium text-lg">Swipe to explore how KinTag brings them home safely and quickly.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="w-full max-w-lg mx-auto flex justify-center">
              <CardStack
                items={stackFeatures}
                initialIndex={0}
                autoAdvance
                intervalMs={3000}
                pauseOnHover
                showDots={false} 
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* NATIVE APP SECTION */}
      <section className="py-24 bg-white border-y border-zinc-100">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="bg-zinc-950 rounded-[3rem] p-8 md:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative overflow-hidden border border-zinc-800 flex flex-col md:flex-row items-center gap-12 group">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brandGold/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-brandGold/20 transition-colors duration-1000"></div>
              <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-1000"></div>

              <div className="flex-1 relative z-10 text-center md:text-left">
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full mb-6">
                  <Smartphone size={14} className="text-brandGold" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-white">Experience KinTag Native</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tighter leading-[1.1] mb-6">
                  Get the Web App
                </h2>
                <p className="text-zinc-400 font-medium text-lg leading-relaxed mb-8 max-w-lg mx-auto md:mx-0">
                  For the best, full-screen experience without browser distractions, install KinTag directly to your device home screen.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                  {deferredPrompt ? (
                    <button onClick={handleInstallApp} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-brandGold text-white px-8 py-4 rounded-full font-bold shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] hover:bg-amber-500 transition-all hover:-translate-y-0.5">
                      <Download size={20} />
                      <span>Install Web App</span>
                    </button>
                  ) : (
                    <div className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/10 text-white/50 px-8 py-4 rounded-full font-bold border border-white/10 cursor-not-allowed" title="Already installed or not supported on this browser">
                      <CheckCircle2 size={20} />
                      <span>App Installed</span>
                    </div>
                  )}
                </div>
                
                <p className="text-zinc-500 text-xs font-medium mt-6 max-w-md mx-auto md:mx-0">
                  * iOS Users: To install the Web App, tap the Share icon in Safari and select "Add to Home Screen".
                </p>
              </div>

              <div className="relative z-10 shrink-0 hidden lg:block perspective-[1000px]">
                <div className="w-56 h-56 bg-gradient-to-br from-brandGold to-amber-600 rounded-[3rem] shadow-2xl flex items-center justify-center transform rotate-y-[-15deg] rotate-x-[10deg] rotate-[-5deg] group-hover:rotate-y-0 group-hover:rotate-x-0 group-hover:rotate-0 transition-all duration-700 ease-out">
                  <div className="w-48 h-48 bg-zinc-950 rounded-[2.5rem] flex items-center justify-center shadow-inner border border-white/10">
                    <img src="/kintag-logo.png" alt="KinTag Icon" className="w-24 h-24 rounded-2xl shadow-xl" />
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 🌟 NEW: EDITORIAL DEVELOPER STORY */}
      <section className="py-24 px-4 relative bg-zinc-50 border-b border-zinc-100">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-200">
                 <Heart size={20} className="text-rose-500" />
               </div>
               <div>
                 <h2 className="text-xl font-extrabold text-brandDark tracking-tight">The KinTag Story</h2>
                 <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">A Founder's Letter</p>
               </div>
            </div>

            <div className="bg-white rounded-[3rem] p-8 md:p-14 shadow-sm border border-zinc-200/60 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-brandDark"></div>
              
              <h3 className="text-3xl md:text-5xl font-black text-brandDark tracking-tighter leading-tight mb-8">
                Built by a solo developer.<br/>Driven by pure passion.
              </h3>
              
              <div className="prose prose-lg prose-zinc max-w-none text-zinc-600 font-medium leading-relaxed mb-12">
                <p>
                  I built KinTag in a single week. When I looked for a way to safeguard my own family, I found an industry plagued by bulky hardware, clunky apps, and predatory monthly subscriptions.
                </p>
                <p>
                  I realized I couldn't trust massive corporations with my family's deeply personal data. More importantly, I absolutely refused to be trapped in a subscription cycle for something so crucial. <strong className="text-brandDark font-extrabold">Think about it: one forgotten payment, and your child's safety net is instantly turned off.</strong> I couldn't live with that anxiety.
                </p>
                <p className="text-2xl font-extrabold text-brandDark my-8 border-l-4 border-emerald-500 pl-6 py-2">
                  That is exactly why KinTag is <span className="text-emerald-600">100% free for lifetime.</span>
                </p>
                <p>
                  I actively use this platform for my own loved ones, because I needed to build the exact tool I wished existed.
                </p>
              </div>
              
              <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-200/60">
                <h4 className="text-brandDark font-black text-lg mb-6 uppercase tracking-widest">The KinTag Promise</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <li className="flex items-start font-bold text-zinc-600 gap-3"><CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5"/> Fully encrypted database</li>
                  <li className="flex items-start font-bold text-zinc-600 gap-3"><CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5"/> Zero hidden paywalls</li>
                  <li className="flex items-start font-bold text-zinc-600 gap-3"><CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5"/> Absolute ownership of your data</li>
                  <li className="flex items-start font-bold text-zinc-600 gap-3"><CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5"/> Built for parents, by a parent</li>
                </ul>
                <Link to="/signup" className="inline-flex items-center justify-center bg-brandDark text-white py-4 px-8 rounded-full font-bold text-lg hover:bg-brandAccent transition-all shadow-lg hover:-translate-y-0.5">
                  Create Your Free KinTag
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* MONOCHROME FAQ SECTION */}
      <FAQMonochrome faqs={faqData} />

      {/* 🌟 NEW: MAC-OS STYLE SELF-HOST GUIDE */}
      <section className="py-32 bg-zinc-50 border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 relative">
            <ScrollReveal delay={0}>
              <div className="inline-flex items-center space-x-2 bg-white border border-zinc-200 px-4 py-1.5 rounded-full mb-6 shadow-sm">
                <Github size={14} className="text-zinc-500" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-500">Open Source</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-brandDark tracking-tighter mb-6">
                Total Ownership.
              </h2>
              <p className="text-zinc-500 font-medium text-lg leading-relaxed mb-8">
                Are you a developer? You shouldn't have to rely on third-party servers for your family's safety. KinTag is designed to be completely self-hostable. Grab the code, hook it up to your own Firebase instance, and take 100% control.
              </p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center font-bold text-brandDark gap-3"><CheckCircle2 size={20} className="text-emerald-500"/> Full React/Vite Source Code</li>
                <li className="flex items-center font-bold text-brandDark gap-3"><CheckCircle2 size={20} className="text-emerald-500"/> Simple Firebase Integration</li>
                <li className="flex items-center font-bold text-brandDark gap-3"><CheckCircle2 size={20} className="text-emerald-500"/> Free to modify for personal use</li>
              </ul>
              
              <div className="relative inline-block">
                <button 
                  onClick={handleGithubClick}
                  className="inline-flex items-center justify-center space-x-2 bg-white border border-zinc-200 text-brandDark px-8 py-4 rounded-full font-bold shadow-sm transition-all hover:bg-zinc-50"
                >
                  <Github size={20} />
                  <span>View Repository</span>
                </button>
                
                {showGithubTooltip && (
                  <div className="absolute top-1/2 left-[calc(100%+16px)] -translate-y-1/2 bg-brandDark text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xl animate-in fade-in slide-in-from-left-2 duration-200 flex items-center whitespace-nowrap z-10">
                    Coming soon
                    <div className="absolute top-1/2 -left-[6px] -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-brandDark"></div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>

          <div className="flex-1 w-full max-w-lg perspective-[1000px]">
            <ScrollReveal delay={200}>
              <div className="bg-zinc-950 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-zinc-800 text-left overflow-hidden transform md:rotate-y-[-5deg] md:rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700">
                <div className="bg-zinc-900 px-4 py-3 flex items-center gap-2 border-b border-zinc-800">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <div className="flex-1 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Terminal</div>
                </div>
                <div className="p-6 md:p-8 font-mono text-sm leading-relaxed overflow-x-auto">
                  <span className="text-zinc-500"># Clone the repository</span><br/>
                  <span className="text-emerald-400">git clone</span> <span className="text-white">https://github.com/Hawkay002/KinTag</span><br/><br/>
                  <span className="text-zinc-500"># Install dependencies</span><br/>
                  <span className="text-emerald-400">npm</span> <span className="text-white">install</span><br/><br/>
                  <span className="text-zinc-500"># Setup your Firebase config</span><br/>
                  <span className="text-emerald-400">cp</span> <span className="text-white">.env.example .env</span><br/><br/>
                  <span className="text-zinc-500"># Start local server</span><br/>
                  <span className="text-emerald-400">npm run</span> <span className="text-white">dev</span><br/>
                  <span className="text-zinc-500 animate-pulse">_</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* LIVE CONTACT & LIMITATIONS */}
      <section className="py-24 bg-white border-b border-zinc-100">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <Heart size={32} className="text-rose-500" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-brandDark tracking-tighter mb-6">Help keep KinTag alive.</h2>
            <p className="text-zinc-500 font-medium text-lg leading-relaxed max-w-3xl mx-auto mb-12">
              I promised KinTag will always be free to use, and I mean it. Currently, the platform relies entirely on the free tiers of backend services like Firebase and Vercel. 
              However, as more parents and pet owners join to safeguard their families, our database storage and server limits will eventually max out. Buying more capacity is incredibly costly for a solo developer. 
              <br/><br/>
              If you believe in this mission and want to help me scale it to protect more families, or if you just want to say hi, my inbox is always open!
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="mailto:shovith2@gmail.com" className="flex items-center gap-2 bg-white text-brandDark border border-zinc-200 px-8 py-4 rounded-full font-bold hover:bg-zinc-50 transition-all shadow-sm">
                <Mail size={20} className="text-blue-500"/> Email Me
              </a>
              <a href="https://wa.me/918777845713" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white text-brandDark border border-zinc-200 px-8 py-4 rounded-full font-bold hover:bg-zinc-50 transition-all shadow-sm">
                <MessageCircle size={20} className="text-emerald-500"/> WhatsApp
              </a>
              <a href="https://t.me/X_o_x_o_002" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white text-brandDark border border-zinc-200 px-8 py-4 rounded-full font-bold hover:bg-zinc-50 transition-all shadow-sm">
                <Send size={20} className="text-sky-500"/> Telegram
              </a>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* CHANGELOG SECTION */}
      <section className="py-24 bg-zinc-50 border-b border-zinc-200">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <div className="w-16 h-16 bg-white text-brandDark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-zinc-200">
              <Rocket size={32} />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-brandDark tracking-tighter mb-4">Constantly Evolving</h2>
            <p className="text-zinc-500 font-medium text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              KinTag is actively maintained and frequently updated with new features, security enhancements, and community-requested tools.
            </p>
            <Link to="/changelog" className="inline-flex items-center justify-center space-x-2 bg-white text-brandDark px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-100 transition-all shadow-sm border border-zinc-200">
              <span>Read the Changelog</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-32 bg-brandDark text-center px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brandGold/5 rounded-full blur-3xl pointer-events-none"></div>
        <ScrollReveal>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 relative z-10">Ready to secure your loved ones?</h2>
          <p className="text-zinc-400 font-medium text-xl mb-12 relative z-10">Join the platform and create your first tag in under 2 minutes.</p>
          <Link to="/signup" className="inline-flex items-center justify-center space-x-2 bg-brandGold text-white px-10 py-5 rounded-full font-black text-xl hover:bg-amber-500 transition-all shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:shadow-[0_0_60px_rgba(245,158,11,0.6)] hover:-translate-y-1 relative z-10">
            <span>Get Started for Free</span>
            <ArrowRight size={24} />
          </Link>
        </ScrollReveal>
      </section>

      {/* FOOTER */}
      <footer className="bg-zinc-950 py-12 border-t border-white/10 text-center">
        <div className="flex items-center justify-center space-x-3 mb-6 opacity-50">
          <img src="/kintag-logo.png" alt="Logo" className="w-6 h-6 rounded" />
          <span className="font-extrabold text-white text-lg tracking-tight">KinTag</span>
        </div>
        <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">© {new Date().getFullYear()} KinTag. All rights reserved.</p>
      </footer>
    </div>
  );
}

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
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}
    >
      {children}
    </div>
  );
}
