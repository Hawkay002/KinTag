import { useState } from 'react';
import { Link } from 'react-router-dom'; 
import { 
  Shield, MapPin, BellRing, Heart, QrCode, Smartphone, Github, ArrowRight, 
  CheckCircle2, PawPrint, User, Activity, Info, RefreshCw, Battery, Cloud, 
  ChevronDown, Lock, Globe, Infinity, Zap, Mail, MessageCircle, Send, 
  Users, Wifi, Database, Phone, AlertTriangle, PowerOff, Trash2
} from 'lucide-react';

export default function Home() {
  const [showGithubTooltip, setShowGithubTooltip] = useState(false);
  const [isFaqExpanded, setIsFaqExpanded] = useState(false);

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

  // 🌟 UPDATED: FAQs to include new Family Sharing & Security features
  const faqData = [
    { q: "Is there a monthly subscription fee?", a: "No! The core KinTag platform is entirely free to use. We don't believe in holding your family's safety hostage behind a monthly paywall. You only pay for your own blank NFC tags or printing if you choose to." },
    { q: "Does the finder need to download an app?", a: "No. That is the magic of KinTag. In a panic, you don't want a finder struggling to download an app. They simply point their standard phone camera at the QR code, and it opens a secure, native webpage instantly." },
    { q: "Can my spouse and I both receive alerts?", a: "Yes! With our new Family Sharing feature, you can invite up to 5 co-guardians. If your child or pet's tag is scanned, every guardian receives an instant push notification on their own phone, and everyone can manage the profiles." },
    { q: "Do I have to buy special tags directly from you?", a: "Not at all. You can generate and download high-resolution QR codes directly from your dashboard to print on standard paper/stickers, or you can buy cheap, blank NFC tags from Amazon and program them yourself." },
    { q: "What happens if the finder denies GPS access?", a: "KinTag uses a dual-layer alert system. Even if the finder taps 'No' to sharing their exact GPS coordinates, our system performs a 'Passive Scan' which grabs their general IP-based city/region and sends you an instant push notification anyway." },
    { q: "What if a tag gets lost or stolen?", a: "We built an instant 'Kill Switch'. From your dashboard, you can click one button to disable any profile. If someone scans the lost tag, they will be blocked by a secure 'Profile Disabled' screen, protecting your data." },
    { q: "What if I move or change my phone number?", a: "Because KinTag is a cloud-based digital ID, any changes you make in your dashboard are instantly updated on the live tag. You never have to engrave, print, or buy a new physical tag just because you moved!" },
    { q: "Does the tag have a battery I need to charge?", a: "No. Unlike bulky, heavy GPS collars that constantly die and require charging, KinTag relies on the battery and cellular data of the Good Samaritan's smartphone. Your tag will never run out of power." },
    { q: "Can I create profiles for multiple pets or kids?", a: "Yes! Your single KinTag dashboard can hold multiple profiles. You can create unique cards and QR codes for every child, dog, or cat in your household." },
    { q: "What is an NFC tag and how do I use it?", a: "NFC (Near Field Communication) is the same technology used for Apple Pay. You can buy blank NFC stickers online, and use free apps to program your unique KinTag URL onto them. Anyone who taps their phone to the sticker will instantly open your profile." },
    { q: "How do I delete my data if I stop using KinTag?", a: "You have total ownership of your data. We built a 'Danger Zone' in your profile settings where you can permanently wipe your account, all created profiles, and all scan histories from our servers instantly." },
    { q: "Is my medical and contact data kept private?", a: "Your data is only accessible to someone who physically scans your unique, randomly generated tag. It is not listed in a public directory or searchable on Google." },
    { q: "Will the QR code fade or expire?", a: "The link embedded in the QR code will never expire as long as your account is active. If you print it on paper, we recommend placing clear tape over it to waterproof it to prevent smudging." },
    { q: "Can I print the tags myself?", a: "Absolutely. When you create a profile, you get a 'Download QR' button. You can print this at home, scale it down, and laminate it onto a backpack or dog collar." },
    { q: "Can I self-host this application?", a: "Yes. KinTag was built to be open and transparent. Developers can clone the repository and hook it up to their own private database for ultimate ownership." },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-brandGold selection:text-white">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200/50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-8 h-8 rounded-lg shadow-sm" />
            <span className="text-xl font-extrabold text-brandDark tracking-tight">KinTag</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-bold text-zinc-600 hover:text-brandDark transition-colors">Log In</Link>
            <Link to="/signup" className="bg-brandDark text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-brandAccent transition-all shadow-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brandGold/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-white border border-zinc-200 px-4 py-1.5 rounded-full mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-500">V1.0 is now live</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-brandDark tracking-tight leading-[1.1] mb-6">
            The ultimate digital <br className="hidden md:block"/> safety net for your family.
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-500 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            Link custom QR codes or NFC tags to life-saving digital profiles for your kids and pets. If they ever wander off, a simple scan sends you their exact GPS location instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link to="/signup" className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-brandDark text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-brandAccent transition-all shadow-lg hover:-translate-y-0.5">
              <span>Try KinTag for Free</span>
              <ArrowRight size={18} />
            </Link>
            <button onClick={scrollToHowItWorks} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white text-brandDark border border-zinc-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-50 transition-all shadow-sm">
              How it works
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-10">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500"/> 100% Free Forever</span>
            <span className="flex items-center gap-1.5"><Lock size={14} className="text-brandGold"/> Secure & Encrypted</span>
            <span className="flex items-center gap-1.5"><Shield size={14} className="text-blue-500"/> No App Required</span>
          </div>

          {/* Responsive, Side-by-Side Flex Layout with Scrollbar Hide Trick */}
          <div className="relative mx-auto max-w-5xl">
            {/* Tiny Live Preview Badge */}
            <div className="flex justify-center mb-8 relative z-40">
              <div className="inline-flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 text-white px-3 py-1.5 rounded-full shadow-2xl">
                <Info size={12} className="text-brandGold shrink-0" />
                <span className="text-[9px] md:text-[10px] font-bold tracking-wide uppercase">
                  Live Preview: Action buttons disabled
                </span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-16 perspective-[1200px] w-full pb-10 md:pb-0">
              
              {/* iPhone Mockup (Live Kid Profile) */}
              <div className="relative w-[280px] md:w-[320px] aspect-[9/19.5] rounded-[2.25rem] md:rounded-[3rem] border-[8px] md:border-[10px] border-zinc-900 bg-zinc-900 shadow-2xl overflow-hidden transform md:rotate-y-[8deg] md:rotate-x-[4deg] z-20 md:hover:rotate-y-0 hover:scale-[1.02] transition-all duration-700 ease-out group shrink-0">
                <div className="relative w-full h-full bg-zinc-100 overflow-hidden rounded-[1.75rem] md:rounded-[2.4rem]">
                   <div className="absolute top-0 left-0 w-[375px] h-[813px] origin-top-left max-md:[transform:scale(0.600)] md:[transform:scale(0.8)]">
                      <div className="w-[375px] h-full overflow-hidden">
                        <iframe 
                          src="https://kintag.vercel.app/#/id/kJeMwTQgTnuARri1gwc3?preview=true" 
                          className="w-[395px] h-full border-0" 
                          title="Live Kid Profile View"
                        />
                      </div>
                   </div>
                </div>
              </div>

              {/* Google Pixel Mockup (Live Pet Profile) */}
              <div className="relative w-[280px] md:w-[310px] aspect-[9/20] rounded-[2rem] md:rounded-[2.75rem] border-[8px] md:border-[10px] border-zinc-800 bg-zinc-800 shadow-2xl overflow-hidden transform md:rotate-y-[-8deg] md:rotate-x-[4deg] z-10 md:hover:rotate-y-0 hover:scale-[1.02] transition-all duration-700 ease-out group shrink-0">
                <div className="relative w-full h-full bg-zinc-100 overflow-hidden rounded-[1.5rem] md:rounded-[2.1rem]">
                   <div className="absolute top-0 left-0 w-[375px] h-[834px] origin-top-left max-md:[transform:scale(0.704)] md:[transform:scale(0.7733)]">
                      <div className="w-[375px] h-full overflow-hidden">
                        <iframe 
                          src="https://kintag.vercel.app/#/id/OSCIDGkJXSIh9mTmOVtr?preview=true" 
                          className="w-[395px] h-full border-0" 
                          title="Live Pet Profile View"
                        />
                      </div>
                   </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS (STEP-BY-STEP) */}
      <section id="how-it-works" className="py-24 bg-white border-t border-zinc-100 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-brandDark tracking-tight mb-4">How KinTag Works</h2>
            <p className="text-zinc-500 font-medium text-lg">Three simple steps to ultimate peace of mind.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-zinc-100 z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-zinc-50 border-4 border-white shadow-xl rounded-full flex items-center justify-center mb-6 hover:scale-105 transition-transform">
                <span className="text-3xl font-extrabold text-brandDark">1</span>
              </div>
              <h3 className="text-xl font-extrabold text-brandDark mb-3">Create a Profile</h3>
              <p className="text-zinc-500 font-medium leading-relaxed px-4">Sign up and build a detailed digital ID card containing emergency contacts, medical info, and behavioral details.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-zinc-50 border-4 border-white shadow-xl rounded-full flex items-center justify-center mb-6 hover:scale-105 transition-transform">
                <span className="text-3xl font-extrabold text-brandDark">2</span>
              </div>
              <h3 className="text-xl font-extrabold text-brandDark mb-3">Generate & Attach</h3>
              <p className="text-zinc-500 font-medium leading-relaxed px-4">Download your custom QR code or link an NFC tag. Attach it to a pet's collar, a kid's backpack, or a medical bracelet.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-zinc-50 border-4 border-white shadow-xl rounded-full flex items-center justify-center mb-6 hover:scale-105 transition-transform">
                <span className="text-3xl font-extrabold text-brandDark">3</span>
              </div>
              <h3 className="text-xl font-extrabold text-brandDark mb-3">Get Scanned</h3>
              <p className="text-zinc-500 font-medium leading-relaxed px-4">If they are lost, a Good Samaritan scans the tag. You instantly get an alert, and they can send you their exact GPS location.</p>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES / WHO IS IT FOR */}
      <section className="py-24 bg-zinc-50 border-t border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-brandDark tracking-tight mb-4">Who is KinTag for?</h2>
            <p className="text-zinc-500 font-medium text-lg">Designed specifically for the most vulnerable members of your family.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 transition-all hover:shadow-md hover:-translate-y-1">
              <User size={32} className="text-blue-500 mb-5" />
              <h3 className="text-xl font-extrabold text-brandDark mb-2">Children</h3>
              <p className="text-zinc-500 font-medium mb-4">Perfect for amusement parks, crowded malls, or field trips. Alert finders to non-verbal behaviors or severe allergies.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 transition-all hover:shadow-md hover:-translate-y-1">
              <PawPrint size={32} className="text-amber-500 mb-5" />
              <h3 className="text-xl font-extrabold text-brandDark mb-2">Pets & Animals</h3>
              <p className="text-zinc-500 font-medium mb-4">Easily share their microchip number, temperament, and diet restrictions instantly if they escape the yard.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 transition-all hover:shadow-md hover:-translate-y-1">
              <Activity size={32} className="text-pink-500 mb-5" />
              <h3 className="text-xl font-extrabold text-brandDark mb-2">Seniors & Medical</h3>
              <p className="text-zinc-500 font-medium mb-4">A critical safety net for elderly family members prone to wandering, detailing their medical conditions and primary caregivers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 UPDATED: 18 FEATURES GRID WITH NEW HIGHLIGHTS */}
      <section className="py-24 bg-white border-y border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-brandDark tracking-tight mb-4">Smarter than a standard ID tag.</h2>
            <p className="text-zinc-500 font-medium text-lg">Every feature is engineered to bring them home safely and quickly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={<Smartphone size={24} className="text-blue-500" />} title="No App Required" desc="Anyone with a smartphone camera can scan the tag. There is absolutely nothing for the finder to download or install." />
            <FeatureCard icon={<MapPin size={24} className="text-emerald-500" />} title="Precision GPS Pinpointing" desc="When scanned, the finder can securely send their exact coordinates directly to your phone with a single tap." />
            <FeatureCard icon={<BellRing size={24} className="text-brandGold" />} title="Instant Push Alerts" desc="The second a tag is scanned, you receive an emergency push notification alerting you that your loved one was found." />
            
            {/* 🌟 NEW FEATURE UPDATES */}
            <FeatureCard icon={<Users size={24} className="text-indigo-500" />} title="Co-Guardian Family Sharing" desc="Invite up to 5 family members. When a tag is scanned, every co-guardian receives an instant push alert simultaneously." />
            <FeatureCard icon={<PowerOff size={24} className="text-red-500" />} title="Instant Kill Switch" desc="Tag lost or stolen? Disable it instantly from your dashboard. Finders will be blocked by a secure 'Profile Disabled' screen." />
            <FeatureCard icon={<Trash2 size={24} className="text-zinc-800" />} title="Complete Data Control" desc="You own your data. Permanently wipe your account, profiles, and scan histories from our servers at any time." />

            <FeatureCard icon={<Wifi size={24} className="text-rose-400" />} title="Passive Location Fallback" desc="Even if the finder denies GPS access, KinTag will passively log their general IP-based city and send an alert." />
            <FeatureCard icon={<Phone size={24} className="text-emerald-600" />} title="One-Tap Emergency Dial" desc="A massive, clear button allows the finder to instantly dial your emergency contact number without copying it." />
            <FeatureCard icon={<AlertTriangle size={24} className="text-amber-500" />} title="Behavioral Alerts" desc="Highlight critical non-verbal behaviors, special needs, or fears so the finder knows exactly how to approach them." />
            <FeatureCard icon={<Database size={24} className="text-zinc-600" />} title="Microchip Linking" desc="Store your pet's official microchip ID number visibly so veterinarians can cross-reference it instantly." />
            <FeatureCard icon={<Activity size={24} className="text-sky-500" />} title="Vaccination Records" desc="Display rabies and core vaccination statuses to reassure finders that your pet is safe to handle." />
            <FeatureCard icon={<RefreshCw size={24} className="text-teal-500" />} title="Dynamic Updates" desc="Moved to a new house? Changed your phone number? Update your profile instantly without ever needing to print a new tag." />
            <FeatureCard icon={<Battery size={24} className="text-orange-500" />} title="Zero Battery Required" desc="Unlike bulky GPS collars that constantly need charging, KinTag never dies. It utilizes the smartphone power of the finder." />
            <FeatureCard icon={<Heart size={24} className="text-pink-500" />} title="Critical Medical Info" desc="Display crucial allergies, blood types, and daily medications instantly to whoever scans the tag." />
            <FeatureCard icon={<Globe size={24} className="text-indigo-400" />} title="Global Compatibility" desc="Traveling abroad? KinTag works universally. As long as the finder has internet, they can access the profile from anywhere." />
            <FeatureCard icon={<Infinity size={24} className="text-rose-500" />} title="Unlimited Scans" desc="There is absolutely no cap on how many times your QR codes or NFC tags can be scanned." />
            <FeatureCard icon={<Zap size={24} className="text-yellow-500" />} title="Instant Setup" desc="Skip the wait times of ordering custom engraved metals. Create an account and secure your child or pet in under 2 minutes." />
            <FeatureCard icon={<Cloud size={24} className="text-sky-400" />} title="Cloud Synced" desc="All your profiles are securely backed up to the cloud. Access and manage your dashboard from any device." />
          </div>
        </div>
      </section>

      {/* THE PASSIONATE DEVELOPER STORY */}
      <section className="py-24 px-4 relative bg-zinc-50 border-b border-zinc-100">
        <div className="max-w-5xl mx-auto bg-brandDark rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brandGold/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full mb-2">
                <Heart size={14} className="text-brandGold" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-white">The KinTag Story</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
                Built by a solo developer.<br/>Driven by pure passion.
              </h2>
              <div className="space-y-4 text-white/80 font-medium leading-relaxed md:text-lg">
                <p>
                  I built KinTag in a single week. When I looked for a way to safeguard my own family, I found an industry plagued by bulky hardware, clunky apps, and predatory monthly subscriptions. 
                </p>
                <p>
                  I realized I couldn't trust massive corporations with my family's deeply personal data. More importantly, I absolutely refused to be trapped in a subscription cycle for something so crucial. <span className="text-brandGold font-bold">Think about it: one forgotten payment, and your child's safety net is instantly turned off.</span> I couldn't live with that anxiety.
                </p>
                <p className="text-white text-xl md:text-2xl font-bold pt-2">
                  That is exactly why KinTag is <span className="text-emerald-400 font-extrabold border-b-2 border-emerald-400 pb-0.5">100% free for lifetime.</span>
                </p>
                <p>
                  I actively use this platform for my own loved ones, because I needed to build the exact tool I wished existed.
                </p>
              </div>
            </div>
            
            <div className="flex-1 w-full bg-black/30 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white/10">
              <h3 className="text-white font-extrabold mb-6 text-xl">The KinTag Promise:</h3>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start text-white/90 font-medium gap-3"><CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5"/> Fully encrypted Google Firebase database</li>
                <li className="flex items-start text-white/90 font-medium gap-3"><CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5"/> Zero hidden paywalls or premium lockouts</li>
                <li className="flex items-start text-white/90 font-medium gap-3"><CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5"/> You have absolute ownership of your data</li>
                <li className="flex items-start text-white/90 font-medium gap-3"><CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5"/> Built specifically for parents, by a parent</li>
              </ul>
              <Link to="/signup" className="w-full flex items-center justify-center bg-white text-brandDark py-3.5 px-6 md:px-8 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-zinc-200 transition-all shadow-lg hover:scale-[1.02]">
                Create Your Free KinTag
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* EXPANDING FAQS WITH GRADIENT BUTTON */}
      <section className="py-24 bg-white border-b border-zinc-100">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-brandDark tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-zinc-500 font-medium text-lg">Everything you need to know about securing your family.</p>
          </div>
          
          <div className="space-y-3">
            {faqData.slice(0, isFaqExpanded ? faqData.length : 6).map((faq, idx) => (
               <FAQItem key={idx} question={faq.q} answer={faq.a} />
            ))}
          </div>

          {!isFaqExpanded && (
            <div className="flex justify-center mt-10">
              <button 
                onClick={() => setIsFaqExpanded(true)} 
                className="flex items-center gap-2 bg-gradient-to-r from-brandDark via-zinc-800 to-brandDark bg-[length:200%_auto] hover:bg-[position:right_center] text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:-translate-y-0.5 transition-all duration-500"
              >
                <span>Read All FAQs</span>
                <ChevronDown size={18} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SELF-HOST GUIDE */}
      <section className="py-24 bg-zinc-50 border-b border-zinc-100">
        <div className="max-w-4xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 relative">
            <h2 className="text-3xl font-extrabold text-brandDark tracking-tight mb-4 flex items-center gap-3">
              <Github size={32} /> Open & Self-Hostable
            </h2>
            <p className="text-zinc-600 font-medium leading-relaxed mb-6">
              Are you a developer? You shouldn't have to rely on third-party servers for your family's safety. KinTag is designed to be completely self-hostable. Grab the code, hook it up to your own Firebase instance, and take 100% ownership of your database.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-sm font-bold text-zinc-700 gap-2"><CheckCircle2 size={18} className="text-emerald-500"/> Full React/Vite Source Code</li>
              <li className="flex items-center text-sm font-bold text-zinc-700 gap-2"><CheckCircle2 size={18} className="text-emerald-500"/> Simple Firebase Integration</li>
              <li className="flex items-center text-sm font-bold text-zinc-700 gap-2"><CheckCircle2 size={18} className="text-emerald-500"/> Free to modify for personal use</li>
            </ul>
            
            <div className="relative inline-block">
              <button 
                onClick={handleGithubClick}
                className="inline-flex items-center justify-center space-x-2 bg-zinc-200 text-zinc-400 px-6 py-3 rounded-xl font-bold cursor-not-allowed transition-all"
              >
                <span>View GitHub Repository</span>
              </button>
              
              {showGithubTooltip && (
                <div className="absolute top-1/2 left-[calc(100%+14px)] -translate-y-1/2 bg-brandDark text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl animate-in fade-in slide-in-from-left-2 duration-200 flex items-center whitespace-nowrap z-10">
                  Coming soon
                  <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[5px] border-r-brandDark"></div>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 w-full bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-800 text-left">
            <div className="flex gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            </div>
            <pre className="text-emerald-400 font-mono text-sm overflow-x-auto">
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
      </section>

      {/* LIVE CONTACT & LIMITATIONS */}
      <section className="py-24 bg-white border-b border-zinc-100">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <Heart size={40} className="text-rose-500 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-extrabold text-brandDark tracking-tight mb-6">Help keep KinTag alive.</h2>
          <p className="text-zinc-600 font-medium text-lg leading-relaxed max-w-3xl mx-auto mb-10">
            I promised KinTag will always be free to use, and I mean it. Currently, the platform relies entirely on the free tiers of backend services like Firebase and Vercel. 
            However, as more parents and pet owners join to safeguard their families, our database storage and server limits will eventually max out. Buying more capacity is incredibly costly for a solo developer. 
            <br/><br/>
            If you believe in this mission and want to help me scale it to protect more families, or if you just want to say hi, my inbox is always open!
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="mailto:shovith2@gmail.com" className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-brandDark border border-zinc-200 px-6 py-3 rounded-xl font-bold transition-all">
              <Mail size={18} className="text-blue-500"/> Email Me
            </a>
            <a href="https://wa.me/918777845713" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-brandDark border border-zinc-200 px-6 py-3 rounded-xl font-bold transition-all">
              <MessageCircle size={18} className="text-emerald-500"/> WhatsApp
            </a>
            <a href="https://t.me/X_o_x_o_002" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-brandDark border border-zinc-200 px-6 py-3 rounded-xl font-bold transition-all">
              <Send size={18} className="text-sky-500"/> Telegram
            </a>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-24 bg-zinc-50 text-center px-4">
        <h2 className="text-3xl md:text-5xl font-extrabold text-brandDark tracking-tight mb-6">Ready to secure your loved ones?</h2>
        <p className="text-zinc-500 font-medium text-lg mb-8">Join the platform and create your first tag in under 2 minutes.</p>
        <Link to="/signup" className="inline-flex items-center justify-center space-x-2 bg-brandGold text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-amber-500 transition-all shadow-xl hover:-translate-y-1">
          <span>Get Started for Free</span>
          <ArrowRight size={20} />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="bg-white py-10 border-t border-zinc-200 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4 opacity-50">
          <img src="/kintag-logo.png" alt="Logo" className="w-5 h-5 rounded grayscale" />
          <span className="font-bold text-brandDark">KinTag</span>
        </div>
        <p className="text-xs text-zinc-400 font-bold">© {new Date().getFullYear()} KinTag. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-200 hover:border-brandDark/20 transition-all hover:bg-white hover:shadow-md">
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-5 border border-zinc-100">
        {icon}
      </div>
      <h3 className="text-xl font-extrabold text-brandDark mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
      >
        <h4 className="text-lg font-extrabold text-brandDark pr-4">{question}</h4>
        <ChevronDown 
          size={20} 
          className={`text-zinc-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      <div 
        className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-zinc-500 font-medium leading-relaxed pt-2 border-t border-zinc-100">{answer}</p>
      </div>
    </div>
  );
}
