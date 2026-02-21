import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Phone, MapPin, AlertTriangle } from 'lucide-react';

export default function PublicCard() {
  const { profileId } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, "profiles", profileId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    };
    fetchProfile();
  }, [profileId]);

  if (!profile) return <div className="p-10 text-center font-bold">Loading secure profile...</div>;

  // Formats address for Google Maps Universal Link (routes from current location automatically)
  const encodedAddress = encodeURIComponent(profile.address);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  const helplineNumber = profile.type === 'kid' ? '911' : '311'; // Update to local helpline if needed

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Big Hero Image */}
      <img src={profile.imageUrl} alt={profile.name} className="w-full h-80 object-cover" />
      
      <div className="flex-1 bg-white -mt-6 rounded-t-3xl p-6 shadow-lg z-10 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">{profile.name}</h1>
          <p className="text-lg text-gray-500 font-medium capitalize">{profile.age} • {profile.typeSpecific}</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-4">
          {/* Primary Action: Call Parent */}
          <a href={`tel:${profile.parentPhone}`} className="w-full flex items-center justify-center space-x-2 bg-safetyBlue text-white p-4 rounded-xl font-bold text-lg shadow-md">
            <Phone size={24} />
            <span>Call Emergency Contact</span>
          </a>

          {/* Location Action: Navigate via Google Maps */}
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center space-x-2 bg-gray-800 text-white p-4 rounded-xl font-bold text-lg shadow-md">
            <MapPin size={24} />
            <span>Navigate to Parent</span>
          </a>

          {/* Secondary Action: Helpline */}
          <a href={`tel:${helplineNumber}`} className="w-full flex items-center justify-center space-x-2 bg-red-100 text-red-700 p-4 rounded-xl font-bold text-lg">
            <AlertTriangle size={24} />
            <span>Call Helpline ({helplineNumber})</span>
          </a>
        </div>
      </div>
    </div>
  );
}
