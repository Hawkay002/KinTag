import { Link } from 'react-router-dom';
import { ArrowLeft, Rocket, Paintbrush, Lock, MapPin, QrCode, Zap, Plus, RefreshCw, Wrench, Minus, Siren, ShieldCheck, Wallet, HeartHandshake, Fingerprint } from 'lucide-react';

const updates = [
  {
    version: "v1.3.0",
    title: "The Privacy Lock & Wallet Polish Update",
    date: "March 22, 2026",
    icon: <Fingerprint className="text-emerald-500" size={24} />,
    description: "Introducing native biometric security and latest layout designs for Google Wallet passes.",
    changes: [
      { type: "ADDED", text: "App Privacy Lock: Secure your KinTag profile using your device's native Touch ID, or Passcode. Powered by the WebAuthn API for maximum privacy without compromising speed. Added a dedicated toggle in the Settings menu to safely check your device's hardware capabilities and instantly enable or disable the biometric App Privacy Lock." },
      { type: "UPDATED", text: "Google Wallet Layout: Completely rebuilt the Wallet Pass generation to bypass Google's console caching. Passes now dynamically build a perfect new layout & design according to the 'Profile Type' directly from your dashboard." }
    ]
  },
  {
    version: "v1.2.1",
    title: "The Caretaker & UI Polish Update",
    date: "March 21, 2026",
    icon: <HeartHandshake className="text-rose-500" size={24} />,
    description: "Introducing Caretaker Mode for secure babysitter access, a brand-new floating navigation bar, and highly robust data-fetching optimizations.",
    changes: [
      { type: "ADDED", text: "Caretaker Mode: Generate secure, self-destructing access links for babysitters, dog walkers, or temporary caregivers. Set exact expiration timers down to the minute and select exactly which profiles they can see." },
      { type: "ADDED", text: "Dedicated Caregiver Dashboard: Caregivers receive a beautifully formatted, read-only view of medical info, emergency contacts, and an automatically unlocked document vault—no app or login required." },
      { type: "ADDED", text: "Care Session Quick Actions: Active sessions feature live countdown timers, a '+ 1 Hr' extension button, and one-tap link sharing. History sessions include a 1-tap re-book button that auto-fills the caregiver's previous details." },
      { type: "UPDATED", text: "Floating Action Bar (FAB): Completely redesigned the Dashboard navigation with a sleek, bottom-anchored, glassmorphic floating bar that features your custom avatar." },
      { type: "FIXED", text: "Legacy Profile Fetching: Re-engineered the database queries on the Settings page to perfectly catch and display older profiles that predated the Family Sharing architecture or the kill-switch updates." }
    ]
  },
  {
    version: "v1.2.0",
    title: "The Ecosystem & Stability Update",
    date: "March 20, 2026",
    icon: <Wallet className="text-blue-500" size={24} />,
    description: "Expanding KinTag into your digital wallet while implementing system-wide security upgrades and performance optimizations for mobile devices.",
    changes: [
      { type: "ADDED", text: "Google Wallet Integration: KinTag passes can now be officially saved directly to Google Wallet. We have secured publishing access, allowing parents to keep their digital emergency IDs securely alongside their credit cards for instant, offline access." },
      { type: "ADDED", text: "Backend Security Strengthening: Implemented strict, memory-based rate limiting across all API routes to prevent bot spam. Added robust frontend input sanitization and reCAPTCHA Enterprise verification to ensure 100% human authentication." },
      { type: "FIXED", text: "Hardware Acceleration Crashing: Heavily optimized the 3D rendering and CSS animations on the Home page to reduce memory footprint. This resolves a critical issue where low-end mobile browsers (specifically devices with 4GB RAM or less) would crash or show a blank screen during heavy scrolling." },
      { type: "UPDATED", text: "Low-End Device Note: While we have made the site as lightweight as technologically possible, users on older hardware or unoptimized Chrome builds might still experience occasional screen flickering during rapid scrolling. This is a hardware/browser limitation and does not affect the core functionality or safety of your profiles because this issue is limited to home page only. We appreciate your understanding!" }
    ]
  },
  {
    version: "v1.1.1",
    title: "The Security & Vault Update",
    date: "March 7, 2026",
    icon: <ShieldCheck className="text-indigo-500" size={24} />,
    description: "Introducing the Secure Document Vault, dynamic PDF rendering, and strict anti-download protections for maximum data privacy and cross-platform reliability.",
    changes: [
      { type: "ADDED", text: "Secure Document Vault: Added a dedicated upload section in the Create and Edit Profile dashboards for medical or government documents. On the Public Card, these files remain visually locked and heavily blurred until a finder actively shares their GPS location or calls an emergency contact to verify they are helping." },
      { type: "ADDED", text: "PDF-to-Image Engine: Re-engineered document rendering on the Public Card. PDFs are now dynamically rasterized into secure, high-quality JPGs using Cloudinary's format conversion API. This guarantees perfect cross-platform viewing without triggering forced file downloads on mobile browsers." },
      { type: "ADDED", text: "Anti-Download Protections: Secured all public-facing media on the Public Card. Applied strict CSS and React UI blocks to the hero profile picture, full-screen image modals, and Vault documents to permanently prevent right-clicking, image dragging, and iOS long-press saving by strangers." }
    ]
  },
  {
    version: "v1.1.0",
    title: "The Search & Rescue Update",
    date: "March 4, 2026",
    icon: <Siren className="text-red-500" size={24} />,
    description: "Transforming KinTag from a passive digital ID into an active, community-driven search and rescue network.",
    changes: [
      { type: "ADDED", text: "Lost Mode (Panic Button): Instantly transform a profile into a high-alert distress signal with a pulsing call button and flashing missing marquee." },
      { type: "ADDED", text: "KinAlert Community Broadcast: Send instant push notifications and dashboard popups to all KinTag users in the same Zip Code when a tag is marked lost." },
      { type: "ADDED", text: "Safe & Sound Notification: Marking a profile as found instantly clears local dashboard alerts and notifies neighbors with a green success popup." },
      { type: "ADDED", text: "Zip Code Geofencing: Profile page now enforces Zip Code setup with visual red-dot indicators to accurately route community KinAlerts." }
    ]
  },
  {
    version: "v1.0.0",
    title: "The Family Ecosystem Update",
    date: "March 4, 2026",
    icon: <Rocket className="text-brandGold" size={24} />,
    description: "The largest architectural update to date, transforming KinTag from an individual tool into a collaborative, highly secure family platform.",
    changes: [
      { type: "ADDED", text: "Co-Guardian Family Sharing Architecture: Completely rebuilt the database structure from userId to familyId. Parents can now securely invite up to 5 co-guardians." },
      { type: "ADDED", text: "Native OS Sharing: Inviting a co-guardian now triggers the native device Share Sheet (WhatsApp, iMessage, Telegram) using the Web Share API." },
      { type: "ADDED", text: "Live Invite System: Invited users receive an instant 'Accept/Decline' notification in their Dashboard. Accepting instantly merges their account." },
      { type: "ADDED", text: "Guardian Management: Primary owners can now securely remove co-guardians with a single click, instantly revoking their access to family profiles." },
      { type: "ADDED", text: "The 'Kill Switch': Added a live toggle on the Dashboard to instantly Enable/Disable a profile. Scanning a disabled tag now shows a secure 'Profile Disabled' blocker screen." },
      { type: "ADDED", text: "Danger Zone (Account Deletion): Users can now permanently wipe their entire account, profiles, images, and scan history from the database by typing an exact confirmation phrase." },
      { type: "ADDED", text: "Dedicated Profile Page: Created a new /profile route for users to manage their names, view their email, handle invites, and log out securely." },
      { type: "FIXED", text: "Firestore Security Rules: Upgraded database rules to securely allow cross-account edits only if users share the exact same familyId." }
    ]
  },
  {
    version: "v0.9.0",
    title: "The Landing Page & Live Preview Update",
    date: "March 3, 2026",
    icon: <Paintbrush className="text-sky-500" size={24} />,
    description: "A complete overhaul of the unauthenticated user experience, introducing flawless UI/UX and live interactive elements.",
    changes: [
      { type: "ADDED", text: "Live Iframe Previews: Replaced static image mockups on the Home page with actual live iframe renders of a Kid and Pet profile." },
      { type: "ADDED", text: "Preview Mode Security: Appended ?preview=true to iframe URLs to strictly disable passive IP logging, GPS sharing, and phone dialing to prevent spam." },
      { type: "UPDATED", text: "3D Mockup Layout: Upgraded the mobile mockups to a responsive side-by-side layout on desktop, and a vertical stack on mobile." },
      { type: "FIXED", text: "Iframe Cut-off Bug: Implemented pure CSS WebKit scrollbar hiding to ensure the live preview perfectly fits the device bezels without clipping." }
    ]
  },
  {
    version: "v0.8.0",
    title: "Authentication Routing & Admin Engine",
    date: "March 2, 2026",
    icon: <Lock className="text-emerald-500" size={24} />,
    description: "Bulletproofing the login flow and adding global communication tools.",
    changes: [
      { type: "ADDED", text: "Admin Control Center: Created a secure /admin route strictly locked to the developer's environment variable email." },
      { type: "ADDED", text: "Markdown Broadcasts: The Admin panel can now fire global push notifications and render Markdown-styled text directly into every user's System Updates tab." },
      { type: "UPDATED", text: "Auth Page Split: Completely decoupled the monolithic Auth component into dedicated Login and Signup pages for cleaner routing." },
      { type: "FIXED", text: "React Router Navigation Bug: Fixed an issue where HashRouter was dropping state and ignoring 'Get Started' clicks from the Home page." },
      { type: "FIXED", text: "Refresh Loop Bug: Rebuilt the 'Reload Protection' logic inside App.jsx to prevent valid button clicks from being treated as page reloads." }
    ]
  },
  {
    version: "v0.5.0",
    title: "The Advanced Tracking & Notifications Update",
    date: "March 1, 2026",
    icon: <MapPin className="text-rose-500" size={24} />,
    description: "Bringing the core safety features to life with real-time location mapping and push alerts.",
    changes: [
      { type: "ADDED", text: "Active GPS Pinpointing: Finders are presented with a 'Share My Location' button that requests high-accuracy HTML5 Geolocation coordinates." },
      { type: "ADDED", text: "Passive IP Tracking: If a finder ignores or denies GPS, the PublicCard silently performs a passive IP-based lookup to grab the general City/Region." },
      { type: "ADDED", text: "Notification Center: Built a slide-out dashboard drawer divided into 'Personal Scans' and 'System Updates' with unread badge counters." },
      { type: "ADDED", text: "Firebase Cloud Messaging (FCM): Implemented native browser Push Notifications to instantly alert parents the millisecond a tag is scanned." },
      { type: "ADDED", text: "Dynamic Island UI: Designed an iOS-style 'Dynamic Island' alert at the top of the Public Card that expands into the emergency interaction zone." }
    ]
  },
  {
    version: "v0.2.0",
    title: "The Design & QR Engine Update",
    date: "February 27, 2026",
    icon: <QrCode className="text-violet-500" size={24} />,
    description: "Polishing the visual aesthetic and finalizing the ID generation capabilities.",
    changes: [
      { type: "ADDED", text: "QR Code Canvas Generator: Integrated qrcode.react to dynamically generate high-resolution QR codes with the KinTag logo excavated in the center." },
      { type: "ADDED", text: "Mobile ID Download: Built a complex HTML5 Canvas engine that stitches the profile photo, details, and QR code into a beautiful, downloadable Mobile ID card." },
      { type: "ADDED", text: "Theme Selector: Added 6 visual QR themes (Obsidian, Bubblegum, Ocean, Minty, Lavender, Sunshine)." },
      { type: "ADDED", text: "Image Cloud Hosting: Integrated Cloudinary API for lightning-fast profile image uploads." },
      { type: "UPDATED", text: "Age Computation: Built a dynamic age calculator that converts DOB into formatted 'Yrs' or 'Mos' automatically." }
    ]
  },
  {
    version: "v0.1.0",
    title: "Project Inception & Core Architecture",
    date: "February 26, 2026",
    icon: <Zap className="text-amber-500" size={24} />,
    description: "The foundational release of the KinTag platform. This version established the core infrastructure, bringing the vision of a digital safety net to life with robust authentication, real-time database syncing, and dynamic profile rendering.",
    changes: [
      { type: "ADDED", text: "React & Tailwind Foundation: Initialized the single-page application using Vite, React, Tailwind CSS, and Lucide Icons." },
      { type: "ADDED", text: "Firebase Integration: Set up Firebase Authentication (Email/Password & Google OAuth) and Firestore Database." },
      { type: "ADDED", text: "Create & Edit Forms: Built the massive input forms supporting dynamic switching between Kid and Pet fields." },
      { type: "ADDED", text: "Emergency Contacts Logic: Created a dynamic array system allowing parents to add multiple emergency contacts with country codes and custom tags." },
      { type: "ADDED", text: "Public Card Route: Established the /id/:profileId routing architecture to allow unauthenticated finders to view the digital ID." }
    ]
  }
];

const getTagStyle = (type) => {
  switch (type) {
    case 'ADDED': return 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm';
    case 'UPDATED': return 'bg-sky-50 text-sky-700 border-sky-200 shadow-sm';
    case 'FIXED': return 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm';
    case 'REMOVED': return 'bg-red-50 text-red-700 border-red-200 shadow-sm';
    default: return 'bg-zinc-50 text-zinc-700 border-zinc-200 shadow-sm';
  }
};

const getTagIcon = (type) => {
  switch (type) {
    case 'ADDED': return <Plus size={12} />;
    case 'UPDATED': return <RefreshCw size={10} />;
    case 'FIXED': return <Wrench size={10} />;
    case 'REMOVED': return <Minus size={12} />;
    default: return null;
  }
};

export default function Changelog() {
  return (
    <div className="min-h-[100dvh] bg-[#fafafa] font-sans selection:bg-brandGold selection:text-white pb-24 relative overflow-hidden">
      
      {/* 🌟 NEW: Premium Background Elements */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-brandGold/10 via-emerald-400/5 to-transparent rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* 🌟 FLOATING NAVBAR */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 pointer-events-none">
        <nav className="pointer-events-auto w-full max-w-4xl bg-white/80 backdrop-blur-xl border border-zinc-200/80 rounded-[2rem] px-5 py-3 md:py-4 md:px-8 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-500">
          <Link to="/" className="group flex items-center space-x-2 text-zinc-600 hover:text-brandDark font-bold transition-colors active:scale-95">
            <ArrowLeft size={18} className="transform group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-8 h-8 rounded-xl shadow-sm transform hover:scale-110 transition-transform duration-500" />
            <span className="text-xl font-extrabold text-brandDark tracking-tight">KinTag</span>
          </div>
        </nav>
      </div>

      {/* HEADER */}
      <header className="max-w-4xl mx-auto px-4 md:px-8 pt-40 pb-16 text-center relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl md:text-6xl font-extrabold text-brandDark tracking-tight mb-4">Official Changelog</h1>
        <p className="text-lg md:text-xl text-zinc-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Tracking the evolution of the ultimate digital safety net.
        </p>
      </header>

      {/* TIMELINE */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 relative z-10 animate-in fade-in duration-1000 delay-300">
        
        <div className="relative border-l-2 border-zinc-200/80 ml-4 md:ml-8 space-y-16 py-2">
          
          {updates.map((update, index) => (
            
            <div key={update.version} className="relative group pl-12 md:pl-16">
              
              {/* TIMELINE DOT & ICON */}
              <div className="absolute -left-[25px] top-0 w-12 h-12 bg-[#fafafa] rounded-full flex items-center justify-center border-[4px] border-[#fafafa] transition-transform duration-500 group-hover:scale-110 z-10">
                <div className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm border border-zinc-200/80">
                  {update.icon}
                </div>
              </div>

              {/* VERSION HEADER */}
              <div className="mb-6">
                <div className="flex flex-wrap items-baseline gap-3 mb-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-brandDark tracking-tight">{update.title}</h2>
                  <span className="text-sm font-bold bg-brandDark text-white px-3 py-1 rounded-full shadow-sm">{update.version}</span>
                </div>
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">{update.date}</p>
                <p className="text-zinc-600 font-medium mt-3 leading-relaxed max-w-2xl text-sm md:text-base">
                  {update.description}
                </p>
              </div>

              {/* CHANGES LIST (Glassmorphic Card) */}
              <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-zinc-200/80 transition-all duration-500 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] hover:border-brandDark/20">
                <ul className="space-y-4">
                  {update.changes.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className={`shrink-0 flex items-center justify-center gap-1 w-24 text-[10px] font-extrabold uppercase tracking-widest px-2 py-1.5 rounded-lg border ${getTagStyle(change.type)} mt-0.5`}>
                        {getTagIcon(change.type)}
                        {change.type}
                      </span>
                      <span className="text-zinc-700 font-medium text-sm md:text-base leading-relaxed">
                        <strong className="text-brandDark">{change.text.split(':')[0]}:</strong>
                        {change.text.split(':').slice(1).join(':')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ))}

        </div>
      </div>
      
    </div>
  );
}
