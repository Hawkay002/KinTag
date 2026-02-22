import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { Plus, LogOut, QrCode, User, PawPrint, Trash2, Edit, Download, X } from 'lucide-react';

export default function Dashboard() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModalProfile, setQrModalProfile] = useState(null); // State for the new QR Modal
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

  // --- NEW: Download QR Code Function ---
  const downloadQR = (name) => {
    const canvas = document.getElementById("qr-canvas-modal");
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${name}_SafeID_QR.png`;
    downloadLink.click();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 font-bold text-gray-500">Loading your dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">My Family</h1>
            <p className="text-sm text-gray-500 truncate max-w-[200px] md:max-w-full">{currentUser?.email}</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={handleLogout} className="flex items-center space-x-2 text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 px-4 py-2 rounded-xl transition-all font-semibold">
              <LogOut size={18} />
              <span className="hidden md:inline">Log Out</span>
            </button>
            <Link to="/create" className="flex items-center space-x-2 bg-safetyBlue text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-all font-semibold shadow-sm">
              <Plus size={18} />
              <span className="hidden md:inline">Add Profile</span>
            </Link>
          </div>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-3xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-blue-50 text-safetyBlue rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Profiles Yet</h2>
            <p className="text-gray-500 mb-6">Create your first digital contact card.</p>
            <Link to="/create" className="inline-flex items-center space-x-2 bg-safetyBlue text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-600">
              <Plus size={20} />
              <span>Create New Card</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map(profile => (
              <div key={profile.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <img src={profile.imageUrl} alt={profile.name} className="w-full h-48 object-cover" />
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
                      <p className="text-sm text-gray-500 capitalize flex items-center gap-1">
                        {profile.type === 'kid' ? <User size={14} /> : <PawPrint size={14} />}
                        {profile.type} • {profile.age} • {profile.gender}
                      </p>
                    </div>
                  </div>
                  
                  {/* Updated Actions Bar */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                    <Link to={`/id/${profile.id}`} target="_blank" className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center">
                      View
                    </Link>
                    <button onClick={() => setQrModalProfile(profile)} className="bg-purple-50 hover:bg-purple-100 text-purple-600 p-2.5 rounded-xl transition-colors" title="View QR Code">
                      <QrCode size={20} />
                    </button>
                    <Link to={`/edit/${profile.id}`} className="bg-blue-50 hover:bg-blue-100 text-safetyBlue p-2.5 rounded-xl transition-colors" title="Edit Profile">
                      <Edit size={20} />
                    </Link>
                    <button onClick={() => handleDelete(profile.id, profile.imageUrl)} className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl transition-colors" title="Delete Profile">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW: QR Code Viewer & Downloader Modal */}
      {qrModalProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl">
            <button onClick={() => setQrModalProfile(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-100 p-1.5 rounded-full transition-colors">
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">QR Code</h2>
            <p className="text-gray-500 mb-6 text-sm">Scan to view {qrModalProfile.name}'s card.</p>
            
            <div className="flex justify-center mb-8">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 inline-block">
                <QRCodeCanvas 
                  id="qr-canvas-modal" 
                  value={`${window.location.origin}/#/id/${qrModalProfile.id}`} 
                  size={200} 
                  level="H" 
                  includeMargin={true} 
                />
              </div>
            </div>
            
            <button onClick={() => downloadQR(qrModalProfile.name)} className="w-full flex items-center justify-center space-x-2 bg-safetyBlue text-white p-4 rounded-xl font-bold shadow-md hover:bg-blue-600 transition-all">
              <Download size={20} />
              <span>Download Image</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
