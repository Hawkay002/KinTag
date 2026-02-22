import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { Plus, LogOut, QrCode, User, PawPrint, Trash2, Edit, Download, X, Eye } from 'lucide-react';

export default function Dashboard() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModalProfile, setQrModalProfile] = useState(null); 
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

  const handleDelete = async (profileId, imageUrl) => {
    if (window.confirm("Are you sure you want to completely delete this ID card? This action cannot be undone.")) {
      try {
        const publicId = extractPublicId(imageUrl);
        if (publicId) {
          await fetch('/api/delete-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId }),
          });
        }
        await deleteDoc(doc(db, "profiles", profileId));
        setProfiles(profiles.filter(p => p.id !== profileId)); 
      } catch (error) {
        console.error("Error deleting profile:", error);
        alert("Failed to delete profile.");
      }
    }
  };

  const downloadQR = (name) => {
    const canvas = document.getElementById("qr-canvas-modal");
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${name}_SafeID_QR.png`;
    downloadLink.click();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 font-bold text-zinc-500">Loading your dashboard...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8 relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl shadow-sm border border-zinc-100">
          <div>
            <h1 className="text-2xl font-extrabold text-brandDark tracking-tight">My Family</h1>
            <p className="text-sm text-zinc-500 font-medium truncate max-w-[200px] md:max-w-full">{currentUser?.email}</p>
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

        {profiles.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-3xl border border-dashed border-zinc-300">
            <div className="w-16 h-16 bg-brandMuted text-brandDark rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode size={28} />
            </div>
            <h2 className="text-xl font-bold text-brandDark mb-2 tracking-tight">No Profiles Yet</h2>
            <p className="text-zinc-500 mb-6 font-medium">Create your first digital contact card.</p>
            <Link to="/create" className="inline-flex items-center space-x-2 bg-brandDark text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-brandAccent transition-colors">
              <Plus size={18} />
              <span>Create New Card</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map(profile => (
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
                    <button onClick={() => handleDelete(profile.id, profile.imageUrl)} className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl transition-colors" title="Delete Profile">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl border border-zinc-100">
            <button onClick={() => setQrModalProfile(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-brandDark bg-brandMuted p-1.5 rounded-full transition-colors">
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-extrabold text-brandDark mb-1 tracking-tight">QR Code</h2>
            <p className="text-zinc-500 mb-6 text-sm font-medium">Scan to view {qrModalProfile.name}'s card.</p>
            
            <div className="flex justify-center mb-8">
              <div className="bg-white p-5 rounded-3xl shadow-premium border border-zinc-100 inline-block">
                <QRCodeCanvas 
                  id="qr-canvas-modal" 
                  value={`${window.location.origin}/#/id/${qrModalProfile.id}`} 
                  size={200} 
                  level="H" 
                  includeMargin={true} 
                  fgColor="#18181b" 
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
    </div>
  );
}
