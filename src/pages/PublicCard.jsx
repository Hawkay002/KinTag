import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Phone, MapPin, AlertTriangle, Droplet, Ruler, Users } from 'lucide-react';

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-bold text-gray-500">Retrieving secure data...</div>;
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-bold text-red-500">Profile not found or has been removed.</div>;
  }

  // --- Dynamic Action Logic ---
  
  // 1. Determine which parent's phone number to use for the primary CTA
  const primaryPhone = profile.primaryEmergencyContact === 'parent2' && profile.parent2Phone 
    ? profile.parent2Phone 
    : profile.parent1Phone;
    
  const primaryName = profile.primaryEmergencyContact === 'parent2' && profile.parent2Name 
    ? profile.parent2Name 
    : profile.parent1Name;

  // 2. Google Maps Universal Navigation Link
  const encodedAddress = encodeURIComponent(profile.address);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

  // 3. Set standard helplines based on profile type
  const helplineNumber = profile.type === 'kid' ? '112' : '1962'; 
  const helplineText = profile.type === 'kid' ? 'National Emergency (112)' : 'Animal Helpline (1962)';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto shadow-2xl relative">
      
      {/* Big Hero Image */}
      <div className="relative h-[45vh] w-full shrink-0">
        <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>
      
      {/* Content Container - CHANGED pb-24 to pb-48 to add scroll clearance for sticky buttons */}
      <div className="flex-1 bg-white -mt-10 rounded-t-3xl p-6 z-10 space-y-6 relative pb-48">
        
        {/* Header */}
        <div className="text-center border-b border-gray-100 pb-6">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-1">{profile.name}</h1>
          <p className="text-lg text-safetyBlue font-bold capitalize">
            {profile.age} • {profile.typeSpecific}
          </p>
        </div>

        {/* Vital Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
            <Ruler className="text-gray-400 mb-2" size={24} />
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Height / Weight</span>
            <span className="font-bold text-gray-900">{profile.heightWeight}</span>
          </div>
          
          <div className="bg-red-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
            <Droplet className="text-red-400 mb-2" size={24} />
            <span className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">Blood Group</span>
            <span className="font-bold text-red-700">{profile.bloodGroup}</span>
          </div>
        </div>

        {/* Parents/Owners List */}
        <div className="bg-blue-50/50 p-5 rounded-2xl">
          <div className="flex items-center space-x-2 mb-3 text-safetyBlue">
            <Users size={20} />
            <h3 className="font-bold">Contact Persons</h3>
          </div>
          <div className="space-y-2">
            <p className="text-gray-900 font-semibold text-sm">
              <span className="text-gray-500 font-normal">1. </span>{profile.parent1Name}
            </p>
            {profile.parent2Name && (
              <p className="text-gray-900 font-semibold text-sm">
                <span className="text-gray-500 font-normal">2. </span>{profile.parent2Name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons (Sticky at bottom on mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 max-w-md mx-auto space-y-3 pb-8 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-50">
        
        {/* Primary Action: Call Main Contact */}
        <a href={`tel:${primaryPhone}`} className="w-full flex items-center justify-center space-x-3 bg-safetyBlue text-white p-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-600 transition-colors">
          <Phone size={24} />
          <span>Call {primaryName}</span>
        </a>

        <div className="flex gap-3">
          {/* Secondary Action: Route to Safety */}
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center space-x-2 bg-gray-900 text-white p-4 rounded-2xl font-bold shadow-md hover:bg-gray-800">
            <MapPin size={20} />
            <span>Navigate</span>
          </a>

          {/* Tertiary Action: National Helpline */}
          <a href={`tel:${helplineNumber}`} className="flex-1 flex flex-col items-center justify-center bg-red-100 text-red-700 p-2 rounded-2xl font-bold hover:bg-red-200">
            <AlertTriangle size={18} className="mb-1" />
            <span className="text-xs text-center leading-tight">{helplineText}</span>
          </a>
        </div>
      </div>
        
    </div>
  );
}
