import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { Phone, MapPin, AlertTriangle, Droplet, Ruler, Users, Scale, User, PawPrint, Maximize2, X, Activity, Heart, BellRing, Loader2, CheckCircle2 } from 'lucide-react';

export default function PublicCard() {
  const { profileId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  
  // DYNAMIC ISLAND STATE
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  
  const passiveAlertSent = useRef(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [activeAlertSent, setActiveAlertSent] = useState(false);
  const [gpsError, setGpsError] = useState('');

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
      }
    };
    fetchProfile();
  }, [profileId]);

  useEffect(() => {
    const sendPassiveAlert = async () => {
      if (!profile || passiveAlertSent.current) return;
      passiveAlertSent.current = true; 
      
      try {
        const res = await fetch('https://ipapi.co/json/');
        const ipData = await res.json();
        const cityStr = ipData.city ? `${ipData.city}, ${ipData.region}` : 'an unknown location';
        
        await addDoc(collection(db, "scans"), {
          profileId: profileId,
          ownerId: profile.userId,
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
            title: `👀 ${profile.name}'s Tag Scanned!`,
            body: `Someone just viewed ${profile.name}'s digital ID near ${cityStr}.`,
            link: `https://kintag.vercel.app/#/?view=notifications` 
          })
        });
      } catch (error) {
        console.error("Passive alert failed silently:", error);
      }
    };

    const timer = setTimeout(() => {
      sendPassiveAlert();
    }, 1500);

    return () => clearTimeout(timer);
  }, [profile, profileId]);

  const handleActiveAlert = (e) => {
    e.stopPropagation(); // Stops dynamic island from instantly collapsing
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
          
          // 🌟 FIXED URL: Clean, official Google Maps coordinates link
          const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
          
          await addDoc(collection(db, "scans"), {
            profileId: profileId,
            ownerId: profile.userId,
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
              title: `📍 URGENT: ${profile.name} FOUND!`,
              body: `A Good Samaritan has shared their exact GPS location. TAP HERE to open details!`,
              link: `https://kintag.vercel.app/#/?view=notifications` 
            })
          });

          setActiveAlertSent(true);
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


  if (loading) return <PublicCardSkeleton />;
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 font-bold text-red-500">Identity not found.</div>;

  let displayContacts = profile.contacts || [
    { id: '1', name: profile.parent1Name, phone: profile.parent1Phone, tag: 'Mother' },
    ...(profile.parent2Name ? [{ id: '2', name: profile.parent2Name, phone: profile.parent2Phone, tag: 'Father' }] : [])
  ];

  const primaryContact = displayContacts.find(c => c.id === profile.primaryContactId) || displayContacts[0];
  const encodedAddress = encodeURIComponent(profile.address);
  
  // 🌟 FIXED URL: Official Google Maps Search string
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  
  const helplineNumber = profile.type === 'kid' ? '112' : '1962'; 
  const helplineText = profile.type === 'kid' ? 'National Emergency (112)' : 'Animal Helpline (1962)';

  const displayHeight = profile.heightUnit === 'ft' 
    ? `${profile.heightMain}'${profile.heightSub}"` 
    : (profile.heightMain ? `${profile.heightMain} cm` : profile.height);
    
  const displayWeight = profile.weightMain 
    ? `${profile.weightMain} ${profile.weightUnit}` 
    : profile.weight;

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col max-w-md mx-auto shadow-2xl relative font-sans">
      
      {/* 🌟 DYNAMIC ISLAND (Sticky Top Center) */}
      <div 
        onClick={() => !isIslandExpanded && setIsIslandExpanded(true)}
        className={`fixed top-4 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur-xl text-white rounded-[2rem] shadow-2xl z-[100] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden cursor-pointer ${isIslandExpanded ? 'w-11/12 max-w-sm p-6' : 'w-auto px-5 py-3 flex items-center justify-center gap-2 hover:bg-black'}`}
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
                  disabled={isSendingAlert}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-70"
                >
                  {isSendingAlert ? <Loader2 className="animate-spin" size={20} /> : <MapPin size={20} />}
                  <span>{isSendingAlert ? "Locating..." : `Share My Location`}</span>
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

      <div className="relative h-[45vh] w-full shrink-0">
        <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brandDark/80 via-transparent to-transparent"></div>
        
        <div className="absolute top-5 left-5 z-20 flex items-center space-x-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
          <img src="/kintag-logo.png" alt="KinTag Logo" className="w-6 h-6 rounded-md shadow-sm" />
          <span className="text-white font-bold text-sm tracking-tight drop-shadow-sm">KinTag</span>
        </div>

        <button onClick={() => setIsImageEnlarged(true)} className="absolute top-4 right-4 bg-black/30 backdrop-blur-md border border-white/20 text-white p-2.5 rounded-full hover:bg-black/50 transition z-20" title="View Full Image">
          <Maximize2 size={18} />
        </button>
      </div>
      
      <div className="flex-1 bg-white -mt-10 rounded-t-[2.5rem] p-7 z-10 space-y-7 relative pb-64 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        
        <div className="text-center border-b border-zinc-100 pb-6">
          <h1 className="text-4xl font-extrabold text-brandDark mb-1.5 tracking-tight">{profile.name}</h1>
          <p className="text-sm text-brandGold font-bold uppercase tracking-widest">
            {profile.age} Yrs • {profile.typeSpecific} {profile.type === 'kid' && profile.nationality ? `• ${profile.nationality}` : ''}
          </p>
        </div>

        {profile.allergies && profile.allergies.toLowerCase() !== 'none' && profile.allergies.toLowerCase() !== 'none known' && (
           <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start space-x-3">
             <Activity className="text-amber-600 shrink-0 mt-0.5" size={20} />
             <div>
               <h3 className="text-amber-800 font-extrabold text-xs uppercase tracking-widest mb-1">Medical Alert / Allergies</h3>
               <p className="text-amber-950 font-bold text-sm">{profile.allergies}</p>
             </div>
           </div>
        )}

        {profile.type === 'kid' && profile.specialNeeds && (
           <div className="bg-violet-50 border border-violet-100 p-4 rounded-2xl flex items-start space-x-3">
             <Heart className="text-violet-500 shrink-0 mt-0.5" size={20} />
             <div>
               <h3 className="text-violet-700 font-extrabold text-xs uppercase tracking-widest mb-1">Behavioral / Special Needs</h3>
               <p className="text-violet-900 font-bold text-sm">{profile.specialNeeds}</p>
             </div>
           </div>
        )}

        {profile.type === 'pet' && (
          <div className="bg-brandMuted p-5 rounded-3xl border border-zinc-200/50 space-y-3">
            <h3 className="font-extrabold text-brandDark tracking-tight flex items-center gap-2"><PawPrint size={18}/> Pet Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-zinc-100">
                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Temperament</span>
                 <p className={`text-sm font-extrabold ${profile.temperament !== 'Friendly' ? 'text-red-600' : 'text-brandDark'}`}>{profile.temperament}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-zinc-100">
                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Vaccination</span>
                 <p className="text-sm font-extrabold text-brandDark">{profile.vaccinationStatus}</p>
              </div>
              {profile.microchip && (
                <div className="bg-white p-3 rounded-xl border border-zinc-100 col-span-2 flex justify-between items-center">
                   <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Microchip ID</span>
                   <span className="text-sm font-extrabold text-brandDark font-mono">{profile.microchip}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-brandMuted p-4 rounded-2xl flex flex-col items-center text-center border border-zinc-200/50">
            {profile.type === 'kid' ? <User className="text-zinc-700 mb-2.5" size={22} /> : <PawPrint className="text-zinc-700 mb-2.5" size={22}/>}
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Gender</span>
            <span className="font-extrabold text-brandDark">{profile.gender}</span>
          </div>

          {profile.type === 'kid' && (
            <div className="bg-brandMuted p-4 rounded-2xl flex flex-col items-center text-center border border-zinc-200/50">
              <Droplet className="text-zinc-700 mb-2.5" size={22} />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Blood Group</span>
              <span className="font-extrabold text-brandDark">{profile.bloodGroup}</span>
            </div>
          )}

          <div className="bg-brandMuted p-4 rounded-2xl flex flex-col items-center text-center border border-zinc-200/50">
            <Ruler className="text-zinc-700 mb-2.5" size={22} />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Height</span>
            <span className="font-extrabold text-brandDark">{displayHeight}</span>
          </div>
          <div className="bg-brandMuted p-4 rounded-2xl flex flex-col items-center text-center border border-zinc-200/50">
            <Scale className="text-zinc-700 mb-2.5" size={22} />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Weight</span>
            <span className="font-extrabold text-brandDark">{displayWeight}</span>
          </div>
        </div>

        {(profile.policeStation || profile.pincode) && (
          <div className="bg-brandMuted p-5 rounded-3xl border border-zinc-200/50">
            <div className="flex items-center space-x-2 mb-3 text-brandDark">
              <MapPin size={18} />
              <h3 className="font-extrabold tracking-tight">Local Information</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-zinc-100">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Police Station</span>
                <span className="text-sm font-extrabold text-brandDark">{profile.policeStation || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-zinc-100">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Area Pincode</span>
                <span className="text-sm font-extrabold text-brandDark">{profile.pincode || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-zinc-50 p-5 rounded-3xl border border-zinc-200/60 mb-8">
          <div className="flex items-center space-x-2 mb-4 text-brandDark">
            <Users size={18} />
            <h3 className="font-extrabold tracking-tight">Authorized Guardians</h3>
          </div>
          <div className="space-y-3">
            {displayContacts.map((contact) => (
              <div key={contact.id} className="flex justify-between items-center bg-white p-3.5 rounded-2xl shadow-sm border border-zinc-100">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <p className="text-brandDark font-bold text-sm tracking-tight">{contact.name}</p>
                    <span className="px-2 py-0.5 bg-brandMuted border border-zinc-200 text-zinc-600 text-[9px] font-extrabold uppercase tracking-widest rounded-md">
                      {contact.tag === 'Other' ? contact.customTag : contact.tag}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs font-semibold mt-1 tracking-wide">{contact.phone}</p>
                </div>
                <a href={`tel:${contact.phone}`} className="bg-brandDark text-white p-3 rounded-full hover:bg-brandAccent transition shadow-sm">
                  <Phone size={16} fill="currentColor" />
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center pb-6">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm border border-zinc-200/50 px-4 py-2 rounded-full shadow-sm hover:bg-white transition-all group">
            <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider group-hover:text-brandGold transition-colors">Secured by</span>
            <div className="flex items-center space-x-1.5">
              <img src="/kintag-logo.png" className="w-4 h-4 rounded" alt="Logo" />
              <span className="text-brandDark font-extrabold text-xs tracking-tight">KinTag</span>
            </div>
          </a>
        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/85 backdrop-blur-xl border-t border-zinc-200 max-w-md mx-auto space-y-2 pb-8 shadow-[0_-15px_40px_rgba(0,0,0,0.08)] z-50">
        <a href={`tel:${primaryContact.phone}`} className="w-full flex items-center justify-center space-x-2 bg-brandDark text-white py-3.5 px-4 rounded-2xl font-bold text-base shadow-lg hover:bg-brandAccent transition-colors">
          <Phone size={20} />
          <span className="truncate">Call {primaryContact.name} (Emergency)</span>
        </a>
        <div className="flex gap-2">
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center space-x-1.5 bg-zinc-100 text-brandDark py-3 px-3 rounded-2xl font-extrabold shadow-sm border border-zinc-200 hover:bg-zinc-200 transition-colors">
            <MapPin size={16} className="shrink-0" />
            <span className="text-xs truncate tracking-tight">Navigate Home</span>
          </a>
          <a href={`tel:${helplineNumber}`} className="w-24 shrink-0 flex flex-col items-center justify-center bg-brandGold/10 text-brandGold py-1.5 px-2 rounded-2xl font-bold border border-brandGold/20 hover:bg-brandGold/20 transition-colors">
            <AlertTriangle size={16} className="mb-0.5" />
            <span className="text-[9px] text-center leading-tight tracking-wider uppercase">{helplineText}</span>
          </a>
        </div>
      </div>

      {isImageEnlarged && (
        <div className="fixed inset-0 z-[100] bg-brandDark/95 flex items-center justify-center p-4 backdrop-blur-lg">
          <button onClick={() => setIsImageEnlarged(false)} className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition">
            <X size={24} />
          </button>
          <img src={profile.imageUrl} alt={profile.name} className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}

function PublicCardSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden">
      <div className="h-[45vh] w-full bg-zinc-200 animate-pulse"></div>
      <div className="flex-1 bg-white -mt-10 rounded-t-[2.5rem] p-7 z-10 space-y-7 relative">
        <div className="flex flex-col items-center space-y-3 border-b border-zinc-100 pb-6">
          <div className="h-10 w-2/3 bg-zinc-200 animate-pulse rounded-xl"></div>
          <div className="h-4 w-1/3 bg-zinc-100 animate-pulse rounded-md"></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-zinc-50 p-4 rounded-2xl h-24 border border-zinc-100 animate-pulse flex flex-col items-center justify-center space-y-2">
              <div className="h-6 w-6 bg-zinc-200 rounded-full"></div>
              <div className="h-3 w-1/2 bg-zinc-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="bg-zinc-50 p-5 rounded-3xl h-48 border border-zinc-100 animate-pulse"></div>
      </div>
    </div>
  );
}
