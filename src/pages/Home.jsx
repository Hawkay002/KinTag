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
  Code2
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
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 selection:bg-brandGold selection:text-white relative">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 border border-zinc-100 relative">
            <div className="absolute inset-0 bg-brandGold/20 animate-ping rounded-3xl"></div>
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-12 h-12 rounded-xl relative z-10" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brandDark tracking-tight mb-2">Establishing Secure Connection...</h1>
          <p className="text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
            Please wait a moment while we ensure you are a real person before accessing the network.
          </p>
        </div>
        
        <div className="animate-in fade-in zoom-in-95 duration-500 delay-300 min-h-[65px] relative z-10">
          <Turnstile siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={() => setIsVerified(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-brandDark selection:text-white animate-in fade-in duration-700 w-full relative">
      
      {/* GLOBAL BACKGROUND MESH */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]"></div>

      {/* FLOATING GLASS NAVBAR */}
      <nav className="fixed top-4 left-4 right-4 z-50 max-w-5xl mx-auto bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full px-4 md:px-6 py-3 flex items-center justify-between transition-all duration-500">
        <div className="flex items-center space-x-2.5">
          <img src="/kintag-logo.png" alt="KinTag Logo" className="w-8 h-8 rounded-full shadow-sm" />
          <span className="text-xl font-extrabold text-brandDark tracking-tight">KinTag</span>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <Link to="/login" className="text-sm font-bold text-zinc-600 hover:text-brandDark transition-colors px-3">Log In</Link>
          <Link to="/signup" className="bg-brandDark text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-brandAccent transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 md:pt-48 md:pb-32 px-4 relative overflow-hidden">
        {/* Animated Glow Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-br from-brandGold/20 to-emerald-400/20 rounded-[100%] blur-[100px] pointer-events-none mix-blend-multiply opacity-70"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          <ScrollReveal delay={0}>
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-md border border-zinc-200/60 px-4 py-1.5 rounded-full mb-8 shadow-sm hover:shadow transition-shadow">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-600">KinTag V1.1.1 is now live</span>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <h1 className="text-5xl md:text-[5.5rem] font-black text-brandDark tracking-tighter leading-[1.05] mb-8">
              The ultimate digital <br className="hidden md:block"/> 
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brandDark via-brandDark to-brandGold">
                safety net for your family.
              </span>
            </h1>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <p className="text-lg md:text-xl text-zinc-600 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
              Link custom QR codes or NFC tags to life-saving digital profiles for your kids and pets. If they ever wander off, a simple scan sends you their exact GPS location instantly.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link to="/signup" className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-brandDark text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-brandAccent transition-all shadow-[0_8px_30px_rgb(24,24,27,0.3)] hover:-translate-y-1 group">
                <span>Try KinTag for Free</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              
              {deferredPrompt ? (
                <button onClick={handleInstallApp} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white text-brandDark border border-zinc-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                  <Download size={18} />
                  <span>Install Web App</span>
                </button>
              ) : (
                <button onClick={scrollToHowItWorks} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white text-brandDark border border-zinc-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                  How it works
                </button>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-16">
              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> 100% Free Forever</span>
              <span className="flex items-center gap-2"><Lock size={16} className="text-brandGold"/> Secure & Encrypted</span>
              <span className="flex items-center gap-2"><Shield size={16} className="text-blue-500"/> No App Required</span>
            </div>
          </ScrollReveal>

          {/* NATIVE PERSPECTIVE MOCKUPS */}
          <ScrollReveal delay={500}>
            <div className="relative mx-auto max-w-5xl px-4">
              <div className="flex justify-center mb-10 relative z-40">
                <div className="inline-flex items-center gap-2 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 text-white px-4 py-2 rounded-full shadow-2xl">
                  <Info size={14} className="text-brandGold shrink-0" />
                  <span className="text-[10px] md:text-xs font-bold tracking-wide uppercase">
                    Live Preview: Interactive Mockups
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 perspective-[1500px] w-full pb-10 md:pb-0">
                
                {/* Kid Mockup */}
                <div className="relative w-[280px] md:w-[320px] aspect-[9/19.5] rounded-[2.5rem] md:rounded-[3rem] border-[10px] border-zinc-900 bg-zinc-900 shadow-[0_20px_50px_rgb(0,0,0,0.2)] overflow-hidden transform md:rotate-y-[10deg] md:rotate-x-[5deg] z-20 md:hover:rotate-y-0 md:hover:rotate-x-0 hover:scale-[1.03] transition-all duration-700 ease-out group">
                  <div className="absolute top-0 inset-x-0 h-6 bg-zinc-900 z-50 rounded-b-3xl w-40 mx-auto"></div> {/* Dynamic Island Fake */}
                  <div className="relative w-full h-full bg-zinc-100 overflow-hidden rounded-[2rem] md:rounded-[2.4rem]">
                     <div className="absolute top-0 left-0 w-[375px] h-[813px] origin-top-left max-md:[transform:scale(0.704)] md:[transform:scale(0.8)]">
                        <iframe src="https://kintag.vercel.app/#/id/kJeMwTQgTnuARri1gwc3?preview=true" className="w-full h-full border-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }} title="Live Kid Profile View" />
                     </div>
                  </div>
                </div>

                {/* Pet Mockup */}
                <div className="relative w-[280px] md:w-[310px] aspect-[9/20] rounded-[2.5rem] md:rounded-[2.75rem] border-[10px] border-zinc-800 bg-zinc-800 shadow-[0_20px_50px_rgb(0,0,0,0.2)] overflow-hidden transform md:rotate-y-[-10deg] md:rotate-x-[5deg] z-10 md:hover:rotate-y-0 md:hover:rotate-x-0 hover:scale-[1.03] transition-all duration-700 ease-out group">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-950 rounded-full z-50 shadow-inner border border-zinc-700/50"></div> {/* Pixel Punch Hole Fake */}
                  <div className="relative w-full h-full bg-zinc-100 overflow-hidden rounded-[2rem] md:rounded-[2.1rem]">
                     <div className="absolute top-0 left-0 w-[375px] h-[834px] origin-top-left max-md:[transform:scale(0.704)] md:[transform:scale(0.7733)]">
                        <iframe src="https://kintag.vercel.app/#/id/OSCIDGkJXSIh9mTmOVtr?preview=true" className="w-full h-full border-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }} title="Live Pet Profile View" />
                     </div>
                  </div>
                </div>

              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* BENTO USE CASES */}
      <section className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-brandDark tracking-tight mb-4">Who is KinTag for?</h2>
              <p className="text-zinc-500 font-medium text-lg max-w-xl mx-auto">Designed from the ground up to protect the most vulnerable members of your family.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScrollReveal delay={0}>
              <div className="group bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-zinc-200/80 transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-inner group-hover:scale-110 transition-transform">
                  <User size={32} />
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-3 tracking-tight">Children</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">Perfect for amusement parks, crowded malls, or field trips. Alert finders to non-verbal behaviors, contact info, or severe allergies instantly.</p>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={150}>
              <div className="group bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-zinc-200/80 transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all"></div>
                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6 border border-amber-100 shadow-inner group-hover:scale-110 transition-transform">
                  <PawPrint size={32} />
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-3 tracking-tight">Pets & Animals</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">Easily share their microchip number, temperament, vet details, and diet restrictions instantly if they ever manage to escape the yard.</p>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={300}>
              <div className="group bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-zinc-200/80 transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all"></div>
                <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center mb-6 border border-pink-100 shadow-inner group-hover:scale-110 transition-transform">
                  <Activity size={32} />
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-3 tracking-tight">Seniors & Medical</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">A critical safety net for elderly family members prone to wandering, detailing their medical conditions, medications, and primary caregivers.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SLEEK HOW IT WORKS */}
      <section id="how-it-works" className="py-24 relative z-10 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-black text-brandDark tracking-tight mb-4">How KinTag Works</h2>
              <p className="text-zinc-500 font-medium text-lg">Three simple steps to ultimate peace of mind.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Connecting Line for Desktop */}
            <div className="hidden md:block absolute top-[3.5rem] left-[15%] right-[15%] h-1 bg-gradient-to-r from-transparent via-zinc-200 to-transparent z-0"></div>
            
            <ScrollReveal delay={0}>
              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-28 h-28 bg-white border border-zinc-200 shadow-lg rounded-full flex items-center justify-center mb-8 group-hover:scale-110 group-hover:border-brandDark transition-all duration-500 relative">
                  <div className="absolute inset-0 bg-brandDark/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500"></div>
                  <span className="text-4xl font-black text-brandDark relative z-10">1</span>
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-4 tracking-tight">Create a Profile</h3>
                <p className="text-zinc-500 font-medium leading-relaxed px-2">Sign up and build a detailed digital ID card containing emergency contacts, medical info, and behavioral details.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-28 h-28 bg-white border border-zinc-200 shadow-lg rounded-full flex items-center justify-center mb-8 group-hover:scale-110 group-hover:border-brandDark transition-all duration-500 relative">
                  <div className="absolute inset-0 bg-brandDark/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500"></div>
                  <span className="text-4xl font-black text-brandDark relative z-10">2</span>
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-4 tracking-tight">Generate & Attach</h3>
                <p className="text-zinc-500 font-medium leading-relaxed px-2">Download your custom QR code or link an NFC tag. Attach it to a pet's collar, a kid's backpack, or a medical bracelet.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-28 h-28 bg-white border border-zinc-200 shadow-lg rounded-full flex items-center justify-center mb-8 group-hover:scale-110 group-hover:border-brandDark transition-all duration-500 relative">
                  <div className="absolute inset-0 bg-brandDark/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500"></div>
                  <span className="text-4xl font-black text-brandDark relative z-10">3</span>
                </div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-4 tracking-tight">Get Scanned</h3>
                <p className="text-zinc-500 font-medium leading-relaxed px-2">If they are lost, a Good Samaritan scans the tag. You instantly get an alert, and they can send you their exact GPS location.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* INTERACTIVE 3D CARD STACK FEATURES */}
      <section className="py-32 relative overflow-hidden bg-zinc-900 border-y border-zinc-800">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brandGold/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full mb-6">
                <Zap size={14} className="text-brandGold" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-white">Engineered for Safety</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">Smarter than a standard ID.</h2>
              <p className="text-zinc-400 font-medium text-lg">Swipe to explore how KinTag brings them home safely and quickly.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="w-full max-w-lg mx-auto flex justify-center">
              <CardStack
                items={stackFeatures}
                initialIndex={0}
                autoAdvance
                intervalMs={3500}
                pauseOnHover
                showDots={false} 
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* DEVELOPER STORY BENTO */}
      <section className="py-24 px-4 relative z-10">
        <ScrollReveal>
          <div className="max-w-5xl mx-auto bg-white rounded-[3rem] p-8 md:p-16 shadow-[0_20px_50px_rgb(0,0,0,0.05)] border border-zinc-200/80 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brandGold/5 rounded-full blur-3xl pointer-events-none group-hover:bg-brandGold/10 transition-colors duration-700"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center space-x-2 bg-rose-50 border border-rose-100 px-4 py-1.5 rounded-full mb-2">
                  <Heart size={14} className="text-rose-500" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-rose-600">The KinTag Story</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-brandDark tracking-tight leading-[1.1]">
                  Built by a solo developer.<br/>Driven by pure passion.
                </h2>
                <div className="space-y-4 text-zinc-600 font-medium leading-relaxed md:text-lg">
                  <p>
                    I built KinTag in a single week. When I looked for a way to safeguard my own family, I found an industry plagued by bulky hardware, clunky apps, and predatory monthly subscriptions. 
                  </p>
                  <p>
                    I realized I couldn't trust massive corporations with my family's deeply personal data. More importantly, I absolutely refused to be trapped in a subscription cycle for something so crucial. <span className="text-brandDark font-bold">Think about it: one forgotten payment, and your child's safety net is instantly turned off.</span> I couldn't live with that anxiety.
                  </p>
                  <p className="text-brandDark text-xl md:text-2xl font-black pt-2">
                    That is exactly why KinTag is <span className="text-emerald-500 border-b-4 border-emerald-200 pb-0.5">100% free for lifetime.</span>
                  </p>
                  <p>
                    I actively use this platform for my own loved ones, because I needed to build the exact tool I wished existed.
                  </p>
                </div>
              </div>
              
              <div className="flex-1 w-full bg-zinc-50 p-8 rounded-[2rem] border border-zinc-200 shadow-inner">
                <h3 className="text-brandDark font-black tracking-tight mb-6 text-2xl">The KinTag Promise:</h3>
                <ul className="space-y-5 mb-10">
                  <li className="flex items-start text-zinc-700 font-bold gap-4"><CheckCircle2 size={24} className="text-emerald-500 shrink-0"/> Fully encrypted Google Firebase database</li>
                  <li className="flex items-start text-zinc-700 font-bold gap-4"><CheckCircle2 size={24} className="text-emerald-500 shrink-0"/> Zero hidden paywalls or premium lockouts</li>
                  <li className="flex items-start text-zinc-700 font-bold gap-4"><CheckCircle2 size={24} className="text-emerald-500 shrink-0"/> You have absolute ownership of your data</li>
                  <li className="flex items-start text-zinc-700 font-bold gap-4"><CheckCircle2 size={24} className="text-emerald-500 shrink-0"/> Built specifically for parents, by a parent</li>
                </ul>
                <Link to="/signup" className="w-full flex items-center justify-center bg-brandDark text-white py-4 px-8 rounded-2xl font-bold text-lg hover:bg-brandAccent transition-all shadow-lg hover:-translate-y-1">
                  Create Your Free KinTag
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* MONOCHROME FAQ SECTION */}
      <FAQMonochrome faqs={faqData} />

      {/* APP INSTALL & OPEN SOURCE BENTO ROW */}
      <section className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Native App Bento */}
          <ScrollReveal delay={0}>
            <div className="bg-brandDark rounded-[3rem] p-8 md:p-12 shadow-xl relative overflow-hidden border border-zinc-800 h-full flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brandGold/10 rounded-full blur-3xl pointer-events-none group-hover:bg-brandGold/20 transition-all"></div>
              
              <div className="relative z-10 mb-8">
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full mb-6">
                  <Smartphone size={14} className="text-brandGold" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-white">Experience Native</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-[1.1] mb-4">
                  Get the KinTag App
                </h2>
                <p className="text-zinc-400 font-medium text-lg leading-relaxed">
                  For the best, full-screen experience without browser distractions, install the KinTag Web App directly to your device.
                </p>
              </div>

              <div className="relative z-10">
                {deferredPrompt ? (
                  <button onClick={handleInstallApp} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-brandGold text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-amber-500 transition-all hover:-translate-y-1">
                    <Download size={20} />
                    <span>Install Web App</span>
                  </button>
                ) : (
                  <div className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/10 text-white/50 px-8 py-4 rounded-2xl font-bold border border-white/10 cursor-not-allowed">
                    <CheckCircle2 size={20} />
                    <span>Web App Installed</span>
                  </div>
                )}
                <p className="text-zinc-500 text-xs font-medium mt-4">
                  * iOS Users: Tap the Share icon in Safari & select "Add to Home Screen".
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Open Source Bento */}
          <ScrollReveal delay={150}>
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl relative overflow-hidden border border-zinc-200 h-full flex flex-col justify-between group">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-zinc-100 rounded-full blur-3xl pointer-events-none group-hover:bg-zinc-200 transition-all"></div>
              
              <div className="relative z-10 mb-8">
                <div className="inline-flex items-center space-x-2 bg-zinc-100 border border-zinc-200 px-4 py-1.5 rounded-full mb-6">
                  <Code2 size={14} className="text-brandDark" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-brandDark">Self-Hostable</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-brandDark tracking-tight leading-[1.1] mb-4">
                  Open & Transparent
                </h2>
                <p className="text-zinc-500 font-medium text-lg leading-relaxed">
                  Are you a developer? You shouldn't have to rely on third-party servers. Grab the React/Vite code and hook it up to your own Firebase.
                </p>
              </div>

              <div className="relative z-10">
                <div className="bg-zinc-900 rounded-2xl p-5 shadow-inner border border-zinc-800 text-left mb-6">
                  <div className="flex gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <pre className="text-emerald-400 font-mono text-[11px] sm:text-xs overflow-x-auto">
                    <code>
  <span className="text-zinc-500"># Clone repo & install</span><br/>
  <span className="text-blue-400">git clone</span> https://github.com/...<br/>
  <span className="text-blue-400">npm</span> install<br/>
  <span className="text-zinc-500"># Start local server</span><br/>
  <span className="text-blue-400">npm run</span> dev
                    </code>
                  </pre>
                </div>
                
                <button onClick={handleGithubClick} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-zinc-100 text-zinc-400 border border-zinc-200 px-8 py-4 rounded-2xl font-bold cursor-not-allowed transition-all">
                  <Github size={20} />
                  <span>View GitHub Repo</span>
                </button>
                {showGithubTooltip && (
                  <p className="text-xs text-brandDark font-bold mt-3 animate-in fade-in">Coming soon to public repositories.</p>
                )}
              </div>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* FINAL PRE-FOOTER (Contact, Changelog, CTA Combined) */}
      <section className="pt-24 pb-12 px-4 relative z-10">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto text-center bg-white p-10 md:p-16 rounded-[3rem] shadow-sm border border-zinc-200/80">
            <Rocket size={48} className="text-brandGold mx-auto mb-6 drop-shadow-sm" />
            <h2 className="text-4xl md:text-6xl font-black text-brandDark tracking-tighter mb-6 leading-[1.1]">
              Ready to secure your loved ones?
            </h2>
            <p className="text-zinc-500 font-medium text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Join the platform today, create your first tag in under 2 minutes, and help us scale this mission to protect more families.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/signup" className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-brandGold text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-amber-500 transition-all shadow-[0_8px_30px_rgb(245,158,11,0.3)] hover:-translate-y-1">
                <span>Get Started for Free</span>
                <ArrowRight size={20} />
              </Link>
              <Link to="/changelog" className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-zinc-50 text-brandDark border border-zinc-200 px-10 py-5 rounded-full font-bold text-xl hover:bg-zinc-100 transition-all shadow-sm hover:-translate-y-1">
                Read Changelog
              </Link>
            </div>

            <div className="border-t border-zinc-100 pt-10">
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Need Help? Contact the Developer</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a href="mailto:shovith2@gmail.com" className="flex items-center gap-2 bg-white hover:bg-zinc-50 text-brandDark border border-zinc-200 px-5 py-2.5 rounded-full font-bold transition-all shadow-sm">
                  <Mail size={16} className="text-blue-500"/> Email
                </a>
                <a href="https://wa.me/918777845713" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white hover:bg-zinc-50 text-brandDark border border-zinc-200 px-5 py-2.5 rounded-full font-bold transition-all shadow-sm">
                  <MessageCircle size={16} className="text-emerald-500"/> WhatsApp
                </a>
                <a href="https://t.me/X_o_x_o_002" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white hover:bg-zinc-50 text-brandDark border border-zinc-200 px-5 py-2.5 rounded-full font-bold transition-all shadow-sm">
                  <Send size={16} className="text-sky-500"/> Telegram
                </a>
              </div>
            </div>

          </div>
        </ScrollReveal>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center relative z-10">
        <div className="flex items-center justify-center space-x-2 mb-3 opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
          <img src="/kintag-logo.png" alt="Logo" className="w-5 h-5 rounded grayscale" />
          <span className="font-bold text-brandDark tracking-tight">KinTag</span>
        </div>
        <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">© {new Date().getFullYear()} KinTag. All rights reserved.</p>
      </footer>

    </div>
  );
}

function ScrollReveal({ children, delay = 0 }) {
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
      className={`transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
    >
      {children}
    </div>
  );
}
