import { Link } from 'react-router-dom';
import { ArrowLeft, Rocket, Paintbrush, Lock, MapPin, QrCode, Zap, Plus, RefreshCw, Wrench, Minus } from 'lucide-react';

const updates = [
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
      { type: "UPDATED", text: "Landing Page Features: Expanded the marketing feature grid from 9 to 18 massive features." },
      { type: "UPDATED", text: "Developer Story: Rewrote the 'Solo Developer' section to highlight the '100% Free Lifetime' guarantee." },
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
      { type: "FIXED", text: "Iframe Cut-off Bug: Implemented pure CSS WebKit scrollbar hiding to ensure the live preview perfectly fits the device bezels without clipping." },
      { type: "REMOVED", text: "Testimonials: Removed the dummy testimonials section to focus purely on the developer's story, open-source nature, and core features." }
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
    case 'ADDED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'UPDATED': return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'FIXED': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'REMOVED': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
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
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-brandGold selection:text-white pb-24">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200/50">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-zinc-500 hover:text-brandDark font-bold transition-colors">
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2.5">
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-8 h-8 rounded-lg shadow-sm" />
            <span className="text-xl font-extrabold text-brandDark tracking-tight">KinTag</span>
          </div>
        </div>
      </nav>

      {/* HEADER */}
      <header className="max-w-4xl mx-auto px-4 md:px-8 pt-16 pb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-brandDark tracking-tight mb-4">Official Changelog</h1>
        <p className="text-lg md:text-xl text-zinc-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Tracking the evolution of the ultimate digital safety net. Built by a solo developer, driven by pure passion.
        </p>
      </header>

      {/* TIMELINE */}
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <div className="relative border-l-2 border-zinc-200/80 pl-6 md:pl-10 space-y-16 ml-4 md:ml-0">
          
          {updates.map((update, index) => (
            <div key={update.version} className="relative group">
              
              {/* TIMELINE DOT & ICON */}
              <div className="absolute -left-[41px] md:-left-[61px] top-0 w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-inner border border-zinc-100">
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

              {/* CHANGES LIST */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-zinc-200 transition-all hover:shadow-md">
                <ul className="space-y-4">
                  {update.changes.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className={`shrink-0 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded border ${getTagStyle(change.type)} mt-0.5`}>
                        {getTagIcon(change.type)}
                        {change.type}
                      </span>
                      <span className="text-zinc-700 font-medium text-sm md:text-base leading-relaxed">
                        {/* Highlights the text before the colon to make it pop */}
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
