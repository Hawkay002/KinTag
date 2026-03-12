import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom'; 
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { Turnstile } from '@marsidev/react-turnstile';
import { Phone, MapPin, AlertTriangle, Droplet, Ruler, Users, Scale, User, PawPrint, Maximize2, X, Activity, Heart, BellRing, Loader2, CheckCircle2, Cake, ShieldAlert, Siren, FileText, Lock, Unlock, ArrowRight } from 'lucide-react';
import { motion, useAnimation, useMotionValue, AnimatePresence } from 'framer-motion';

const getComputedAge = (profile) => {
  if (profile.dob) {
    const dob = new Date(profile.dob);
    const today = new Date();
    let months = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
    if (today.getDate() < dob.getDate()) months--;
    if (months < 0) months = 0;
    
    if (months < 12) {
      return { value: months === 0 ? 1 : months, label: 'Mos' };
    } else {
      return { value: Math.floor(months / 12), label: 'Yrs' };
    }
  }
  return { 
    value: profile.age || 'Unknown', 
    label: profile.ageUnit === 'Months' ? 'Mos' : 'Yrs' 
  };
};

// 🌟 NEW: Interactive Framer Motion Slider Component
const SlideToShare = ({ onSlide, isLoading, isPreview }) => {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const x = useMotionValue(0);
  const controls = useAnimation();

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.offsetWidth);
    }
    // Update width on resize to ensure constraints remain accurate
    const handleResize = () => {
      if (containerRef.current) setWidth(containerRef.current.offsetWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragEnd = async (e, info) => {
    const threshold = width * 0.65; // 65% of container width to trigger
    if (info.offset.x >= threshold) {
      await controls.start({ x: width - 64 }); // Animate thumb to the very end
      onSlide(e);
    } else {
      controls.start({ x: 0 }); // Snap back to start
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-16 bg-white/10 rounded-full border border-white/20 flex items-center justify-center shadow-inner">
        <Loader2 className="animate-spin text-white" size={24} />
        <span className="ml-3 text-white font-bold tracking-widest uppercase text-xs">Locating...</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-16 bg-white/10 rounded-full overflow-hidden border border-white/20 shadow-inner group">
      {/* Track Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-white/50 font-extrabold uppercase tracking-widest text-[11px] sm:text-xs transition-opacity group-hover:text-white/70">
          {isPreview ? "Disabled in Preview" : "Slide to Share Location"}
        </span>
      </div>
      
      {/* Draggable Thumb */}
      <motion.div
        className="absolute top-1 left-1 bottom-1 w-14 bg-red-600 rounded-full shadow-lg flex items-center justify-center z-10"
        drag={isPreview ? false : "x"}
        dragConstraints={{ left: 0, right: width > 0 ? width - 64 : 0 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x, cursor: isPreview ? 'not-allowed' : 'grab' }}
        whileTap={{ scale: isPreview ? 1 : 0.95, cursor: isPreview ? 'not-allowed' : 'grabbing' }}
      >
        <div className="flex items-center justify-center w-full h-full text-white">
          <ArrowRight size={24} />
        </div>
      </motion.div>
    </div>
  );
};

export default function PublicCard() {
  const { profileId } = useParams();
  const location = useLocation(); 
  
  const isPreview = new URLSearchParams(location.search).get('preview') === 'true';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  
  const [isVerified, setIsVerified] = useState(isPreview);
  
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [isLogoExpanded, setIsLogoExpanded] = useState(true);
  const logoTimeoutRef = useRef(null);

  const passiveAlertSent = useRef(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [activeAlertSent, setActiveAlertSent] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const vaultTimerRef = useRef(null);

  // Global audio chime function
  const playChime = () => {
    try {
      const audio = new Audio('/chime.mp3');
      audio.play().catch(() => {});
    } catch (err) {}
  };

  const startLogoTimer = () => {
    if (logoTimeoutRef.current) clearTimeout(logoTimeoutRef.current);
    logoTimeoutRef.current = setTimeout(() => {
      setIsLogoExpanded(false);
    }, 3000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "profiles", profileId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching public profile:", error);
      } finally {
        setLoading(false);
        startLogoTimer();
      }
    };
    fetchProfile();

    return () => {
      if (logoTimeoutRef.current) clearTimeout(logoTimeoutRef.current);
      if (vaultTimerRef.current) clearTimeout(vaultTimerRef.current);
    };
  }, [profileId]);

  useEffect(() => {
    const sendPassiveAlert = async () => {
      if (!isVerified || !profile || profile.isActive === false || passiveAlertSent.current || isPreview) return; 
      passiveAlertSent.current = true; 
      
      try {
        const res = await fetch('https://ipapi.co/json/');
        const ipData = await res.json();
        const cityStr = ipData.city ? `${ipData.city}, ${ipData.region}` : 'an unknown location';
        
        await addDoc(collection(db, "scans"), {
          profileId: profileId,
          ownerId: profile.userId,
          familyId: profile.familyId || profile.userId,
          profileName: profile.name,
          type: 'passive',
          city: ipData.city || 'Unknown City',
          region: ipData.region || 'Unknown Region',
          country: ipData.country_name || '',
          timestamp: new Date().toISOString()
        });

        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerId: profile.userId,
            familyId: profile.familyId || profile.userId,
            title: `👀 ${profile.name}'s Tag Scanned!`,
            body: `Someone just viewed ${profile.name}'s digital ID near ${cityStr}.`,
            link: `https://kintag.vercel.app/#/?view=notifications` 
          })
        });
      } catch (error) {
        console.error("Passive alert failed silently:", error);
      }
    };

    let timer;
    if (isVerified && profile && profile.isActive !== false && !passiveAlertSent.current && !isPreview) {
      timer = setTimeout(() => {
        sendPassiveAlert();
      }, 1500);
    }

    return () => clearTimeout(timer);
  }, [profile, profileId, isPreview, isVerified]);

  const unlockVault = () => {
    if (isPreview) return;
    setIsVaultUnlocked(true);
    if (vaultTimerRef.current) clearTimeout(vaultTimerRef.current);
    vaultTimerRef.current = setTimeout(() => {
      setIsVaultUnlocked(false);
    }, 15 * 60 * 1000); 
  };

  const handleActiveAlert = (e) => {
    if (e && e.stopPropagation) e.stopPropagation(); 
    if (isPreview || profile?.isActive === false) return;

    // Trigger Chime and Haptic Feedback instantly on press!
    playChime();
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]); 
    }

    setIsSendingAlert(true);
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsError("Location services aren't supported by this browser.");
      setIsSendingAlert(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
          
          await addDoc(collection(db, "scans"), {
            profileId: profileId,
            ownerId: profile.userId,
            familyId: profile.familyId || profile.userId,
            profileName: profile.name,
            type: 'active',
            latitude: latitude,
            longitude: longitude,
            googleMapsLink: mapsLink,
            timestamp: new Date().toISOString()
          });

          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ownerId: profile.userId,
              familyId: profile.familyId || profile.userId,
              title: `📍 URGENT: ${profile.name} FOUND!`,
              body: `A Good Samaritan has shared their exact GPS location. TAP HERE to open details!`,
              link: `https://kintag.vercel.app/#/?view=notifications` 
            })
          });

          setActiveAlertSent(true);
          unlockVault(); 
        } catch (error) {
          setGpsError("Failed to send alert.");
        } finally {
          setIsSendingAlert(false);
        }
      },
      (error) => {
        setGpsError("Please allow location access so the owner can find you.");
        setIsSendingAlert(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleLogoClick = (e) => {
    e.stopPropagation();
    if (isPreview) return; 
    setIsLogoExpanded(true);
    startLogoTimer();
  };

  if (!isVerified) {
    return (
      <div className="min-h-[100dvh] bg-[#fafafa] flex flex-col items-center justify-center p-4 selection:bg-brandGold selection:text-white">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 border border-zinc-100">
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-12 h-12 rounded-xl animate-pulse" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brandDark tracking-tight mb-2">Securing Connection...</h1>
          <p className="text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">
            Checking your browser before securely accessing this digital ID.
          </p>
        </div>
        <div className="animate-in fade-in zoom-in-95 duration-500 delay-300 min-h-[65px]">
          <Turnstile 
            siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY || '1x00000000000000000000AA'} 
            onSuccess={() => setIsVerified(true)}
          />
        </div>
      </div>
    );
  }

  if (loading) return <PublicCardSkeleton />;
  if (!profile) return <div className="min-h-[100dvh] flex items-center justify-center bg-[#fafafa] font-bold text-red-500">Identity not found.</div>;

  if (profile.isActive === false) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#fafafa] p-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-200/80 relative z-10">
          <div className="w-20 h-20 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-extrabold text-brandDark tracking-tight mb-2">Profile Disabled</h2>
          <p className="text-zinc-500 font-medium leading-relaxed mb-6">
            This {profile.type}'s parents have chosen to temporarily disable this public ID. Please try scanning again later.
          </p>
          <div className="inline-flex items-center space-x-1.5 bg-zinc-100 px-3 py-1.5 rounded-full text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
            <img src="/kintag-logo.png" className="w-4 h-4 rounded opacity-50" alt="Logo" />
            <span>Secured by KinTag</span>
          </div>
        </div>
      </div>
    );
  }

  let displayContacts = profile.contacts || [
    { id: '1', name: profile.parent1Name, phone: profile.parent1Phone, countryCode: '', tag: 'Mother' },
    ...(profile.parent2Name ? [{ id: '2', name: profile.parent2Name, phone: profile.parent2Phone, countryCode: '', tag: 'Father' }] : [])
  ];

  const primaryContact = displayContacts.find(c => c.id === profile.primaryContactId) || displayContacts[0];
  const encodedAddress = encodeURIComponent(profile.address);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  
  const helplineNumber = profile.type === 'kid' ? '112' : '1962'; 
  const helplineText = profile.type === 'kid' ? 'National Emergency (112)' : 'Animal Helpline (1962)';

  const displayHeight = profile.heightUnit === 'ft' 
    ? `${profile.heightMain}'${profile.heightSub}"` 
    : (profile.heightMain ? `${profile.heightMain} cm` : profile.height);
    
  const displayWeight = profile.weightMain 
    ? `${profile.weightMain} ${profile.weightUnit}` 
    : profile.weight;

  const computedAge = getComputedAge(profile);

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] flex flex-col font-sans relative overflow-x-hidden selection:bg-brandGold selection:text-white">
      
      {/* Desktop Background Elements */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none hidden md:block"></div>
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-brandGold/10 via-emerald-400/5 to-transparent rounded-full blur-[100px] pointer-events-none z-0 hidden md:block"></div>

      {/* Main Mobile-Sized Card Container */}
      <div className="w-full max-w-md mx-auto relative z-10 bg-white md:my-8 md:rounded-[3rem] md:shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:border md:border-zinc-200/80 overflow-hidden flex flex-col min-h-[100dvh] md:min-h-0">
        
        {/* 🌟 Dynamic Island Emergency Alert */}
        <motion.div 
          layout
          initial={{ borderRadius: 32 }}
          animate={{ 
            width: isIslandExpanded ? '92%' : 'auto',
            padding: isIslandExpanded ? '24px' : '12px 20px',
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={() => !isIslandExpanded && setIsIslandExpanded(true)}
          className={`absolute top-4 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-2xl text-white shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-white/10 z-[100] cursor-pointer overflow-hidden flex flex-col items-center justify-center`}
        >
          {!isIslandExpanded ? (
            <motion.div layout="position" className="flex items-center justify-center gap-2">
              <BellRing size={16} className="text-red-400 animate-pulse shrink-0" />
              <span className="font-extrabold text-sm tracking-tight whitespace-nowrap">Found this {profile.type}?</span>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, filter: "blur(4px)" }} 
              animate={{ opacity: 1, filter: "blur(0px)" }} 
              transition={{ delay: 0.1, duration: 0.2 }}
              className="w-full"
            >
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-extrabold text-red-400 text-lg flex items-center gap-2"><BellRing size={18}/> Emergency Alert</h3>
                 <button onClick={(e) => { e.stopPropagation(); setIsIslandExpanded(false); }} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={18}/></button>
              </div>
              
              {!activeAlertSent ? (
                <>
                  <p className="text-sm text-white/80 font-medium mb-6 leading-relaxed">Slide the button below to securely send your exact GPS location directly to the owner's phone.</p>
                  
                  {/* 🌟 NEW: Slide To Share Interactive Component */}
                  <SlideToShare onSlide={handleActiveAlert} isLoading={isSendingAlert} isPreview={isPreview} />

                  {gpsError && <p className="text-red-400 text-xs font-bold mt-4 text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">{gpsError}</p>}
                </>
              ) : (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-6 space-y-3">
                  <CheckCircle2 size={48} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]" />
                  <h3 className="font-extrabold text-emerald-400 text-2xl tracking-tight">Owner Notified!</h3>
                  <p className="text-white/70 text-sm text-center font-medium">Your exact location has been sent to their phone. Please stay nearby.</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Header Image Area */}
        <div className="relative h-[45vh] w-full shrink-0 bg-zinc-100">
          <img 
            src={profile.imageUrl} 
            alt={profile.name} 
            onContextMenu={(e) => e.preventDefault()} 
            draggable="false" 
            style={{ WebkitTouchCallout: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none"></div>
          
          <div 
            onClick={handleLogoClick}
            className={`absolute top-4 left-4 z-20 flex items-center h-10 bg-black/40 backdrop-blur-md rounded-full border border-white/20 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isPreview ? 'cursor-default opacity-80' : 'cursor-pointer'} ${isLogoExpanded ? 'px-3.5' : 'w-10 justify-center px-0'}`}
          >
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-6 h-6 rounded-md shadow-sm shrink-0" />
            <span className={`text-white font-bold text-sm tracking-tight drop-shadow-sm overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isLogoExpanded ? 'max-w-[100px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0'}`}>
              KinTag
            </span>
          </div>

          <button 
            onClick={() => { if(!isPreview) setIsImageEnlarged(true); }} 
            className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full transition z-20 ${isPreview ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/60 shadow-lg hover:scale-105 active:scale-95'}`} 
            title="View Full Image"
          >
            <Maximize2 size={18} />
          </button>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-t-[2.5rem] p-7 z-10 relative -mt-10 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] space-y-8 pb-56">
          
          {profile.isLost && (
            <div className="overflow-hidden bg-red-600 text-white shadow-[0_5px_20px_rgba(239,68,68,0.4)] border-y-[6px] border-red-700 relative flex items-center h-20 -mx-7 -mt-7 mb-8 rounded-t-[2.5rem]">
              <style>{`
                @keyframes missingMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-missing-marquee { display: flex; width: max-content; animation: missingMarquee 10s linear infinite; }
              `}</style>
              <div className="animate-missing-marquee flex items-center h-full">
                {[...Array(10)].map((_, i) => (
                   <span key={i} className="mx-6 font-black text-2xl tracking-[0.15em] uppercase flex items-center gap-4 whitespace-nowrap">
                     <Siren size={32} className="animate-pulse text-white shrink-0 drop-shadow-md" />
                     ⚠️ REPORTED MISSING ⚠️ PLEASE HELP 
                   </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-center border-b border-zinc-100 pb-8 relative">
            <h1 className="text-[2.5rem] leading-none font-extrabold text-brandDark mb-2 tracking-tight drop-shadow-sm">{profile.name}</h1>
            <p className="text-sm text-brandGold font-extrabold uppercase tracking-[0.2em] bg-brandGold/10 inline-block px-4 py-1.5 rounded-full border border-brandGold/20 mt-2">
              {computedAge.value} {computedAge.label} • {profile.typeSpecific} {profile.type === 'kid' && profile.nationality ? `• ${profile.nationality}` : ''}
            </p>
          </div>

          {profile.allergies && profile.allergies.toLowerCase() !== 'none' && profile.allergies.toLowerCase() !== 'none known' && (
             <div className="bg-amber-50 border border-amber-200/60 p-5 rounded-3xl flex items-start space-x-4 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
               <div className="bg-amber-100 p-2.5 rounded-2xl shrink-0 border border-amber-200">
                 <Activity className="text-amber-600" size={24} />
               </div>
               <div className="pt-1">
                 <h3 className="text-amber-800 font-extrabold text-[10px] uppercase tracking-widest mb-1.5">Medical Alert / Allergies</h3>
                 <p className="text-amber-950 font-bold text-base leading-snug">{profile.allergies}</p>
               </div>
             </div>
          )}

          {profile.type === 'kid' && profile.specialNeeds && (
             <div className="bg-violet-50 border border-violet-200/60 p-5 rounded-3xl flex items-start space-x-4 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>
               <div className="bg-violet-100 p-2.5 rounded-2xl shrink-0 border border-violet-200">
                 <Heart className="text-violet-600" size={24} />
               </div>
               <div className="pt-1">
                 <h3 className="text-violet-700 font-extrabold text-[10px] uppercase tracking-widest mb-1.5">Behavioral / Special Needs</h3>
                 <p className="text-violet-950 font-bold text-base leading-snug">{profile.specialNeeds}</p>
               </div>
             </div>
          )}

          {profile.dob && (
             <div className="bg-sky-50 border border-sky-200/60 p-5 rounded-3xl flex items-center space-x-4 shadow-sm">
               <div className="bg-sky-100 p-2.5 rounded-2xl shrink-0 border border-sky-200">
                 <Cake className="text-sky-600" size={24} />
               </div>
               <div>
                 <h3 className="text-sky-800 font-extrabold text-[10px] uppercase tracking-widest mb-1">Date of Birth</h3>
                 <p className="text-sky-950 font-bold text-base">
                   {new Date(profile.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                 </p>
               </div>
             </div>
          )}

          {profile.type === 'pet' && (
            <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-200/80 space-y-4 shadow-sm">
              <h3 className="font-extrabold text-brandDark tracking-tight text-lg flex items-center gap-2"><PawPrint size={20} className="text-brandGold"/> Pet Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                   <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Temperament</span>
                   <p className={`text-base font-extrabold mt-1 ${profile.temperament !== 'Friendly' ? 'text-red-600' : 'text-brandDark'}`}>{profile.temperament}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                   <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Vaccination</span>
                   <p className="text-base font-extrabold text-brandDark mt-1">{profile.vaccinationStatus}</p>
                </div>
                {profile.microchip && (
                  <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm col-span-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                     <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Microchip ID</span>
                     <span className="text-base font-extrabold text-brandDark font-mono bg-zinc-50 px-3 py-1 rounded-lg border border-zinc-100">{profile.microchip}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[2rem] flex flex-col items-center text-center border border-zinc-200 shadow-sm">
              <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 mb-3 shadow-inner">
                {profile.type === 'kid' ? <User className="text-zinc-600" size={24} /> : <PawPrint className="text-zinc-600" size={24}/>}
              </div>
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest mb-1">Gender</span>
              <span className="font-extrabold text-brandDark text-lg">{profile.gender}</span>
            </div>

            {profile.type === 'kid' && (
              <div className="bg-white p-5 rounded-[2rem] flex flex-col items-center text-center border border-zinc-200 shadow-sm">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 mb-3 shadow-inner">
                  <Droplet className="text-red-500" size={24} />
                </div>
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest mb-1">Blood Group</span>
                <span className="font-extrabold text-brandDark text-lg">{profile.bloodGroup}</span>
              </div>
            )}

            <div className="bg-white p-5 rounded-[2rem] flex flex-col items-center text-center border border-zinc-200 shadow-sm">
              <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 mb-3 shadow-inner">
                <Ruler className="text-zinc-600" size={24} />
              </div>
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest mb-1">Height</span>
              <span className="font-extrabold text-brandDark text-lg">{displayHeight}</span>
            </div>
            <div className="bg-white p-5 rounded-[2rem] flex flex-col items-center text-center border border-zinc-200 shadow-sm">
              <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 mb-3 shadow-inner">
                <Scale className="text-zinc-600" size={24} />
              </div>
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest mb-1">Weight</span>
              <span className="font-extrabold text-brandDark text-lg">{displayWeight}</span>
            </div>
          </div>

          {(profile.policeStation || profile.pincode) && (
            <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-200/80 shadow-sm">
              <div className="flex items-center space-x-2.5 mb-4 text-brandDark">
                <div className="bg-brandGold/10 p-2 rounded-xl text-brandGold"><MapPin size={20} /></div>
                <h3 className="font-extrabold tracking-tight text-lg">Local Information</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                  <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Police Station</span>
                  <span className="text-sm font-extrabold text-brandDark">{profile.policeStation || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
                  <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Area Pincode</span>
                  <span className="text-sm font-extrabold text-brandDark bg-zinc-50 px-3 py-1 rounded-lg border border-zinc-100">{profile.pincode || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-200/80 shadow-sm mb-8">
            <div className="flex items-center space-x-2.5 mb-5 text-brandDark">
              <div className="bg-blue-50 p-2 rounded-xl text-blue-500 border border-blue-100"><Users size={20} /></div>
              <h3 className="font-extrabold tracking-tight text-lg">Authorized Guardians</h3>
            </div>
            <div className="space-y-3">
              {displayContacts.map((contact) => (
                <div key={contact.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-zinc-200">
                  <div>
                    <div className="flex items-center space-x-2.5 mb-1">
                      <p className="text-brandDark font-extrabold text-base tracking-tight">{contact.name}</p>
                      <span className="px-2.5 py-0.5 bg-brandGold/10 border border-brandGold/20 text-brandGold text-[9px] font-extrabold uppercase tracking-widest rounded-md">
                        {contact.tag === 'Other' ? contact.customTag : contact.tag}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-xs font-bold tracking-wider">{contact.phone}</p>
                  </div>
                  {isPreview ? (
                    <div className="bg-brandDark text-white p-3.5 rounded-xl opacity-50 cursor-not-allowed shadow-sm shrink-0">
                      <Phone size={18} fill="currentColor" />
                    </div>
                  ) : (
                    <a href={`tel:${contact.countryCode || ''}${contact.phone}`} onClick={() => unlockVault()} className="bg-brandDark text-white p-3.5 rounded-xl hover:bg-brandAccent transition-colors shadow-sm shrink-0 active:scale-95">
                      <Phone size={18} fill="currentColor" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {profile.documents && profile.documents.length > 0 && (
            <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-200/80 shadow-sm mb-8">
              <div className="flex items-center space-x-2.5 mb-5 text-brandDark">
                <div className="bg-indigo-50 p-2 rounded-xl text-indigo-500 border border-indigo-100"><FileText size={20} /></div>
                <h3 className="font-extrabold tracking-tight text-lg">Important Documents</h3>
              </div>

              {!isVaultUnlocked ? (
                <div className="relative rounded-[1.5rem] overflow-hidden border border-zinc-200/60 min-h-[180px] flex items-center justify-center bg-white shadow-sm">
                  <div className="absolute inset-0 filter blur-md opacity-30 select-none pointer-events-none p-5">
                     <div className="bg-zinc-200 rounded-2xl mb-4 h-14 w-full"></div>
                     <div className="bg-zinc-200 rounded-2xl h-14 w-3/4"></div>
                  </div>
                  <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center w-full">
                     <div className="w-14 h-14 bg-zinc-50 rounded-[1.25rem] flex items-center justify-center shadow-inner mb-4 text-brandDark border border-zinc-200 shrink-0">
                       <Lock size={24} />
                     </div>
                     <p className="text-xs font-extrabold text-brandDark bg-white/90 backdrop-blur-md px-5 py-3 rounded-xl shadow-lg border border-zinc-100 max-w-[280px] leading-relaxed">
                       Vault Locked. Call an emergency contact or share your location above to view sensitive documents.
                     </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-500">
                  {profile.documents.map((doc, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setViewingDocument(doc)} 
                      className="w-full flex items-center justify-between bg-white p-4.5 rounded-2xl shadow-sm border border-zinc-200 hover:border-brandDark/30 hover:shadow-md transition-all group active:scale-[0.98]"
                    >
                      <span className="font-extrabold text-brandDark text-sm tracking-tight truncate pr-4 pl-1">{doc.name}</span>
                      <div className="bg-zinc-50 border border-zinc-100 p-2.5 rounded-xl group-hover:bg-brandDark group-hover:text-white group-hover:border-brandDark transition-colors shrink-0 shadow-inner">
                        <FileText size={18} />
                      </div>
                    </button>
                  ))}
                  <div className="flex items-center justify-center gap-2 text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest mt-5 bg-emerald-50 py-2 rounded-full border border-emerald-100 w-max mx-auto px-4">
                    <Unlock size={14} />
                    <span>Vault Unlocked (15m)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center pb-8 pt-4">
            {isPreview ? (
              <div className="flex items-center space-x-2.5 bg-zinc-50 border border-zinc-200/80 px-5 py-2.5 rounded-full shadow-sm opacity-70 cursor-not-allowed">
                <span className="text-zinc-400 text-[10px] font-extrabold uppercase tracking-widest">Secured by</span>
                <div className="flex items-center space-x-1.5">
                  <img src="/kintag-logo.png" className="w-5 h-5 rounded shadow-sm" alt="Logo" />
                  <span className="text-brandDark font-black text-sm tracking-tight">KinTag</span>
                </div>
              </div>
            ) : (
              <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2.5 bg-zinc-50 border border-zinc-200/80 px-5 py-2.5 rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all group active:scale-95">
                <span className="text-zinc-400 text-[10px] font-extrabold uppercase tracking-widest group-hover:text-brandGold transition-colors">Secured by</span>
                <div className="flex items-center space-x-1.5">
                  <img src="/kintag-logo.png" className="w-5 h-5 rounded shadow-sm" alt="Logo" />
                  <span className="text-brandDark font-black text-sm tracking-tight">KinTag</span>
                </div>
              </a>
            )}
          </div>

        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-2xl border-t border-zinc-200/80 space-y-3 pb-8 md:pb-6 shadow-[0_-20px_40px_rgba(0,0,0,0.06)] z-50 md:rounded-b-[3rem]">
          
          {isPreview ? (
            <div className={`w-full flex items-center justify-center space-x-2 py-4 px-4 rounded-[1.25rem] font-extrabold text-base shadow-lg opacity-50 cursor-not-allowed ${profile.isLost ? 'bg-red-600 text-white' : 'bg-brandDark text-white'}`}>
              <Phone size={22} />
              <span className="truncate">{profile.isLost ? `CALL IMMEDIATELY` : `Call ${primaryContact.name} (Emergency)`}</span>
            </div>
          ) : (
            <a href={`tel:${primaryContact.countryCode || ''}${primaryContact.phone}`} onClick={() => unlockVault()} className={`w-full flex items-center justify-center space-x-3 py-4 px-4 rounded-[1.25rem] font-black text-[1.1rem] shadow-lg transition-all active:scale-[0.98] ${profile.isLost ? 'bg-red-600 text-white animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_30px_rgba(239,68,68,0.5)] border-[3px] border-red-400' : 'bg-brandDark text-white hover:bg-brandAccent hover:shadow-xl'}`}>
              <Phone size={24} fill={profile.isLost ? "currentColor" : "none"} />
              <span className="truncate">{profile.isLost ? `CALL ${primaryContact.name.toUpperCase()} IMMEDIATELY` : `Call ${primaryContact.name} (Emergency)`}</span>
            </a>
          )}

          <div className="flex gap-3">
            {isPreview ? (
              <div className="flex-1 flex items-center justify-center space-x-2 bg-zinc-50 text-zinc-400 py-3.5 px-4 rounded-2xl font-extrabold shadow-sm border border-zinc-200 opacity-50 cursor-not-allowed">
                <MapPin size={18} className="shrink-0" />
                <span className="text-sm truncate tracking-tight">Navigate Home</span>
              </div>
            ) : (
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center space-x-2 bg-zinc-50 text-brandDark py-3.5 px-4 rounded-2xl font-extrabold shadow-sm border border-zinc-200 hover:bg-white hover:border-zinc-300 transition-colors active:scale-[0.98]">
                <MapPin size={18} className="shrink-0" />
                <span className="text-sm truncate tracking-tight">Navigate Home</span>
              </a>
            )}

            {isPreview ? (
              <div className="w-28 shrink-0 flex flex-col items-center justify-center bg-brandGold/5 text-brandGold py-1.5 px-2 rounded-2xl border border-brandGold/20 opacity-50 cursor-not-allowed">
                <AlertTriangle size={18} className="mb-0.5" />
                <span className="text-[9px] text-center leading-tight tracking-widest uppercase font-extrabold">{helplineText}</span>
              </div>
            ) : (
              <a href={`tel:${helplineNumber}`} className="w-28 shrink-0 flex flex-col items-center justify-center bg-brandGold/5 text-brandGold py-1.5 px-2 rounded-2xl border border-brandGold/20 hover:bg-brandGold/10 transition-colors active:scale-[0.98] shadow-sm">
                <AlertTriangle size={18} className="mb-0.5" />
                <span className="text-[9px] text-center leading-tight tracking-widest uppercase font-extrabold">{helplineText}</span>
              </a>
            )}
          </div>
        </div>

      </div>

      {isImageEnlarged && !isPreview && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/90 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <button onClick={() => setIsImageEnlarged(false)} className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition z-[110] border border-white/10">
            <X size={24} />
          </button>
          <img 
            src={profile.imageUrl} 
            alt={profile.name} 
            onContextMenu={(e) => e.preventDefault()} 
            draggable="false" 
            style={{ WebkitTouchCallout: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
            className="max-w-full max-h-[85vh] object-contain rounded-[2rem] shadow-2xl relative z-[105] border border-white/10" 
          />
        </div>
      )}

      {viewingDocument && !isPreview && (
        <div className="fixed inset-0 z-[120] bg-zinc-950/90 flex flex-col items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="absolute top-4 w-full max-w-md mx-auto px-6 flex justify-between items-center z-[130]">
             <div className="flex items-center gap-3 bg-black/50 border border-white/10 backdrop-blur-md px-4 py-2 rounded-full">
               <FileText size={16} className="text-brandGold" />
               <h3 className="text-white font-extrabold tracking-tight truncate max-w-[200px] text-sm">{viewingDocument.name}</h3>
             </div>
             <button onClick={() => setViewingDocument(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition shrink-0 border border-white/10">
               <X size={20} />
             </button>
          </div>
          <div className="w-full max-w-md mx-auto h-full flex items-center justify-center pt-20 pb-6">
            {viewingDocument.url.toLowerCase().includes('.doc') ? (
              <div className="w-full h-full max-h-[80vh] rounded-[2rem] shadow-2xl relative z-[125] bg-white overflow-hidden border border-white/10">
                <iframe 
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(viewingDocument.url)}&embedded=true`} 
                  className="w-full h-full border-0" 
                />
              </div>
            ) : (
              <img 
                src={viewingDocument.url.toLowerCase().includes('.pdf') ? viewingDocument.url.replace(/\.pdf/i, '.jpg') : viewingDocument.url} 
                alt={viewingDocument.name} 
                onContextMenu={(e) => e.preventDefault()} 
                draggable="false" 
                style={{ WebkitTouchCallout: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
                className="max-w-full max-h-[80vh] object-contain rounded-[2rem] shadow-2xl relative z-[125] border border-white/10" 
              />
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function PublicCardSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-[#fafafa] flex flex-col md:py-8 font-sans">
      <div className="max-w-md w-full mx-auto relative bg-white md:rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:border md:border-zinc-200/80 overflow-hidden flex flex-col min-h-[100dvh] md:min-h-0">
        <div className="h-[45vh] w-full bg-zinc-200 animate-pulse"></div>
        <div className="flex-1 bg-white -mt-10 rounded-t-[2.5rem] p-7 z-10 space-y-7 relative">
          <div className="flex flex-col items-center space-y-3 border-b border-zinc-100 pb-6">
            <div className="h-10 w-2/3 bg-zinc-200 animate-pulse rounded-xl"></div>
            <div className="h-6 w-1/3 bg-zinc-100 animate-pulse rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-zinc-50 p-5 rounded-[2rem] h-28 border border-zinc-100 animate-pulse flex flex-col items-center justify-center space-y-3">
                <div className="h-8 w-8 bg-zinc-200 rounded-2xl"></div>
                <div className="h-4 w-1/2 bg-zinc-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="bg-zinc-50 p-6 rounded-[2rem] h-48 border border-zinc-100 animate-pulse mt-8"></div>
        </div>
      </div>
    </div>
  );
}
