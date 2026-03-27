import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom'; 
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { Turnstile } from '@marsidev/react-turnstile';
import { Phone, MapPin, AlertTriangle, Droplet, Ruler, Users, Scale, User, PawPrint, Maximize2, X, Activity, Heart, BellRing, Loader2, CheckCircle2, Cake, ShieldAlert, Siren, FileText, Lock, Unlock } from 'lucide-react';

// 🌟 FULL OFFLINE ARCHITECTURE: Import dynamic storage functions
import { getFromCache } from '../utils/offlineStorage';

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
        // 🌟 FULL OFFLINE ARCHITECTURE: Intercept and load from IndexedDB
        if (!isOnline) {
          const cachedProfiles = await getFromCache('profiles');
          const localProfile = cachedProfiles.find(p => p.id === profileId);
          if (localProfile) {
            setProfile(localProfile);
          } else {
            setProfile(null);
          }
        } else {
          // ONLINE ENGINE: Fetch fresh from Firebase
          const docRef = doc(db, "profiles", profileId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            setProfile(null);
          }
        }
      } catch (error) {
        console.error("Error fetching profile");
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
  }, [profileId, isOnline]);

  useEffect(() => {
    const sendPassiveAlert = async () => {
      if (!isVerified || !profile || profile.isActive === false || passiveAlertSent.current || isPreview || !isOnline) return; 
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
            title: `👀 ${profile.name || 'Profile'}'s Tag Scanned!`,
            body: `Someone just viewed the digital ID near ${cityStr}.`,
            link: `https://kintag.vercel.app/#/?view=notifications` 
          })
        });
      } catch (error) {
        // silent fail
      }
    };

    let timer;
    // 🌟 Block passive alerts if offline
    if (isVerified && profile && profile.isActive !== false && !passiveAlertSent.current && !isPreview && isOnline) {
      timer = setTimeout(() => {
        sendPassiveAlert();
      }, 1500);
    }

    return () => clearTimeout(timer);
  }, [profile, profileId, isPreview, isVerified, isOnline]);

  const unlockVault = () => {
    if (isPreview) return;
    setIsVaultUnlocked(true);
    if (vaultTimerRef.current) clearTimeout(vaultTimerRef.current);
    vaultTimerRef.current = setTimeout(() => {
      setIsVaultUnlocked(false);
    }, 15 * 60 * 1000); 
  };

  const handleActiveAlert = (e) => {
    e.stopPropagation(); 
    // 🌟 Block active alerts if offline
    if (isPreview || profile?.isActive === false || !isOnline) return;

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
            profileName: profile.name || 'Profile',
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
              title: `📍 URGENT: ${profile.name || 'PROFILE'} FOUND!`,
              body: `A Good Samaritan has shared their exact GPS location. TAP HERE to open details!`,
              link: `https://kintag.vercel.app/#/?view=notifications` 
            })
          });

          setActiveAlertSent(true);
          
          // Sound & Vibration properly synced on success
          playChime();
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]); 
          }
          
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

  // 🌟 Only render Turnstile if online
  if (!isVerified && isOnline) {
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
          <Turnstile siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={() => setIsVerified(true)} />
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

  const displayContacts = profile.contacts?.length > 0 
    ? profile.contacts 
    : [
        { id: '1', name: profile.parent1Name || 'Guardian', phone: profile.parent1Phone || '', countryCode: '', tag: 'Primary' },
        ...(profile.parent2Name ? [{ id: '2', name: profile.parent2Name, phone: profile.parent2Phone, countryCode: '', tag: 'Secondary' }] : [])
      ];

  const primaryContact = displayContacts.find(c => c.id === profile.primaryContactId) || displayContacts[0];
  
  const encodedAddress = encodeURIComponent(profile.address || '');
  const googleMapsUrl = `https://maps.google.com/?q=${encodedAddress}`;
  
  const helplineNumber = profile.type === 'kid' ? '112' : '1962'; 
  const helplineText = profile.type === 'kid' ? 'National Emergency (112)' : 'Animal Helpline (1962)';

  const displayHeight = profile.heightUnit === 'ft' 
    ? `${profile.heightMain || 0}'${profile.heightSub || 0}"` 
    : (profile.heightMain ? `${profile.heightMain} cm` : profile.height || 'N/A');
    
  const displayWeight = profile.weightMain 
    ? `${profile.weightMain} ${profile.weightUnit}` 
    : profile.weight || 'N/A';

  const computedAge = getComputedAge(profile);

  return (
    <div className="min-h-[100dvh] bg-zinc-100 flex flex-col items-center font-sans relative selection:bg-brandGold selection:text-white pb-48 md:pb-52">
      
      {/* 🌟 OFFLINE DANGER BANNER */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[300] bg-amber-500 text-amber-950 py-3 px-4 font-bold text-sm shadow-md flex items-center justify-center gap-2 animate-in slide-in-from-top-4">
          <AlertTriangle size={18} />
          Offline Mode: Viewing Cached ID
        </div>
      )}

      {/* Dynamic Island / Share Button */}
      <div 
        onClick={() => !isIslandExpanded && setIsIslandExpanded(true)}
        className={`fixed top-4 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur-xl text-white rounded-[2rem] shadow-2xl z-[100] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden cursor-pointer ${!isOnline ? 'mt-8' : ''} ${isIslandExpanded ? 'w-11/12 max-w-sm p-6' : 'w-auto px-5 py-3 flex items-center justify-center gap-2 hover:bg-black'}`}
      >
        {!isIslandExpanded ? (
          <>
            <BellRing size={16} className="text-red-400 animate-pulse shrink-0" />
            <span className="font-extrabold text-sm tracking-tight whitespace-nowrap">Found this {profile.type}?</span>
          </>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-3">
               <h3 className="font-extrabold text-red-400 text-lg flex items-center gap-2"><BellRing size={18}/> Emergency Alert</h3>
               <button onClick={(e) => { e.stopPropagation(); setIsIslandExpanded(false); }} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={18}/></button>
            </div>
            
            {!activeAlertSent ? (
              <>
                <p className="text-sm text-white/80 font-medium mb-5 leading-relaxed">Tap below to securely send your exact GPS location directly to the owner's phone.</p>
                <button 
                  onClick={handleActiveAlert} 
                  disabled={isSendingAlert || isPreview || !isOnline}
                  className={`w-full font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-70 ${isPreview || !isOnline ? 'bg-zinc-500 text-white cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                >
                  {isSendingAlert ? <Loader2 className="animate-spin" size={20} /> : <MapPin size={20} />}
                  <span>{isPreview ? "Disabled in Preview" : (!isOnline ? "Disabled Offline" : (isSendingAlert ? "Locating..." : `Share My Location`))}</span>
                </button>
                {gpsError && <p className="text-red-400 text-xs font-bold mt-3 text-center">{gpsError}</p>}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 space-y-2">
                <CheckCircle2 size={40} className="text-emerald-400" />
                <h3 className="font-extrabold text-emerald-400 text-xl">Owner Notified!</h3>
                <p className="text-white/70 text-sm text-center">Your exact location has been sent to their phone. Please stay nearby.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none hidden md:block"></div>
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-brandGold/10 via-emerald-400/5 to-transparent rounded-full blur-[100px] pointer-events-none z-0 hidden md:block"></div>

      <div className={`w-full max-w-md bg-white shadow-[0_20px_60px_rgba(0,0,0,0.05)] md:rounded-[3rem] md:my-10 md:overflow-hidden flex flex-col relative z-10 border border-zinc-200 ${!isOnline ? 'mt-8 md:mt-16' : ''}`}>
        
        <div className="relative h-[45vh] md:h-[350px] w-full shrink-0 bg-zinc-100">
          <img 
            src={profile.imageUrl} 
            alt={profile.name} 
            onContextMenu={(e) => e.preventDefault()} 
            draggable="false" 
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
          >
            <Maximize2 size={18} />
          </button>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-t-[2.5rem] p-6 md:p-8 z-10 relative -mt-10 space-y-6 pb-20">
          
          {profile.isLost && (
            <div className="overflow-hidden bg-red-600 text-white shadow-[0_5px_20px_rgba(239,68,68,0.4)] border-y-[4px] border-red-700 relative flex items-center h-16 -mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-6 rounded-t-[2.5rem]">
              <style>{`
                @keyframes missingMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-missing-marquee { display: flex; width: max-content; animation: missingMarquee 10s linear infinite; }
              `}</style>
              <div className="animate-missing-marquee flex items-center h-full">
                {[...Array(10)].map((_, i) => (
                   <span key={i} className="mx-6 font-black text-xl tracking-[0.15em] uppercase flex items-center gap-3 whitespace-nowrap">
                     <Siren size={24} className="animate-pulse text-white shrink-0 drop-shadow-md" />
                     ⚠️ REPORTED MISSING ⚠️ PLEASE HELP 
                   </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pb-2">
            <h1 className="text-[2.5rem] leading-none font-extrabold text-brandDark mb-2 tracking-tight drop-shadow-sm">{profile.name}</h1>
            <p className="text-xs text-brandGold font-extrabold uppercase tracking-[0.2em] bg-brandGold/10 inline-block px-4 py-1.5 rounded-full border border-brandGold/20 mt-1">
              {computedAge.value} {computedAge.label} • {profile.typeSpecific || profile.type} {profile.type === 'kid' && profile.nationality ? `• ${profile.nationality}` : ''}
            </p>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm divide-y divide-zinc-200">
            {profile.allergies && profile.allergies?.toLowerCase() !== 'none' && profile.allergies?.toLowerCase() !== 'none known' && (
              <div className="p-4 flex items-center gap-4 bg-amber-50/50">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-200"><Activity size={20} /></div>
                <div>
                  <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest mb-0.5">Allergies / Meds</p>
                  <p className="text-sm font-bold text-amber-950 leading-tight">{profile.allergies}</p>
                </div>
              </div>
            )}
            
            {profile.type === 'kid' && profile.specialNeeds && (
              <div className="p-4 flex items-center gap-4 bg-violet-50/50">
                <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center shrink-0 border border-violet-200"><Heart size={20} /></div>
                <div>
                  <p className="text-[10px] font-extrabold text-violet-800 uppercase tracking-widest mb-0.5">Special Needs</p>
                  <p className="text-sm font-bold text-violet-950 leading-tight">{profile.specialNeeds}</p>
                </div>
              </div>
            )}

            {profile.dob && (
              <div className="p-4 flex items-center gap-4 bg-sky-50/50">
                <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center shrink-0 border border-sky-200"><Cake size={20} /></div>
                <div>
                  <p className="text-[10px] font-extrabold text-sky-800 uppercase tracking-widest mb-0.5">Date of Birth</p>
                  <p className="text-sm font-bold text-sky-950 leading-tight">{new Date(profile.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            )}
            
            {profile.type === 'pet' && profile.vaccinationStatus && (
              <div className="p-4 flex flex-col gap-1 bg-emerald-50/50">
                <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest">Vaccination Status</p>
                <p className="text-sm font-bold text-emerald-950 leading-tight">{profile.vaccinationStatus}</p>
              </div>
            )}
            {profile.type === 'pet' && profile.microchip && (
              <div className="p-4 flex flex-col gap-1 bg-zinc-50/50">
                <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Microchip ID</p>
                <p className="text-sm font-extrabold text-brandDark font-mono leading-tight">{profile.microchip}</p>
              </div>
            )}
            {profile.type === 'pet' && profile.temperament && (
              <div className="p-4 flex flex-col gap-1 bg-zinc-50/50">
                <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Temperament</p>
                <p className={`text-sm font-bold leading-tight ${profile.temperament !== 'Friendly' ? 'text-red-600' : 'text-brandDark'}`}>{profile.temperament}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-50 p-4 rounded-2xl flex flex-col items-center text-center border border-zinc-200">
              <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest mb-1">Gender</span>
              <span className="font-extrabold text-brandDark text-sm">{profile.gender || 'N/A'}</span>
            </div>
            <div className="bg-zinc-50 p-4 rounded-2xl flex flex-col items-center text-center border border-zinc-200">
              <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest mb-1">Height</span>
              <span className="font-extrabold text-brandDark text-sm">{displayHeight}</span>
            </div>
            <div className="bg-zinc-50 p-4 rounded-2xl flex flex-col items-center text-center border border-zinc-200">
              <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest mb-1">Weight</span>
              <span className="font-extrabold text-brandDark text-sm">{displayWeight}</span>
            </div>
          </div>
          {profile.type === 'kid' && profile.bloodGroup && (
             <div className="bg-red-50 p-4 rounded-2xl flex justify-between items-center border border-red-100">
                <span className="text-xs text-red-600 font-extrabold uppercase tracking-widest flex items-center gap-2"><Droplet size={16}/> Blood Group</span>
                <span className="font-extrabold text-red-700 text-lg">{profile.bloodGroup}</span>
             </div>
          )}

          <div className="space-y-3">
             <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest ml-2">Emergency Contacts</h3>
             <div className="bg-zinc-50 border border-zinc-200 rounded-[2rem] p-2 space-y-2">
              {displayContacts.map((contact) => (
                <div key={contact.id} className="flex justify-between items-center bg-white p-3 rounded-3xl shadow-sm border border-zinc-100">
                  <div className="pl-2">
                    <div className="flex items-center space-x-2 mb-0.5">
                      <p className="text-brandDark font-extrabold text-sm tracking-tight">{contact.name || 'Guardian'}</p>
                      <span className="px-2 py-0.5 bg-brandGold/10 border border-brandGold/20 text-brandGold text-[9px] font-extrabold uppercase tracking-widest rounded-md">
                        {contact.tag === 'Other' ? contact.customTag : contact.tag}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-xs font-bold tracking-wider">{contact.phone || 'No phone set'}</p>
                  </div>
                  {isPreview ? (
                    <div className="bg-brandDark text-white p-3 rounded-2xl opacity-50 cursor-not-allowed shadow-sm shrink-0">
                      <Phone size={18} fill="currentColor" />
                    </div>
                  ) : (
                    <a href={`tel:${contact.countryCode || ''}${contact.phone || ''}`} onClick={() => unlockVault()} className="bg-brandDark text-white p-3 rounded-2xl hover:bg-brandAccent transition-colors shadow-sm shrink-0 active:scale-95">
                      <Phone size={18} fill="currentColor" />
                    </a>
                  )}
                </div>
              ))}
             </div>
          </div>

          <div className="space-y-3 pb-6">
             <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest ml-2">Documents & Location</h3>
             <div className="bg-zinc-50 border border-zinc-200 rounded-[2rem] overflow-hidden divide-y divide-zinc-200">
                {(profile.policeStation || profile.pincode) && (
                  <div className="p-4 grid grid-cols-2 gap-4 bg-white">
                    <div>
                      <span className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1">Police Station</span>
                      <span className="text-sm font-extrabold text-brandDark truncate block">{profile.policeStation || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1">Pincode</span>
                      <span className="text-sm font-extrabold text-brandDark font-mono">{profile.pincode || 'N/A'}</span>
                    </div>
                  </div>
                )}
                
                {profile.documents && profile.documents.length > 0 && (
                  <div className="p-4 bg-white">
                    {!isVaultUnlocked ? (
                      <div className="relative rounded-2xl overflow-hidden border border-zinc-200 min-h-[120px] flex items-center justify-center bg-zinc-50">
                        <div className="absolute inset-0 filter blur-md opacity-30 pointer-events-none p-4">
                           <div className="bg-zinc-300 rounded-xl mb-3 h-10 w-full"></div>
                           <div className="bg-zinc-300 rounded-xl h-10 w-3/4"></div>
                        </div>
                        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-2">
                           <Lock size={20} className="text-zinc-400 mb-2" />
                           <p className="text-[11px] font-extrabold text-zinc-600 bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg shadow-sm border border-zinc-100 max-w-[240px] leading-relaxed">
                             Vault Locked. Call a contact or share location above to view.
                           </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 animate-in fade-in duration-500">
                        {profile.documents.map((doc, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => setViewingDocument(doc)} 
                            className="w-full flex items-center justify-between bg-zinc-50 p-3 rounded-2xl shadow-sm border border-zinc-200 hover:border-brandDark/30 transition-all active:scale-[0.98]"
                          >
                            <span className="font-extrabold text-brandDark text-sm tracking-tight truncate pl-2">{doc.name}</span>
                            <div className="bg-white border border-zinc-200 p-2 rounded-xl shrink-0 shadow-sm"><FileText size={16} className="text-brandDark"/></div>
                          </button>
                        ))}
                        <div className="flex items-center justify-center gap-1.5 text-[9px] text-emerald-600 font-extrabold uppercase tracking-widest mt-3 bg-emerald-50 py-2 rounded-full border border-emerald-100 w-max mx-auto px-4">
                          <Unlock size={12} /><span>Unlocked (15m)</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
             </div>
          </div>

          <div className="flex justify-center pt-6 pb-2">
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
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[90] flex justify-center pointer-events-none px-4 pb-4 md:pb-8">
        <div className="w-full max-w-md pointer-events-auto bg-white/95 backdrop-blur-2xl border border-zinc-200 shadow-[0_-5px_40px_rgba(0,0,0,0.1)] p-3 rounded-3xl flex flex-col gap-2.5">
          
          {isPreview ? (
            <div className={`w-full flex items-center justify-center space-x-2 py-4 px-4 rounded-2xl font-extrabold text-base shadow-sm opacity-50 cursor-not-allowed ${profile.isLost ? 'bg-red-600 text-white' : 'bg-brandDark text-white'}`}>
              <Phone size={20} />
              <span className="truncate">{profile.isLost ? `CALL IMMEDIATELY` : `Call ${primaryContact?.name || 'Guardian'}`}</span>
            </div>
          ) : (
            <a href={`tel:${primaryContact?.countryCode || ''}${primaryContact?.phone || ''}`} onClick={() => unlockVault()} className={`w-full flex items-center justify-center space-x-3 py-4 px-4 rounded-2xl font-black text-[1.1rem] shadow-sm transition-all active:scale-[0.98] ${profile.isLost ? 'bg-red-600 text-white animate-[pulse_1.5s_ease-in-out_infinite] border-2 border-red-400' : 'bg-brandDark text-white hover:bg-brandAccent'}`}>
              <Phone size={22} fill={profile.isLost ? "currentColor" : "none"} />
              <span className="truncate">{profile.isLost ? `CALL ${(primaryContact?.name || 'GUARDIAN').toUpperCase()} IMMEDIATELY` : `Call ${primaryContact?.name || 'Guardian'}`}</span>
            </a>
          )}

          <div className="flex gap-2.5">
            {isPreview ? (
              <div className="flex-1 flex items-center justify-center space-x-2 bg-zinc-100 text-zinc-400 py-3.5 px-4 rounded-xl font-extrabold border border-zinc-200 opacity-50 cursor-not-allowed">
                <MapPin size={18} className="shrink-0" />
                <span className="text-sm truncate tracking-tight">Navigate Home</span>
              </div>
            ) : (
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center space-x-2 bg-zinc-50 text-brandDark py-3.5 px-4 rounded-xl font-extrabold border border-zinc-200 hover:bg-white hover:shadow-sm transition-colors active:scale-[0.98]">
                <MapPin size={18} className="shrink-0" />
                <span className="text-sm truncate tracking-tight">Navigate Home</span>
              </a>
            )}

            {isPreview ? (
              <div className="w-24 shrink-0 flex flex-col items-center justify-center bg-brandGold/5 text-brandGold py-1.5 px-2 rounded-xl border border-brandGold/20 opacity-50 cursor-not-allowed">
                <AlertTriangle size={18} className="mb-0.5" />
                <span className="text-[9px] text-center leading-tight tracking-widest uppercase font-extrabold">{helplineText}</span>
              </div>
            ) : (
              <a href={`tel:${helplineNumber}`} className="w-24 shrink-0 flex flex-col items-center justify-center bg-brandGold/5 text-brandGold py-1.5 px-2 rounded-xl border border-brandGold/20 hover:bg-brandGold/10 transition-colors active:scale-[0.98] shadow-sm">
                <AlertTriangle size={18} className="mb-0.5" />
                <span className="text-[9px] text-center leading-tight tracking-widest uppercase font-extrabold">{helplineText}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isImageEnlarged && !isPreview && (
        <div className="fixed inset-0 z-[200] bg-zinc-950/90 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <button onClick={() => setIsImageEnlarged(false)} className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition z-[210] border border-white/10">
            <X size={24} />
          </button>
          <img 
            src={profile.imageUrl} 
            alt={profile.name} 
            onContextMenu={(e) => e.preventDefault()} 
            draggable="false" 
            className="max-w-full max-h-[85vh] object-contain rounded-[2rem] shadow-2xl relative z-[205] border border-white/10" 
          />
        </div>
      )}

      {viewingDocument && !isPreview && (
        <div className="fixed inset-0 z-[200] bg-zinc-950/90 flex flex-col items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="absolute top-4 w-full max-w-md mx-auto px-6 flex justify-between items-center z-[210]">
             <div className="flex items-center gap-3 bg-black/50 border border-white/10 backdrop-blur-md px-4 py-2 rounded-full">
               <FileText size={16} className="text-brandGold" />
               <h3 className="text-white font-extrabold tracking-tight truncate max-w-[200px] text-sm">{viewingDocument.name}</h3>
             </div>
             <button onClick={() => setViewingDocument(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition shrink-0 border border-white/10">
               <X size={20} />
             </button>
          </div>
          <div className="w-full max-w-md mx-auto h-full flex items-center justify-center pt-20 pb-6">
            {viewingDocument.url?.toLowerCase().includes('.doc') ? (
              <div className="w-full h-full max-h-[80vh] rounded-[2rem] shadow-2xl relative z-[205] bg-white overflow-hidden border border-white/10">
                <iframe 
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(viewingDocument.url)}&embedded=true`} 
                  className="w-full h-full border-0" 
                />
              </div>
            ) : (
              <img 
                src={viewingDocument.url?.toLowerCase().includes('.pdf') ? viewingDocument.url.replace(/\.pdf/i, '.jpg') : viewingDocument.url} 
                alt={viewingDocument.name} 
                onContextMenu={(e) => e.preventDefault()} 
                draggable="false" 
                className="max-w-full max-h-[80vh] object-contain rounded-[2rem] shadow-2xl relative z-[205] border border-white/10" 
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
    <div className="min-h-[100dvh] bg-[#fafafa] flex flex-col items-center md:py-8 font-sans">
      <div className="max-w-md w-full relative bg-white md:rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-zinc-200 overflow-hidden flex flex-col min-h-[100dvh] md:min-h-0">
        <div className="h-[45vh] md:h-[350px] w-full bg-zinc-200 animate-pulse"></div>
        <div className="flex-1 bg-white -mt-10 rounded-t-[2.5rem] p-8 z-10 space-y-8 relative">
          <div className="flex flex-col items-center space-y-3 border-b border-zinc-100 pb-6">
            <div className="h-10 w-3/4 bg-zinc-200 animate-pulse rounded-xl"></div>
            <div className="h-6 w-1/2 bg-zinc-100 animate-pulse rounded-full"></div>
          </div>
          <div className="bg-zinc-50 rounded-[2rem] h-40 border border-zinc-100 animate-pulse"></div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-zinc-50 p-5 rounded-2xl h-20 border border-zinc-100 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
