import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Phone, MapPin, AlertTriangle, Droplet, Ruler, Users, Scale, User, PawPrint, Maximize2, X } from 'lucide-react';

export default function PublicCard() {
  const { profileId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);

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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 font-bold text-zinc-500">Retrieving secure identity...</div>;
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

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col max-w-md mx-auto shadow-2xl relative font-sans">
      
      {/* Hero Image */}
      <div className="relative h-[45vh] w-full shrink-0">
        <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brandDark/80 via-transparent to-transparent"></div>
        
        <button 
          onClick={() => setIsImageEnlarged(true)} 
          className="absolute top-4 right-4 bg-black/30 backdrop-blur-md border border-white/20 text-white p-2.5 rounded-full hover:bg-black/50 transition z-20"
          title="View Full Image"
        >
          <Maximize2 size={18} />
        </button>
      </div>
      
      {/* Main Content Card */}
      <div className="flex-1 bg-white -mt-10 rounded-t-[2.5rem] p-7 z-10 space-y-7 relative pb-48 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        
        <div className="text-center border-b border-zinc-100 pb-6">
          <h1 className="text-4xl font-extrabold text-brandDark mb-1.5 tracking-tight">{profile.name}</h1>
          <p className="text-sm text-brandGold font-bold uppercase tracking-widest">
            {profile.age} • {profile.typeSpecific}
          </p>
        </div>

        {/* Premium Vitals Grid - Monochromatic */}
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
            <span className="font-extrabold text-brandDark">{profile.height}</span>
          </div>
          <div className="bg-brandMuted p-4 rounded-2xl flex flex-col items-center text-center border border-zinc-200/50">
            <Scale className="text-zinc-700 mb-2.5" size={22} />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Weight</span>
            <span className="font-extrabold text-brandDark">{profile.weight}</span>
          </div>
        </div>

        {/* Contacts Section */}
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
      </div>

      {/* Premium Glassmorphism Sticky Bottom Actions */}
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

      {/* Full Screen Image Modal */}
      {isImageEnlarged && (
        <div className="fixed inset-0 z-[100] bg-brandDark/95 flex items-center justify-center p-4 backdrop-blur-lg">
          <button 
            onClick={() => setIsImageEnlarged(false)} 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition"
          >
            <X size={24} />
          </button>
          <img 
            src={profile.imageUrl} 
            alt={profile.name} 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" 
          />
        </div>
      )}
    </div>
  );
}
