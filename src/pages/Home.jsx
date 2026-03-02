import { useState } from 'react';
import { Link } from 'react-router-dom'; 
import { 
  Shield, MapPin, BellRing, Heart, QrCode, Smartphone, Github, ArrowRight, 
  CheckCircle2, PawPrint, User, Activity, Info, RefreshCw, Battery, Cloud, 
  ChevronDown, Star, Lock
} from 'lucide-react';

export default function Home() {
  const [showGithubTooltip, setShowGithubTooltip] = useState(false);

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

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500"/> 100% Free Forever</span>
            <span className="flex items-center gap-1.5"><Lock size={14} className="text-brandGold"/> Secure & Encrypted</span>
            <span className="flex items-center gap-1.5"><Shield size={14} className="text-blue-500"/> No App Required</span>
          </div>

          {/* Responsive, Stacked & Scaled Phone Mockups */}
          <div className="relative mx-auto mt-16 md:mt-24 flex flex-col md:block items-center gap-16 md:gap-0 perspective-[1200px] md:h-[750px] w-full max-w-4xl pb-10 md:pb-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-gradient-to-tr from-brandGold/20 via-emerald-400/20 to-blue-500/10 blur-3xl -z-10 rounded-full animate-pulse"></div>

            {/* 🌟 NEW: Live Preview Notice Badge */}
            <div className="md:absolute md:-top-14 md:left-1/2 md:-translate-x-1/2 z-40 flex items-center gap-2.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 text-white px-5 py-2.5 rounded-full shadow-2xl -mb-6 md:mb-0">
              <Info size={16} className="text-brandGold shrink-0" />
              <span className="text-xs md:text-sm font-bold tracking-wide">
                Live Preview: Action buttons disabled to prevent spam.
              </span>
            </div>

            {/* iPhone Mockup (Live Kid Profile) */}
            <div className="relative md:absolute md:left-[40%] md:top-0 md:-translate-x-1/2 w-[280px] md:w-[320px] aspect-[9/19.5] rounded-[2.5rem] md:rounded-[3.5rem] border-[6px] md:border-[12px] border-zinc-900 bg-zinc-900 shadow-2xl overflow-hidden transform md:rotate-y-[-12deg] md:rotate-x-[5deg] z-20 md:hover:rotate-y-[-5deg] hover:scale-[1.02] transition-all duration-700 ease-out group shrink-0">
              <div className="relative w-full h-full bg-zinc-100 overflow-hidden rounded-[2rem] md:rounded-[2.5rem]">
                 <iframe 
                   src="https://kintag.vercel.app/#/id/kJeMwTQgTnuARri1gwc3?preview=true" 
                   className="absolute top-0 left-0 w-[375px] h-[813px] origin-top-left scale-[0.747] md:scale-[0.854] border-0 z-10" 
                   title="Live Kid Profile View"
                 />
              </div>
            </div>

            {/* Google Pixel Mockup (Live Pet Profile) */}
            <div className="relative md:absolute md:left-[60%] md:top-[6%] md:-translate-x-1/2 w-[280px] md:w-[310px] aspect-[9/20] rounded-[2rem] md:rounded-[3rem] border-[6px] md:border-[10px] border-zinc-800 bg-zinc-800 shadow-2xl overflow-hidden transform md:rotate-y-[12deg] md:rotate-x-[5deg] z-10 md:hover:rotate-y-[5deg] hover:scale-[1.02] md:hover:z-30 transition-all duration-700 ease-out group shrink-0">
              <div className="relative w-full h-full bg-zinc-100 overflow-hidden rounded-[1.5rem] md:rounded-[2.2rem]">
                 <iframe 
                   src="https://kintag.vercel.app/#/id/OSCIDGkJXSIh9mTmOVtr?preview=true" 
                   className="absolute top-0 left-0 w-[375px] h-[834px] origin-top-left scale-[0.747] md:scale-[0.827] border-0 z-10" 
                   title="Live Pet Profile View"
                 />
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
              <PawPrint size={32} className="text-amber-500 mb-5" />
              <h3 className="text-xl font-extrabold text-brandDark mb-2">Pets & Animals</h3>
              <p className="text-zinc-500 font-medium mb-4">Easily share their microchip number, temperament, and diet restrictions instantly if they escape the yard.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 transition-all hover:shadow-md hover:-translate-y-1">
              <User size={32} className="text-blue-500 mb-5" />
              <h3 className="text-xl font-extrabold text-brandDark mb-2">Children</h3>
              <p className="text-zinc-500 font-medium mb-4">Perfect for amusement parks, crowded malls, or field trips. Alert finders to non-verbal behaviors or severe allergies.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 transition-all hover:shadow-md hover:-translate-y-1">
              <Activity size={32} className="text-pink-500 mb-5" />
              <h3 className="text-xl font-extrabold text-brandDark mb-2">Seniors & Medical</h3>
              <p className="text-zinc-500 font-medium mb-4">A critical safety net for elderly family members prone to wandering, detailing their medical conditions and primary caregivers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-24 bg-white border-y border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-brandDark tracking-tight mb-4">Smarter than a standard ID tag.</h2>
            <p className="text-zinc-500 font-medium text-lg">Every feature is designed to bring them home safely and quickly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={<Smartphone size={24} className="text-blue-500" />} title="No App Required" desc="Anyone with a smartphone camera can scan the tag. There is absolutely nothing for the finder to download or install." />
            <FeatureCard icon={<MapPin size={24} className="text-emerald-500" />} title="Precision GPS Pinpointing" desc="When scanned, the finder can securely send their exact coordinates directly to your phone with a single tap." />
            <FeatureCard icon={<BellRing size={24} className="text-brandGold" />} title="Instant Push Alerts" desc="The second a tag is scanned, you receive an emergency push notification alerting you that your loved one was found." />
            <FeatureCard icon={<RefreshCw size={24} className="text-teal-500" />} title="Dynamic Updates" desc="Moved to a new house? Changed your phone number? Update your profile instantly without ever needing to print a new tag." />
            <FeatureCard icon={<Battery size={24} className="text-orange-500" />} title="Zero Battery Required" desc="Unlike bulky GPS collars that constantly need charging, KinTag never dies. It utilizes the smartphone power of the finder." />
            <FeatureCard icon={<Heart size={24} className="text-pink-500" />} title="Critical Medical Info" desc="Display crucial allergies, behavioral needs, temperament, and microchip IDs instantly to whoever finds them." />
            <FeatureCard icon={<QrCode size={24} className="text-purple-500" />} title="Custom Mobile IDs" desc="Generate beautiful, printable QR codes or program your own blank NFC tags using your KinTag dashboard." />
            <FeatureCard icon={<Cloud size={24} className="text-sky-500" />} title="Cloud Synced" desc="All your profiles are securely backed up to the cloud. Access and manage your dashboard from any device." />
            <FeatureCard icon={<Shield size={24} className="text-zinc-700" />} title="Privacy First" desc="You control the data. Disable a tag anytime, and rest easy knowing your location alerts are encrypted and secure." />
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF / TESTIMONIALS */}
      <section className="py-24 bg-zinc-50 border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-brandDark tracking-tight mb-4">Trusted by Parents & Pet Owners</h2>
            <p className="text-zinc-500 font-medium text-lg">See why families are switching to KinTag for their peace of mind.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard 
              quote="My husky escaped the yard while I was at work. Within 10 minutes, I got a push notification and a GPS pin from the neighbor who found him. Absolute lifesaver."
              author="Sarah M."
              role="Dog Owner"
            />
            <TestimonialCard 
              quote="We took our 5-year-old to Disney World and pinned a KinTag inside his backpack. Just knowing it was there, with his allergy info attached, took so much anxiety away."
              author="David L."
              role="Parent of 2"
            />
            <TestimonialCard 
              quote="I love that I don't have to buy a new engraved metal tag every time we travel or change numbers. I just update the dashboard and the tag updates instantly."
              author="Elena R."
              role="Frequent Traveler"
            />
          </div>
        </div>
      </section>

      {/* ACCORDION FAQ SECTION */}
      <section className="py-24 bg-white border-b border-zinc-100">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-brandDark tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-zinc-500 font-medium text-lg">Everything you need to know about securing your family.</p>
          </div>
          
          <div className="space-y-3">
            <FAQItem question="Is there a monthly subscription fee?" answer="No! The core KinTag platform is entirely free to use. We don't believe in holding your family's safety hostage behind a monthly paywall. You only pay for your own blank NFC tags or printing if you choose to." />
            <FAQItem question="Does the finder need to download an app?" answer="No. That is the magic of KinTag. In a panic, you don't want a finder struggling to download an app. They simply point their standard phone camera at the QR code, and it opens a secure, native webpage instantly." />
            <FAQItem question="Do I have to buy special tags directly from you?" answer="Not at all. You can generate and download high-resolution QR codes directly from your dashboard to print on standard paper/stickers, or you can buy cheap, blank NFC tags from Amazon and program them yourself." />
            <FAQItem question="What happens if the finder denies GPS access?" answer="KinTag uses a dual-layer alert system. Even if the finder taps 'No' to sharing their exact GPS coordinates, our system performs a 'Passive Scan' which grabs their general IP-based city/region and sends you an instant push notification anyway." />
            <FAQItem question="What if I move or change my phone number?" answer="Because KinTag is a cloud-based digital ID, any changes you make in your dashboard are instantly updated on the live tag. You never have to engrave, print, or buy a new physical tag just because you moved!" />
            <FAQItem question="Does the tag have a battery I need to charge?" answer="No. Unlike bulky, heavy GPS collars that constantly die and require charging, KinTag relies on the battery and cellular data of the Good Samaritan's smartphone. Your tag will never run out of power." />
            <FAQItem question="Can I create profiles for multiple pets or kids?" answer="Yes! Your single KinTag dashboard can hold multiple profiles. You can create unique cards and QR codes for every child, dog, or cat in your household." />
            <FAQItem question="What is an NFC tag and how do I use it?" answer="NFC (Near Field Communication) is the same technology used for Apple Pay. You can buy blank NFC stickers online, and use free apps to program your unique KinTag URL onto them. Anyone who taps their phone to the sticker will instantly open your profile." />
            <FAQItem question="Is my medical and contact data kept private?" answer="Your data is only accessible to someone who physically scans your unique, randomly generated tag. It is not listed in a public directory or searchable on Google. You can also delete a profile at any time to instantly destroy the link." />
            <FAQItem question="Can I temporarily disable a tag?" answer="Currently, the safest way to disable a tag is to edit the profile and remove sensitive information, or delete the profile entirely. We are working on a 'Pause' feature for a future update!" />
          </div>
        </div>
      </section>

      {/* SOLO DEV STORY */}
      <section className="py-24 px-4 relative bg-zinc-50">
        <div className="max-w-4xl mx-auto bg-brandDark rounded-[3rem] p-8 md:p-16 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brandGold/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <Heart size={40} className="text-brandGold mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
              Created by a solo developer.<br/> Driven by a single mission.
            </h2>
            <p className="text-lg text-white/80 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
              When I looked for a way to secure my own family, I found an industry plagued by bulky hardware, clunky apps, and predatory monthly subscriptions. Safety shouldn't be locked behind a paywall.
              <br/><br/>
              KinTag is my answer. A labor of love crafted with an obsessive focus on speed, privacy, and reliability. No corporate bloat. No hidden fees. Just a lightning-fast, beautiful digital safety net for the ones you cherish most.
            </p>
            <Link to="/signup" className="inline-flex items-center justify-center bg-white text-brandDark px-8 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-all shadow-lg hover:scale-105">
              Create Your Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* SELF-HOST GUIDE */}
      <section className="py-24 bg-white border-t border-zinc-100">
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
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-brandDark text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 flex items-center gap-1.5 whitespace-nowrap z-10">
                  <Info size={14} className="text-brandGold"/>
                  Source code coming soon!
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-brandDark"></div>
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

function TestimonialCard({ quote, author, role }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm flex flex-col h-full">
      <div className="flex text-brandGold mb-4">
        <Star size={16} fill="currentColor" />
        <Star size={16} fill="currentColor" />
        <Star size={16} fill="currentColor" />
        <Star size={16} fill="currentColor" />
        <Star size={16} fill="currentColor" />
      </div>
      <p className="text-zinc-600 font-medium leading-relaxed mb-6 flex-1 italic">"{quote}"</p>
      <div>
        <h4 className="font-extrabold text-brandDark">{author}</h4>
        <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">{role}</p>
      </div>
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
