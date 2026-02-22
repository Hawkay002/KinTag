import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Phone, MapPin, AlertTriangle, Droplet, Ruler, Users, Scale, User, PawPrint } from 'lucide-react';

export default function PublicCard() {
  const { profileId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-bold text-gray-500">Retrieving secure data...</div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-bold text-red-500">Profile not found.</div>;

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
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto shadow-2xl relative">
      <div className="relative h-[45vh] w-full shrink-0">
        <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>
      
      <div className="flex-1 bg-white -mt-10 rounded-t-3xl p-6 z-10 space-y-6 relative pb-48">
        <div className="text-center border-b border-gray-100 pb-6">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-1">{profile.name}</h1>
          <p className="text-lg text-safetyBlue font-bold capitalize">
            {profile.age} • {profile.typeSpecific}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center text-center">
            {profile.type === 'kid' ? <User className="text-blue-400 mb-2" size={24} /> : <PawPrint className="text-blue-400 mb-2" size={24}/>}
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Gender</span>
            <span className="font-bold text-gray-900">{profile.gender}</span>
          </div>
          <div className="bg-red-50 p-4 rounded-2xl flex flex-col items-center text-center">
            <Droplet className="text-red-400 mb-2" size={24} />
            <span className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">Blood Group</span>
            <span className="font-bold text-red-700">{profile.bloodGroup}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center text-center">
            <Ruler className="text-gray-400 mb-2" size={24} />
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Height</span>
            <span className="font-bold text-gray-900">{profile.height}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center text-center">
            <Scale className="text-gray-400 mb-2" size={24} />
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Weight</span>
            <span className="font-bold text-gray-900">{profile.weight}</span>
          </div>
        </div>

        <div className="bg-blue-50/50 p-5 rounded-2xl">
          <div className="flex items-center space-x-2 mb-4 text-safetyBlue">
            <Users size={20} />
            <h3 className="font-bold">Contact Persons</h3>
          </div>
          <div className="space-y-4">
            {displayContacts.map((contact) => (
              <div key={contact.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-blue-50">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900 font-bold text-sm">{contact.name}</p>
                    <span className="px-2 py-0.5 bg-blue-100 text-safetyBlue text-[10px] font-bold uppercase rounded-md">
                      {contact.tag === 'Other' ? contact.customTag : contact.tag}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs font-medium mt-0.5">{contact.phone}</p>
                </div>
                <a href={`tel:${contact.phone}`} className="bg-green-100 text-green-700 p-2.5 rounded-full hover:bg-green-200 transition">
                  <Phone size={18} fill="currentColor" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Smaller Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-md border-t border-gray-200 max-w-md mx-auto space-y-2 pb-6 shadow-[0_-8px_16px_rgba(0,0,0,0.05)] z-50">
        
        <a href={`tel:${primaryContact.phone}`} className="w-full flex items-center justify-center space-x-2 bg-safetyBlue text-white py-3 px-4 rounded-xl font-bold text-base shadow-md hover:bg-blue-600 transition-colors">
          <Phone size={20} />
          <span className="truncate">Call Emergency Contact ({primaryContact.name})</span>
        </a>

        <div className="flex gap-2">
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center space-x-1.5 bg-gray-900 text-white py-2.5 px-3 rounded-xl font-bold shadow-sm hover:bg-gray-800">
            <MapPin size={16} className="shrink-0" />
            <span className="text-xs truncate">Navigate to Parents House</span>
          </a>

          <a href={`tel:${helplineNumber}`} className="w-20 shrink-0 flex flex-col items-center justify-center bg-red-100 text-red-700 py-1.5 px-2 rounded-xl font-bold hover:bg-red-200">
            <AlertTriangle size={16} className="mb-0.5" />
            <span className="text-[9px] text-center leading-tight">{helplineText}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
