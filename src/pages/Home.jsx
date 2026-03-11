import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom'; 
import { Turnstile } from '@marsidev/react-turnstile';
import { CardStack } from '../components/ui/card-stack'; 
import { FAQMonochrome } from '../components/ui/faq-monochrome'; 
import { 
  Shield, MapPin, BellRing, Heart, Smartphone, Github, ArrowRight, 
  CheckCircle2, PawPrint, User, Activity, Info, RefreshCw, Battery, Cloud, 
  Lock, Infinity, Zap, Mail, MessageCircle, Send, 
  Users, Database, Phone, AlertTriangle, Trash2, Rocket, Siren, Megaphone, FileText, ShieldCheck, Download, ChevronRight
} from 'lucide-react';

const stackFeatures = [
  { id: 1, title: "No App Required", description: "Anyone with a smartphone camera can scan the tag. There is absolutely nothing for the finder to download or install.", icon: <Smartphone size={40} className="text-zinc-800" /> },
  { id: 2, title: "Instant Setup", description: "Skip the wait times of ordering custom engraved metals. Create an account and secure your child or pet in under 2 minutes.", icon: <Zap size={40} className="text-zinc-800" /> },
  { id: 3, title: "Unlimited Scans", description: "There is absolutely no cap on how many times your QR codes or NFC tags can be scanned.", icon: <Infinity size={40} className="text-zinc-800" /> },
  { id: 4, title: "Precision GPS Pinpointing", description: "When scanned, the finder can securely send their exact coordinates directly to your phone with a single tap.", icon: <MapPin size={40} className="text-zinc-800" /> },
  { id: 5, title: "Passive Location Fallback", description: "Even if the finder denies GPS access, KinTag will passively log their general IP-based city and send an alert.", icon: <MapPin size={40} className="text-zinc-800" /> },
  { id: 6, title: "Instant Push Alerts", description: "The second a tag is scanned, you receive an emergency push notification alerting you that your loved one was found.", icon: <BellRing size={40} className="text-zinc-800" /> },
  { id: 7, title: "One-Tap Emergency Dial", description: "A massive, clear button allows the finder to instantly dial your emergency contact number without copying it.", icon: <Phone size={40} className="text-zinc-800" /> },
  { id: 8, title: "Lost Mode (Panic Button)", description: "Instantly transform a lost tag into a high-alert distress signal with a flashing missing banner and pulsing emergency dialer.", icon: <Siren size={40} className="text-zinc-800" /> },
  { id: 9, title: "KinAlert Broadcasts", description: "Trigger an instant localized push notification to all other KinTag users in your zip code to help search for your missing loved one.", icon: <Megaphone size={40} className="text-zinc-800" /> },
  { id: 10, title: "Secure Document Vault", description: "Upload sensitive medical records or IDs. They remain heavily locked and blurred until the finder explicitly shares their GPS location or calls you.", icon: <FileText size={40} className="text-zinc-800" /> },
  { id: 11, title: "Anti-Download Protection", description: "Strict UI protections prevent strangers from right-clicking, dragging, or long-pressing to save your photos and documents.", icon: <ShieldCheck size={40} className="text-zinc-800" /> },
  { id: 12, title: "Co-Guardian Family Sharing", description: "Invite up to 5 family members. When a tag is scanned, every co-guardian receives an instant push alert simultaneously.", icon: <Users size={40} className="text-zinc-800" /> },
  { id: 13, title: "Behavioral Alerts", description: "Highlight critical non-verbal behaviors, special needs, or fears so the finder knows exactly how to approach them.", icon: <AlertTriangle size={40} className="text-zinc-800" /> },
  { id: 14, title: "Critical Medical Info", description: "Display crucial allergies, blood types, and daily medications instantly to whoever scans the tag.", icon: <Heart size={40} className="text-zinc-800" /> },
  { id: 15, title: "Microchip Linking", description: "Store your pet's official microchip ID number visibly so veterinarians can cross-reference it instantly.", icon: <Database size={40} className="text-zinc-800" /> },
  { id: 16, title: "Vaccination Records", description: "Display rabies and core vaccination statuses to reassure finders that your pet is safe to handle.", icon: <Activity size={40} className="text-zinc-800" /> },
  { id: 17, title: "Dynamic Updates", description: "Moved to a new house? Changed your phone number? Update your profile instantly without ever needing to print a new tag.", icon: <RefreshCw size={40} className="text-zinc-800" /> },
  { id: 18, title: "Cloud Synced", description: "All your profiles are securely backed up to the cloud. Access and manage your dashboard from any device.", icon: <Cloud size={40} className="text-zinc-800" /> },
  { id: 19, title: "Complete Data Control", description: "You own your data. Permanently wipe your account, profiles, and scan histories from our servers at any time.", icon: <Trash2 size={40} className="text-zinc-800" /> },
  { id: 20, title: "Zero Battery Required", description: "Unlike bulky GPS collars that constantly die and require charging, KinTag relies on the battery and cellular data of the Good Samaritan's smartphone. Your tag will never run out of power.", icon: <Battery size={40} className="text-zinc-800" /> }
];

export default function Home() {
  const [showGithubTooltip, setShowGithubTooltip] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

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
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center mx-auto mb-6 border border-zinc-200/50">
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-12 h-12 rounded-xl animate-pulse" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 tracking-tight mb-2">Authenticating...</h1>
          <p className="text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
            Please wait a moment to ensure you are a real person before accessing the platform.
          </p>
        </div>
        <div className="animate-in fade-in zoom-in-95 duration-500 delay-300 min-h-[65px]">
          <Turnstile siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={() => setIsVerified(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white animate-in fade-in duration-700 w-full">
      
      {/* 🌟 NEW: FLOATING PILL NAVBAR */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav className="pointer-events-auto bg-white/70 backdrop-blur-xl border border-zinc-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-full px-5 py-3 flex items-center justify-between w-full max-w-5xl transition-all">
          <div className="flex items-center space-x-3">
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-8 h-8 rounded-xl shadow-sm border border-zinc-100" />
            <span className="text-xl font-extrabold tracking-tight">KinTag</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link to="/login" className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors px-2">Log In</Link>
            <Link to="/signup" className="bg-zinc-900 text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </nav>
      </div>

      {/* 🌟 NEW: MODERN GRID HERO SECTION */}
      <section className="relative pt-40 pb-24 md:pt-52 md:pb-32 px-4 overflow-hidden">
        {/* Subtle dot background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-60 z-0"></div>
        {/* Glowing Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brandGold/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <ScrollReveal delay={0}>
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-zinc-200/80 px-4 py-2 rounded-full mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-600">V1.1.1 is Live</span>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <h1 className="text-6xl md:text-[5.5rem] font-extrabold tracking-tighter leading-[1.05] mb-8 text-zinc-900 drop-shadow-sm">
              The ultimate <br className="hidden md:block"/> digital safety net.
            </h1>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <p className="text-lg md:text-2xl text-zinc-500 font-medium max-w-2xl mx-auto mb-12 leading-relaxed tracking-tight">
              Link custom QR codes or NFC tags to life-saving profiles for your kids and pets. 
              <span className="text-zinc-800 font-semibold"> Scanned in a panic, found in an instant.</span>
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/signup" className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-zinc-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                <span>Start Securing Free</span>
                <ArrowRight size={18} />
              </Link>
              <button onClick={scrollToHowItWorks} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white text-zinc-900 border border-zinc-200/80 px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-50 transition-all shadow-sm">
                See how it works
              </button>
            </div>
          </ScrollReveal>

          {/* 🌟 REFINED: Floating Iframes with better perspective */}
          <ScrollReveal delay={400}>
            <div className="relative mx-auto max-w-5xl mt-10">
              <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 perspective-[2000px] w-full pb-10 md:pb-0 relative z-20">
                
                {/* Glow behind phones */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[80%] bg-zinc-400/20 blur-[120px] rounded-full -z-10"></div>

                <div className="relative w-[280px] md:w-[320px] aspect-[9/19.5] rounded-[2.5rem] md:rounded-[3.2rem] border-[10px] border-zinc-900 bg-zinc-900 shadow-[0_30px_60px_rgba(0,0,0,0.3)] overflow-hidden transform md:rotate-y-[12deg] md:rotate-x-[5deg] z-20 md:hover:rotate-y-0 md:hover:rotate-x-0 hover:scale-[1.03] transition-all duration-700 ease-out group shrink-0 ring-1 ring-white/10">
                  <div className="relative w-full h-full bg-zinc-100 overflow-hidden rounded-[2rem] md:rounded-[2.6rem]">
                     <div className="absolute top-0 left-0 w-[375px] h-[813px] origin-top-left max-md:[transform:scale(0.704)] md:[transform:scale(0.8)]">
                        <iframe src="https://kintag.vercel.app/#/id/kJeMwTQgTnuARri1gwc3?preview=true" className="w-full h-full border-0 [&::-webkit-scrollbar]:hidden pointer-events-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} title="Live Kid Profile View" />
                     </div>
                  </div>
                </div>

                <div className="relative w-[280px] md:w-[310px] aspect-[9/20] rounded-[2.2rem] md:rounded-[3rem] border-[10px] border-zinc-800 bg-zinc-800 shadow-[0_30px_60px_rgba(0,0,0,0.2)] overflow-hidden transform md:rotate-y-[-12deg] md:rotate-x-[5deg] z-10 md:hover:rotate-y-0 md:hover:rotate-x-0 hover:scale-[1.03] transition-all duration-700 ease-out group shrink-0 ring-1 ring-white/5">
                  <div className="relative w-full h-full bg-zinc-100 overflow-hidden rounded-[1.7rem] md:rounded-[2.4rem]">
                     <div className="absolute top-0 left-0 w-[375px] h-[834px] origin-top-left max-md:[transform:scale(0.704)] md:[transform:scale(0.7733)]">
                        <iframe src="https://kintag.vercel.app/#/id/OSCIDGkJXSIh9mTmOVtr?preview=true" className="w-full h-full border-0 [&::-webkit-scrollbar]:hidden pointer-events-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} title="Live Pet Profile View" />
                     </div>
                  </div>
                </div>

              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 🌟 NEW: SLEEK PROCESS TIMELINE */}
      <section id="how-it-works" className="py-32 bg-white scroll-mt-20 relative border-t border-zinc-200/50">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">How it works.</h2>
              <p className="text-zinc-500 font-medium text-lg">Three steps between lost and safely found.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-zinc-200 to-transparent -z-10"></div>
            
            <ScrollReveal delay={0}>
              <div className="flex flex-col items-center text-center bg-[#fafafa] p-8 rounded-[2.5rem] border border-zinc-200/50 shadow-sm h-full hover:shadow-md transition-all">
                <div className="w-16 h-16 bg-white border-2 border-zinc-100 shadow-sm rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-2xl font-extrabold text-zinc-800">1</span>
                </div>
                <h3 className="text-xl font-extrabold mb-3">Create a Profile</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">Sign up and build a detailed digital ID card containing emergency contacts, medical info, and behavioral details.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="flex flex-col items-center text-center bg-[#fafafa] p-8 rounded-[2.5rem] border border-zinc-200/50 shadow-sm h-full hover:shadow-md transition-all">
                <div className="w-16 h-16 bg-white border-2 border-zinc-100 shadow-sm rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-2xl font-extrabold text-zinc-800">2</span>
                </div>
                <h3 className="text-xl font-extrabold mb-3">Generate & Attach</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">Download your custom QR code or link an NFC tag. Attach it to a pet's collar, a kid's backpack, or a medical bracelet.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="flex flex-col items-center text-center bg-[#fafafa] p-8 rounded-[2.5rem] border border-zinc-200/50 shadow-sm h-full hover:shadow-md transition-all">
                <div className="w-16 h-16 bg-zinc-900 border-2 border-zinc-800 shadow-lg rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-2xl font-extrabold text-white">3</span>
                </div>
                <h3 className="text-xl font-extrabold mb-3">Get Scanned</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">If they are lost, a Good Samaritan scans the tag. You instantly get an alert, and they can send you their exact GPS location.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 🌟 NEW: BENTO BOX GRID (Who is it for + Install App) */}
      <section className="py-32 bg-[#fafafa] border-t border-zinc-200/50">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Built for the vulnerable.</h2>
              <p className="text-zinc-500 font-medium text-lg">Designed specifically for those who cannot speak for themselves.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tall Kid Bento */}
            <ScrollReveal delay={0} className="lg:col-span-1">
              <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-zinc-200/60 shadow-sm h-full flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
                <div>
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform">
                    <User size={32} />
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight mb-4">Children</h3>
                  <p className="text-zinc-500 font-medium leading-relaxed mb-8">
                    Perfect for amusement parks, crowded malls, or field trips. Alert finders to non-verbal behaviors, autism triggers, or severe allergies instantly.
                  </p>
                </div>
                <div className="w-full h-32 bg-gradient-to-t from-blue-50 to-transparent rounded-2xl border-b-4 border-blue-100"></div>
              </div>
            </ScrollReveal>
            
            {/* Stacked Bento */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                <ScrollReveal delay={100} className="h-full">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200/60 shadow-sm h-full group hover:shadow-lg transition-all">
                    <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform">
                      <PawPrint size={28} />
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight mb-3">Pets</h3>
                    <p className="text-zinc-500 font-medium leading-relaxed">
                      Easily share their microchip number, temperament, and diet restrictions instantly if they escape the yard.
                    </p>
                  </div>
                </ScrollReveal>
                
                <ScrollReveal delay={200} className="h-full">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200/60 shadow-sm h-full group hover:shadow-lg transition-all">
                    <div className="w-14 h-14 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform">
                      <Activity size={28} />
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight mb-3">Seniors</h3>
                    <p className="text-zinc-500 font-medium leading-relaxed">
                      A critical safety net for elderly family members prone to wandering, detailing their primary caregivers.
                    </p>
                  </div>
                </ScrollReveal>
              </div>

              {/* App Install Bento */}
              <ScrollReveal delay={300}>
                <div className="bg-zinc-900 text-white p-8 md:p-10 rounded-[3rem] border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brandGold/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-brandGold/30 transition-colors"></div>
                  
                  <div className="relative z-10 text-center md:text-left">
                    <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full mb-4">
                      <Smartphone size={12} className="text-brandGold" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest">Native Experience</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">Install the Web App</h3>
                    <p className="text-zinc-400 font-medium">Get full-screen access and instant loading directly from your home screen.</p>
                  </div>

                  <div className="relative z-10 shrink-0 w-full md:w-auto">
                    {deferredPrompt ? (
                      <button onClick={handleInstallApp} className="w-full md:w-auto flex items-center justify-center space-x-2 bg-white text-zinc-900 px-8 py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-all">
                        <Download size={18} />
                        <span>Install Now</span>
                      </button>
                    ) : (
                      <div className="w-full md:w-auto flex items-center justify-center space-x-2 bg-white/10 text-white/50 px-8 py-4 rounded-full font-bold border border-white/10 cursor-not-allowed">
                        <CheckCircle2 size={18} />
                        <span>Installed</span>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>

      {/* CARD STACK FEATURES */}
      <section className="py-32 bg-white border-t border-zinc-200/50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Smarter than a standard ID.</h2>
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

      {/* 🌟 NEW: EDITORIAL DEV STORY BENTO */}
      <section className="py-32 px-4 bg-[#fafafa] border-t border-zinc-200/50">
        <ScrollReveal>
          <div className="max-w-5xl mx-auto bg-white rounded-[3rem] p-8 md:p-16 border border-zinc-200/60 shadow-[0_20px_60px_rgba(0,0,0,0.04)] relative overflow-hidden flex flex-col md:flex-row items-center gap-16">
            
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-zinc-100 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="flex-1 space-y-8 relative z-10">
              <div className="inline-flex items-center space-x-2 bg-zinc-100 border border-zinc-200 px-4 py-1.5 rounded-full">
                <Heart size={14} className="text-zinc-900" fill="currentColor" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-600">The KinTag Mission</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05] text-zinc-900">
                Built by a solo developer.<br/><span className="text-zinc-400">Driven by passion.</span>
              </h2>
              
              <div className="space-y-5 text-zinc-600 font-medium leading-relaxed md:text-lg">
                <p>
                  I built KinTag in a single week. When I looked for a way to safeguard my own family, I found an industry plagued by bulky hardware, clunky apps, and predatory monthly subscriptions.
                </p>
                <p>
                  I absolutely refused to be trapped in a subscription cycle for something so crucial. <strong className="text-zinc-900">Think about it: one forgotten payment, and your child's safety net is instantly turned off.</strong> I couldn't live with that anxiety.
                </p>
                <p className="text-zinc-900 text-xl font-bold pt-2 border-l-4 border-zinc-900 pl-4">
                  That is exactly why KinTag is 100% free for lifetime.
                </p>
              </div>

              <Link to="/signup" className="inline-flex items-center justify-center space-x-2 bg-zinc-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-800 transition-all shadow-md hover:-translate-y-1">
                <span>Create Your Free Tag</span>
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="w-full md:w-auto shrink-0 relative z-10">
              <div className="bg-zinc-50 p-8 rounded-[2.5rem] border border-zinc-200 shadow-inner max-w-sm w-full space-y-6">
                <h3 className="font-extrabold text-xl tracking-tight mb-2">The Promise</h3>
                <ul className="space-y-4">
                  <li className="flex items-start text-zinc-600 font-medium gap-3"><CheckCircle2 size={20} className="text-zinc-900 shrink-0 mt-0.5"/> Fully encrypted database</li>
                  <li className="flex items-start text-zinc-600 font-medium gap-3"><CheckCircle2 size={20} className="text-zinc-900 shrink-0 mt-0.5"/> Zero hidden paywalls</li>
                  <li className="flex items-start text-zinc-600 font-medium gap-3"><CheckCircle2 size={20} className="text-zinc-900 shrink-0 mt-0.5"/> Total data ownership</li>
                  <li className="flex items-start text-zinc-600 font-medium gap-3"><CheckCircle2 size={20} className="text-zinc-900 shrink-0 mt-0.5"/> Built by a parent</li>
                </ul>
              </div>
            </div>
            
          </div>
        </ScrollReveal>
      </section>

      {/* MONOCHROME FAQ SECTION */}
      <FAQMonochrome faqs={faqData} />

      {/* 🌟 NEW: DARK MODE FINISH (Self-Host & Contact merging into footer) */}
      <div className="bg-zinc-950 text-white pt-24 pb-10 border-t border-white/10">
        
        {/* Self Host Mini-Bento */}
        <section className="max-w-5xl mx-auto px-4 md:px-8 mb-24">
          <ScrollReveal>
            <div className="bg-zinc-900 rounded-[3rem] p-8 md:p-12 border border-white/10 shadow-2xl flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <h2 className="text-3xl font-extrabold tracking-tight mb-4 flex items-center gap-3">
                  <Github size={32} /> Open & Self-Hostable
                </h2>
                <p className="text-zinc-400 font-medium leading-relaxed mb-8">
                  Developers shouldn't have to rely on third-party servers. Grab the code, hook it up to your own Firebase instance, and take 100% ownership of your database.
                </p>
                <div className="relative inline-block">
                  <button onClick={handleGithubClick} className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-bold transition-all border border-white/10">
                    <span>View GitHub Repo</span>
                  </button>
                  {showGithubTooltip && (
                    <div className="absolute top-1/2 left-[calc(100%+14px)] -translate-y-1/2 bg-white text-zinc-900 text-xs font-bold px-3 py-2 rounded-lg shadow-xl animate-in fade-in slide-in-from-left-2 duration-200 z-10">
                      Coming soon
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 w-full bg-black/50 p-6 rounded-3xl border border-white/5 font-mono text-sm text-emerald-400 overflow-x-auto shadow-inner">
                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <p><span className="text-zinc-500"># Clone the repository</span><br/><span className="text-blue-400">git clone</span> https://github.com/...</p>
                <p className="mt-3"><span className="text-zinc-500"># Start local server</span><br/><span className="text-blue-400">npm run</span> dev</p>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* Contact & Footer */}
        <section className="max-w-4xl mx-auto px-4 md:px-8 text-center border-b border-white/10 pb-20">
          <ScrollReveal>
            <h2 className="text-3xl font-extrabold tracking-tight mb-6">Help keep KinTag alive.</h2>
            <p className="text-zinc-400 font-medium text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              KinTag relies entirely on free-tier backend services. As more families join, our limits will eventually max out. If you believe in this mission and want to help scale it, or just say hi, my inbox is open!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="mailto:shovith2@gmail.com" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-full font-bold transition-all">
                <Mail size={18}/> Email Me
              </a>
              <a href="https://wa.me/918777845713" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-full font-bold transition-all">
                <MessageCircle size={18}/> WhatsApp
              </a>
              <a href="https://t.me/X_o_x_o_002" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-full font-bold transition-all">
                <Send size={18}/> Telegram
              </a>
            </div>
          </ScrollReveal>
        </section>

        <footer className="text-center pt-10">
          <div className="flex items-center justify-center space-x-2 mb-4 opacity-50">
            <img src="/kintag-logo.png" alt="Logo" className="w-5 h-5 rounded grayscale" />
            <span className="font-bold text-white">KinTag</span>
          </div>
          <p className="text-xs text-zinc-500 font-bold tracking-widest uppercase">
            © {new Date().getFullYear()} KINTAG. ALL RIGHTS RESERVED. 
            <Link to="/changelog" className="ml-4 hover:text-white transition-colors">CHANGELOG</Link>
          </p>
        </footer>
      </div>

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
