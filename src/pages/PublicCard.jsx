import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Phone, MapPin, AlertTriangle, Droplet, Ruler, Users, Scale, User, PawPrint, Maximize2, X, Activity, Smartphone } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react'; // Needed for the digital pass generation

const QR_STYLES = {
  obsidian: { name: 'Classic Obsidian', fg: '#18181b', bg: '#ffffff', border: 'border-zinc-200' },
  bubblegum: { name: 'Bubblegum Pink', fg: '#db2777', bg: '#fdf2f8', border: 'border-pink-200' },
  ocean: { name: 'Ocean Blue', fg: '#0284c7', bg: '#f0f9ff', border: 'border-sky-200' },
  minty: { name: 'Minty Green', fg: '#0d9488', bg: '#f0fdfa', border: 'border-teal-200' },
  lavender: { name: 'Lavender Violet', fg: '#7c3aed', bg: '#f5f3ff', border: 'border-violet-200' },
  sunshine: { name: 'Sunshine Orange', fg: '#d97706', bg: '#fffbeb', border: 'border-amber-200' },
};

export default function PublicCard() {
  const { profileId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  const [showDigitalPass, setShowDigitalPass] = useState(false); // NEW

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

  // NEW: Render Skeleton Loader while fetching
  if (loading) return <PublicCardSkeleton />;
  
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 font-bold text-red-500">Identity not found.</div>;

  let displayContacts = profile.contacts || [
    { id: '1', name: profile.parent1Name, phone: profile.parent1Phone, tag: 'Mother' },
    ...(profile.parent2Name ? [{ id: '2', name: profile.parent2Name, phone: profile.parent2Phone, tag: 'Father' }] : [])
  ];

  const primaryContact = displayContacts.find(c => c.id === profile.primaryContactId) || displayContacts[0];
  const encodedAddress = encodeURIComponent(profile.address);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  const helplineNumber = profile.type === 'kid' ? '112' : '1962'; 
  const helplineText = profile.type === 'kid' ? 'National Emergency (112)' : 'Animal Helpline (1962)';

  const displayHeight = profile.heightUnit === 'ft' 
    ? `${profile.heightMain}'${profile.heightSub}"` 
    : (profile.heightMain ? `${profile.heightMain} cm` : profile.height);
    
  const displayWeight = profile.weightMain 
    ? `${profile.weightMain} ${profile.weightUnit}` 
    : profile.weight;

  const activeStyle = QR_STYLES[profile.qrStyle || 'obsidian'];

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col max-w-md mx-auto shadow-2xl relative font-sans">
      
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
      
      <div className="flex-1 bg-white -mt-10 rounded-t-[2.5rem] p-7 z-10 space-y-7 relative pb-52 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        
        <div className="text-center border-b border-zinc-100 pb-6">
          <h1 className="text-4xl font-extrabold text-brandDark mb-1.5 tracking-tight">{profile.name}</h1>
          <p className="text-sm text-brandGold font-bold uppercase tracking-widest">
            {profile.age} Yrs • {profile.typeSpecific} {profile.type === 'kid' && profile.nationality ? `• ${profile.nationality}` : ''}
          </p>
        </div>

        {profile.allergies && profile.allergies.toLowerCase() !== 'none' && profile.allergies.toLowerCase() !== 'none known' && (
           <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start space-x-3">
             <Activity className="text-red-500 shrink-0 mt-0.5" size={20} />
             <div>
               <h3 className="text-red-700 font-extrabold text-xs uppercase tracking-widest mb-1">Medical Alert / Allergies</h3>
               <p className="text-red-900 font-bold text-sm">{profile.allergies}</p>
             </div>
           </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-brandMuted p-4 rounded-2xl flex flex-col items-center text-center border border-zinc-200/50">
            {profile.type === 'kid' ? <User className="text-zinc-700 mb-2.5" size={22} /> : <PawPrint className="text-zinc-700 mb-2.5" size={22}/>}
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Gender</span>
            <span className="font-extrabold text-brandDark">{profile.gender}</span>
          </div>
          <div className="bg-brandMuted p-4 rounded-2xl flex flex-col items-center text-center border border-zinc-200/50">
            <Droplet className="text-zinc-700 mb-2.5" size={22} />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Blood Group</span>
            <span className="font-extrabold text-brandDark">{profile.bloodGroup}</span>
          </div>
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

        <div className="bg-zinc-50 p-5 rounded-3xl border border-zinc-200/60">
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

        {/* NEW: Save Digital ID Button */}
        <button onClick={() => setShowDigitalPass(true)} className="w-full mt-4 flex items-center justify-center space-x-2 bg-brandDark text-white p-4 rounded-xl font-bold shadow-md hover:bg-brandAccent transition-all">
          <Smartphone size={18} />
          <span>Save Mobile ID</span>
        </button>

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

      {/* NEW: Digital Pass Modal */}
      {showDigitalPass && (
        <div className="fixed inset-0 z-[100] bg-brandDark/95 flex items-center justify-center p-4 backdrop-blur-lg">
          <button onClick={() => setShowDigitalPass(false)} className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition z-10">
            <X size={24} />
          </button>
          
          <div className="max-w-xs w-full text-center">
            <p className="text-white mb-4 text-sm font-medium">Screenshot this pass and save it to your lockscreen or favorites.</p>
            
            <div className="bg-brandDark rounded-3xl overflow-hidden shadow-2xl relative border border-zinc-700 text-left mb-6 mx-auto w-full aspect-[9/16] flex flex-col">
              <div className="h-[40%] w-full relative shrink-0">
                <img src={profile.imageUrl} alt="Profile" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-brandDark via-brandDark/40 to-transparent"></div>
                <div className="absolute bottom-4 left-5 right-5">
                  <h3 className="text-2xl font-extrabold text-white tracking-tight">{profile.name}</h3>
                  <p className="text-brandGold text-xs font-bold uppercase tracking-widest">{profile.typeSpecific}</p>
                </div>
              </div>
              <div className="flex-1 bg-brandDark p-5 flex flex-col items-center justify-center">
                <div className={`bg-white p-4 rounded-3xl shadow-lg border-2 ${activeStyle.border}`}>
                  <QRCodeCanvas value={window.location.href} size={180} level="H" fgColor={activeStyle.fg} bgColor={activeStyle.bg} imageSettings={{ src: "/kintag-logo.png", height: 35, width: 35, excavate: true }} />
                </div>
                <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold mt-5">Scan in Emergency</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isImageEnlarged && !showDigitalPass && (
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

// NEW: Beautiful Skeleton Loader Component for Public View
function PublicCardSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden">
      {/* Image Skeleton */}
      <div className="h-[45vh] w-full bg-zinc-200 animate-pulse"></div>
      
      {/* Body Skeleton */}
      <div className="flex-1 bg-white -mt-10 rounded-t-[2.5rem] p-7 z-10 space-y-7 relative">
        {/* Title Area */}
        <div className="flex flex-col items-center space-y-3 border-b border-zinc-100 pb-6">
          <div className="h-10 w-2/3 bg-zinc-200 animate-pulse rounded-xl"></div>
          <div className="h-4 w-1/3 bg-zinc-100 animate-pulse rounded-md"></div>
        </div>
        
        {/* Grid Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-zinc-50 p-4 rounded-2xl h-24 border border-zinc-100 animate-pulse flex flex-col items-center justify-center space-y-2">
              <div className="h-6 w-6 bg-zinc-200 rounded-full"></div>
              <div className="h-3 w-1/2 bg-zinc-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Guardians Box */}
        <div className="bg-zinc-50 p-5 rounded-3xl h-48 border border-zinc-100 animate-pulse"></div>
      </div>
    </div>
  );
}
