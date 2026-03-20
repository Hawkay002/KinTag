import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import { User, ArrowLeft, CheckCircle2, Edit2, X, MapPin, Camera } from 'lucide-react'; 
import { AvatarPicker, avatars } from '../components/ui/avatar-picker'; 

export default function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const [isEditingZip, setIsEditingZip] = useState(false);
  const [editZipValue, setEditZipValue] = useState("");

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          setUserData({ name: '', zipCode: '', avatarId: 1 });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleSaveAvatar = async (avatarId) => {
    setProfileError(''); setProfileSuccess('');
    setAvatarLoading(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { avatarId });
      setUserData(prev => ({ ...prev, avatarId }));
      setProfileSuccess("Avatar updated successfully!");
    } catch (err) {
      setProfileError("Failed to update avatar.");
    } finally {
      setAvatarLoading(false);
      setShowAvatarModal(false);
    }
  };

  const handleSaveName = async () => {
    if (!editNameValue.trim()) return;
    setProfileError(''); setProfileSuccess('');
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { name: editNameValue.trim() });
      setUserData(prev => ({ ...prev, name: editNameValue.trim() }));
      setIsEditingName(false);
      setProfileSuccess("Name updated successfully!");
    } catch (err) {
      setProfileError("Failed to update name.");
    }
  };

  const handleSaveZipCode = async () => {
    if (!editZipValue.trim()) return;
    setProfileError(''); setProfileSuccess('');
    try {
      const formattedZip = editZipValue.replace(/\s+/g, '').toUpperCase();
      await updateDoc(doc(db, "users", auth.currentUser.uid), { zipCode: formattedZip });
      setUserData(prev => ({ ...prev, zipCode: formattedZip }));
      setIsEditingZip(false);
      setProfileSuccess("Zip Code updated successfully! You will now receive local KinAlerts.");
    } catch (err) {
      setProfileError("Failed to update Zip Code.");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-bold text-zinc-500">Loading Profile...</div>;

  const currentAvatar = avatars.find(a => a.id === userData?.avatarId) || null;

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] p-4 md:p-8 relative pb-24 selection:bg-brandGold selection:text-white">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-brandGold/10 via-emerald-400/5 to-transparent rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="max-w-2xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4">
        
        <button onClick={() => navigate('/dashboard')} className="group flex items-center space-x-2 bg-white/60 backdrop-blur-md border border-zinc-200 text-zinc-600 px-5 py-2.5 rounded-full font-bold shadow-sm hover:shadow-md hover:bg-white transition-all mb-8 active:scale-95">
          <ArrowLeft size={18} className="transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        {/* MAIN PROFILE CARD */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-200/80 p-8 md:p-10 mb-8 text-center relative overflow-hidden group">
          
          <div 
            onClick={() => setShowAvatarModal(true)}
            className="w-28 h-28 bg-white border-[4px] border-white shadow-xl text-zinc-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative mt-8 md:mt-0 group-hover:scale-105 transition-all duration-500 cursor-pointer overflow-hidden group/avatar"
          >
            {currentAvatar ? (
              <div className="w-full h-full bg-zinc-50 p-2">
                {currentAvatar.svg}
              </div>
            ) : (
              <div className="w-full h-full bg-zinc-50 flex items-center justify-center">
                 <User size={48} />
              </div>
            )}
            
            <div className="absolute inset-0 bg-brandDark/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-[2px]">
               <Camera size={28} className="text-white" />
            </div>

            {!userData?.zipCode && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 border-[3px] border-white rounded-full animate-pulse z-10" title="Missing Zip Code"></span>}
          </div>

          <div className="flex flex-col items-center justify-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              {isEditingName ? (
                <div className="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-full border border-zinc-200 shadow-sm">
                  <input type="text" defaultValue={userData?.name || ''} onChange={(e) => setEditNameValue(e.target.value)} className="w-40 px-4 py-2 bg-transparent outline-none font-bold text-center text-brandDark" autoFocus/>
                  <button onClick={handleSaveName} className="bg-brandDark text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-brandAccent transition shadow-sm">Save</button>
                  <button onClick={() => setIsEditingName(false)} className="text-zinc-400 hover:text-zinc-600 bg-white p-2 rounded-full border border-zinc-200 transition shadow-sm"><X size={16}/></button>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-brandDark tracking-tight">{userData?.name || 'Guardian'}</h1>
                  <button onClick={() => { setEditNameValue(userData?.name || ''); setIsEditingName(true); }} className="text-zinc-400 hover:text-brandGold transition-colors bg-zinc-50 p-2 rounded-full border border-zinc-200 shadow-sm" title="Edit Name"><Edit2 size={16} /></button>
                </>
              )}
            </div>
            <p className="text-zinc-500 font-medium bg-zinc-50 px-4 py-1.5 rounded-full border border-zinc-200 shadow-sm">{auth.currentUser?.email}</p>
          </div>

          <div className="max-w-sm mx-auto bg-zinc-50 p-5 rounded-[2rem] border border-zinc-200 relative mt-8 shadow-inner">
            <div className="flex items-center justify-center gap-2 mb-2 text-brandDark font-bold">
              <MapPin size={18} className="text-brandGold" />
              <span>Broadcast Zip Code</span>
            </div>
            <p className="text-sm text-zinc-500 mb-4 px-2 font-medium">Set your local Zip Code to receive community KinAlerts in your area.</p>
            
            {isEditingZip ? (
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-full border border-zinc-200 shadow-sm">
                <input type="text" placeholder="Enter Zip" defaultValue={userData?.zipCode || ''} onChange={(e) => setEditZipValue(e.target.value)} className="w-full px-4 py-2 bg-transparent outline-none font-bold text-center" autoFocus/>
                <button onClick={handleSaveZipCode} className="bg-brandDark text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-brandAccent transition shadow-sm">Save</button>
                <button onClick={() => setIsEditingZip(false)} className="text-zinc-400 hover:text-zinc-600 bg-zinc-50 p-2 rounded-full border border-zinc-200 transition shadow-sm"><X size={16}/></button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button onClick={() => { setEditZipValue(userData?.zipCode || ''); setIsEditingZip(true); }} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-sm hover:shadow-md relative active:scale-95 ${userData?.zipCode ? 'bg-white border border-zinc-200 text-brandDark hover:-translate-y-0.5' : 'bg-red-50 border border-red-200 text-red-600 hover:-translate-y-0.5'}`}>
                  {userData?.zipCode ? <span className="text-lg">{userData.zipCode}</span> : <span>Setup Zip Code Now</span>}
                  <Edit2 size={16} />
                  {!userData?.zipCode && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>}
                </button>
              </div>
            )}
          </div>
          {profileError && <div className="mt-6 mx-auto max-w-sm p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100">{profileError}</div>}
          {profileSuccess && <div className="mt-6 mx-auto max-w-sm p-4 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-2xl border border-emerald-100 flex items-center justify-center gap-2"><CheckCircle2 size={18} /> {profileSuccess}</div>}
        </div>

        {/* AVATAR PICKER MODAL */}
        {showAvatarModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md overflow-y-auto">
            <AvatarPicker 
              currentAvatarId={userData?.avatarId} 
              onSave={handleSaveAvatar} 
              onCancel={() => setShowAvatarModal(false)}
              isSaving={avatarLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
