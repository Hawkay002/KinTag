import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { Plus, LogOut, QrCode, User, PawPrint, Trash2, Edit, Download, X, Eye, Search, AlertOctagon } from 'lucide-react';

export default function Dashboard() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModalProfile, setQrModalProfile] = useState(null); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [profileToDelete, setProfileToDelete] = useState(null); 
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!currentUser) return;
      try {
        const q = query(collection(db, "profiles"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        const fetchedProfiles = [];
        querySnapshot.forEach((doc) => {
          fetchedProfiles.push({ id: doc.id, ...doc.data() });
        });
        fetchedProfiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setProfiles(fetchedProfiles);
      } catch (error) {
        console.error("Error fetching profiles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, [currentUser]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const extractPublicId = (url) => {
    if (!url || url.includes('placehold.co')) return null;
    const regex = /\/v\d+\/([^\.]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const confirmDelete = async () => {
    if (!profileToDelete) return;
    try {
      const publicId = extractPublicId(profileToDelete.imageUrl);
      if (publicId) {
        await fetch('/api/delete-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId }),
        });
      }
      await deleteDoc(doc(db, "profiles", profileToDelete.id));
      setProfiles(profiles.filter(p => p.id !== profileToDelete.id)); 
    } catch (error) {
      console.error("Error deleting profile:", error);
      alert("Failed to delete profile.");
    } finally {
      setProfileToDelete(null); 
    }
  };

  const downloadQR = (name) => {
    const canvas = document.getElementById("qr-canvas-modal");
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${name}_KinTag_QR.png`; 
    downloadLink.click();
  };

  const filteredProfiles = profiles.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 font-bold text-zinc-500">Loading your dashboard...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8 relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 bg-white p-5 rounded-3xl shadow-sm border border-zinc-100">
          <div className="flex items-center space-x-3">
            {/* NEW: Logo in Dashboard Header */}
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-10 h-10 rounded-xl shadow-sm" />
            <div>
              <h1 className="text-2xl font-extrabold text-brandDark tracking-tight">KinTags</h1>
              <p className="text-sm text-zinc-500 font-medium truncate max-w-[200px] md:max-w-full">{currentUser?.email}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button onClick={handleLogout} className="flex items-center space-x-2 text-zinc-500 hover:text-brandDark bg-brandMuted hover:bg-zinc-200 px-4 py-2.5 rounded-xl transition-all font-bold text-sm">
              <LogOut size={16} />
              <span className="hidden md:inline">Log Out</span>
            </button>
            <Link to="/create" className="flex items-center space-x-2 bg-brandDark text-white px-5 py-2.5 rounded-xl hover:bg-brandAccent transition-all font-bold text-sm shadow-md">
              <Plus size={18} />
              <span className="hidden md:inline">Add Profile</span>
            </Link>
          </div>
        </div>

        {profiles.length > 0 && (
          <div className="mb-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input 
              type="text" 
              placeholder="Search profiles by name..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all shadow-sm font-medium text-brandDark"
            />
          </div>
        )}

        {profiles.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-3xl border border-dashed border-zinc-300">
            <div className="w-16 h-16 bg-brandMuted text-brandDark rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode size={28} />
            </div>
            <h2 className="text-xl font-bold text-brandDark mb-2 tracking-tight">No Profiles Yet</h2>
            <p className="text-zinc-500 mb-6 font-medium">Create your first digital contact card.</p>
            <Link to="/create" className="inline-flex items-center space-x-2 bg-brandDark text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-brandAccent transition-colors">
              <Plus size={18} />
              <span>Create New KinTag</span>
            </Link>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 font-medium">No profiles match your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map(profile => (
              <div key={profile.id} className="bg-white rounded-3xl overflow-hidden shadow-premium border border-zinc-100 transition-all hover:-translate-y-1">
                <div className="relative h-48">
                  <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brandDark/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-extrabold tracking-tight">{profile.name}</h3>
                    <p className="text-sm text-zinc-200 font-medium capitalize flex items-center gap-1.5 mt-0.5">
                      {profile.type === 'kid' ? <User size={12} /> : <PawPrint size={12} />}
                      {profile.type} • {profile.age} • {profile.gender}
                    </p>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex gap-2">
                    <Link to={`/id/${profile.id}`} target="_blank" className="flex-1 flex items-center justify-center space-x-1.5 bg-brandMuted hover:bg-zinc-200 text-brandDark py-2.5 rounded-xl font-bold text-sm transition-colors" title="View Public Card">
                      <Eye size={16} />
                      <span>View</span>
                    </Link>
                    <button onClick={() => setQrModalProfile(profile)} className="bg-amber-50 hover:bg-amber-100 text-brandGold p-2.5 rounded-xl transition-colors" title="Download QR">
                      <QrCode size={18} />
                    </button>
                    <Link to={`/edit/${profile.id}`} className="bg-brandMuted hover:bg-zinc-200 text-brandDark p-2.5 rounded-xl transition-colors" title="Edit Profile">
                      <Edit size={18} />
                    </Link>
                    <button onClick={() => setProfileToDelete({ id: profile.id, imageUrl: profile.imageUrl })} className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl transition-colors" title="Delete Profile">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {qrModalProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl border border-zinc-100">
            <button onClick={() => setQrModalProfile(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-brandDark bg-brandMuted p-1.5 rounded-full transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-extrabold text-brandDark mb-1 tracking-tight">KinTag QR</h2>
            <p className="text-zinc-500 mb-6 text-sm font-medium">Scan to view {qrModalProfile.name}'s card.</p>
            <div className="flex justify-center mb-8">
              <div className="bg-white p-5 rounded-3xl shadow-premium border border-zinc-100 inline-block">
                {/* NEW: QR Code with Center Logo */}
                <QRCodeCanvas 
                  id="qr-canvas-modal" 
                  value={`${window.location.origin}/#/id/${qrModalProfile.id}`} 
                  size={220} 
                  level="H" 
                  includeMargin={true} 
                  fgColor="#18181b"
                  imageSettings={{
                    src: "/kintag-logo.png",
                    height: 45,
                    width: 45,
                    excavate: true,
                  }}
                />
              </div>
            </div>
            <button onClick={() => downloadQR(qrModalProfile.name)} className="w-full flex items-center justify-center space-x-2 bg-brandDark text-white p-4 rounded-xl font-bold shadow-md hover:bg-brandAccent transition-all">
              <Download size={18} />
              <span>Download Image</span>
            </button>
          </div>
        </div>
      )}

      {profileToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-100">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertOctagon size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-brandDark mb-2 tracking-tight">Delete Profile?</h2>
            <p className="text-zinc-500 mb-8 text-sm font-medium">This action cannot be undone. This profile and its associated QR code will be permanently deactivated.</p>
            
            <div className="flex gap-3">
              <button onClick={() => setProfileToDelete(null)} className="flex-1 bg-brandMuted text-brandDark py-3.5 rounded-xl font-bold hover:bg-zinc-200 transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
