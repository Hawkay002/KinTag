import { useState, useEffect, useRef } from 'react';
import { db, auth, messaging } from '../firebase'; 
// 🌟 NEW: Added onSnapshot for real-time database streaming
import { collection, query, where, getDocs, getDoc, doc, deleteDoc, setDoc, onSnapshot } from 'firebase/firestore'; 
import { getToken } from 'firebase/messaging'; 
import { signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { Plus, LogOut, QrCode, User, PawPrint, Trash2, Edit, Download, X, Eye, Search, AlertOctagon, Smartphone, Loader2, BellRing, Bell, MapPin, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

const QR_STYLES = {
  obsidian: { name: 'Classic Obsidian', fg: '#18181b', bg: '#ffffff', border: 'border-zinc-200', hexBorder: '#e4e4e7' },
  bubblegum: { name: 'Bubblegum Pink', fg: '#db2777', bg: '#fdf2f8', border: 'border-pink-200', hexBorder: '#fbcfe8' },
  ocean: { name: 'Ocean Blue', fg: '#0284c7', bg: '#f0f9ff', border: 'border-sky-200', hexBorder: '#bae6fd' },
  minty: { name: 'Minty Green', fg: '#0d9488', bg: '#f0fdfa', border: 'border-teal-200', hexBorder: '#99f6e4' },
  lavender: { name: 'Lavender Violet', fg: '#7c3aed', bg: '#f5f3ff', border: 'border-violet-200', hexBorder: '#ddd6fe' },
  sunshine: { name: 'Sunshine Orange', fg: '#d97706', bg: '#fffbeb', border: 'border-amber-200', hexBorder: '#fde68a' },
};

const getTime = (ts) => ts?.toDate ? ts.toDate().getTime() : new Date(ts || 0).getTime();
const getISO = (ts) => ts?.toDate ? ts.toDate().toISOString() : new Date(ts || 0).toISOString();

export default function Dashboard() {
  const [profiles, setProfiles] = useState([]);
  const [scans, setScans] = useState([]);
  const [systemMessages, setSystemMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModalProfile, setQrModalProfile] = useState(null); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [profileToDelete, setProfileToDelete] = useState(null); 
  const [downloading, setDownloading] = useState(false);
  
  const [scanToDelete, setScanToDelete] = useState(null);
  
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [showSoftAskModal, setShowSoftAskModal] = useState(false);
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [notifTab, setNotifTab] = useState('personal'); 

  const [customAlert, setCustomAlert] = useState({ isOpen: false, title: '', message: '', type: 'info', onClose: null });

  const [lastViewedPersonal, setLastViewedPersonal] = useState(null);
  const [lastViewedSystem, setLastViewedSystem] = useState(null);

  const isInitialScansLoad = useRef(true);
  const isInitialSysLoad = useRef(true);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const playChime = () => {
    try {
      const audio = new Audio('/chime.mp3');
      audio.play().catch(e => console.log("Audio prevented by browser or file missing:", e));
    } catch (err) {}
  };

  const showMessage = (title, message, type = 'info', onClose = null) => {
    setCustomAlert({ isOpen: true, title, message, type, onClose });
  };

  useEffect(() => {
    if (window.location.hash.includes('view=notifications')) {
      setShowNotifCenter(true);
      window.history.replaceState(null, '', '/#/'); 
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    let unsubProfiles, unsubScans, unsubSys;

    const setupListeners = async () => {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.lastViewedPersonal) setLastViewedPersonal(data.lastViewedPersonal);
          if (data.lastViewedSystem) setLastViewedSystem(data.lastViewedSystem);
        }

        const qProfiles = query(collection(db, "profiles"), where("userId", "==", currentUser.uid));
        unsubProfiles = onSnapshot(qProfiles, (snap) => {
          const fetchedProfiles = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          fetchedProfiles.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
          setProfiles(fetchedProfiles);
        });

        const qScans = query(collection(db, "scans"), where("ownerId", "==", currentUser.uid));
        unsubScans = onSnapshot(qScans, (snap) => {
          if (!isInitialScansLoad.current) {
            let hasNew = false;
            snap.docChanges().forEach(change => { if (change.type === 'added') hasNew = true; });
            if (hasNew) playChime();
          }
          const fetchedScans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          fetchedScans.sort((a, b) => getTime(b.timestamp) - getTime(a.timestamp));
          setScans(fetchedScans);
          isInitialScansLoad.current = false;
        });

        const qSys = query(collection(db, "systemMessages"));
        unsubSys = onSnapshot(qSys, (snap) => {
          if (!isInitialSysLoad.current) {
            let hasNew = false;
            snap.docChanges().forEach(change => { if (change.type === 'added') hasNew = true; });
            if (hasNew) playChime();
          }
          const fetchedSys = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          fetchedSys.sort((a, b) => getTime(b.timestamp) - getTime(a.timestamp));
          setSystemMessages(fetchedSys);
          isInitialSysLoad.current = false;
        });

        setLoading(false);
      } catch (error) {
        console.error("Error setting up live listeners:", error);
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      if (unsubProfiles) unsubProfiles();
      if (unsubScans) unsubScans();
      if (unsubSys) unsubSys();
    };
  }, [currentUser]);

  useEffect(() => {
    const markAsRead = async () => {
      if (!currentUser || !showNotifCenter) return;

      if (notifTab === 'personal' && scans.length > 0) {
        const latestTimestamp = getISO(scans[0].timestamp);
        if (lastViewedPersonal !== latestTimestamp) {
          setLastViewedPersonal(latestTimestamp);
          await setDoc(doc(db, "users", currentUser.uid), { lastViewedPersonal: latestTimestamp }, { merge: true });
        }
      }

      if (notifTab === 'system' && systemMessages.length > 0) {
        const latestTimestamp = getISO(systemMessages[0].timestamp);
        if (lastViewedSystem !== latestTimestamp) {
          setLastViewedSystem(latestTimestamp);
          await setDoc(doc(db, "users", currentUser.uid), { lastViewedSystem: latestTimestamp }, { merge: true });
        }
      }
    };
    markAsRead();
  }, [showNotifCenter, notifTab, scans, systemMessages, currentUser, lastViewedPersonal, lastViewedSystem]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleEnableAlertsClick = () => {
    if (!('Notification' in window)) {
      showMessage("Not Supported", "Your browser does not support notifications.", "error");
      return;
    }
    
    if (Notification.permission === 'granted') {
      processNotificationPermission();
    } else if (Notification.permission === 'denied') {
      showMessage("Permission Blocked", "You previously blocked notifications. To fix this: tap the Lock icon 🔒 next to the URL bar, go to Site Settings, allow notifications, and reload the page.", "warning");
    } else {
      setShowSoftAskModal(true);
    }
  };

  const processNotificationPermission = async () => {
    setShowSoftAskModal(false);
    setIsEnablingPush(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        
        let swRegistration = null;
        if ('serviceWorker' in navigator) {
          swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          swRegistration = await navigator.serviceWorker.ready; 
        }

        const currentToken = await getToken(messaging, { 
          vapidKey,
          serviceWorkerRegistration: swRegistration 
        });

        if (currentToken) {
          await setDoc(doc(db, "users", currentUser.uid), {
            fcmToken: currentToken, email: currentUser.email, lastUpdated: new Date().toISOString()
          }, { merge: true }); 
          showMessage("Connected!", "Your device is now securely connected to Emergency Alerts.", "success");
        }
      } else {
        showMessage("Permission Denied", "You won't receive emergency popups.", "warning");
      }
    } catch (error) {
      showMessage("Connection Error", error.message, "error");
    } finally {
      setIsEnablingPush(false);
    }
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
      showMessage("Error", "Failed to delete profile.", "error");
    } finally {
      setProfileToDelete(null); 
    }
  };

  const confirmDeleteScan = async () => {
    if (!scanToDelete) return;
    try {
      await deleteDoc(doc(db, "scans", scanToDelete));
      setScans(scans.filter(s => s.id !== scanToDelete)); 
    } catch (error) {
      console.error(error);
      showMessage("Error", "Failed to delete notification.", "error");
    } finally {
      setScanToDelete(null); 
    }
  };

  const downloadFullPass = async (profile) => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const pixelScale = 2; 
      const W = 1080; 
      const H = 1920; 

      canvas.width = W * pixelScale;
      canvas.height = H * pixelScale; 
      
      ctx.scale(pixelScale, pixelScale);
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.beginPath();
      ctx.roundRect(0, 0, W, H, 80);
      ctx.clip(); 
      ctx.fillStyle = '#18181b'; 
      ctx.fillRect(0, 0, W, H);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = profile.imageUrl;
      await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });

      const imgHeight = H * 0.45; 
      if (img.width && img.height) {
        const scaleFactor = Math.max(W / img.width, imgHeight / img.height);
        const drawW = W / scaleFactor;
        const drawH = imgHeight / scaleFactor;
        const sX = (img.width - drawW) / 2;
        const sY = (img.height - drawH) / 2;
        ctx.drawImage(img, sX, sY, drawW, drawH, 0, 0, W, imgHeight);
      }

      const gradient = ctx.createLinearGradient(0, imgHeight - 350, 0, imgHeight);
      gradient.addColorStop(0, "rgba(24, 24, 27, 0)");
      gradient.addColorStop(1, "#18181b");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, imgHeight - 350, W, 350);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(50, 50, 220, 70, 35);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.src = "/kintag-logo.png";
      await new Promise((resolve) => { logoImg.onload = resolve; logoImg.onerror = resolve; });
      if (logoImg.width) ctx.drawImage(logoImg, 65, 60, 50, 50);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 30px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText("KinTag", 130, 85);

      ctx.textBaseline = 'alphabetic';
      let textBaseY = imgHeight - 30;
      if (profile.type === 'pet') {
        textBaseY = imgHeight - 115; 
      } else if (profile.type === 'kid' && profile.specialNeeds) {
        textBaseY = imgHeight - 75; 
      }

      ctx.fillStyle = 'white';
      ctx.font = '900 85px sans-serif';
      ctx.fillText(profile.name, 60, textBaseY - 45);

      ctx.fillStyle = '#fbbf24'; 
      ctx.font = 'bold 28px sans-serif';
      const infoText = `${profile.typeSpecific || 'Family Member'}  •  ${profile.age} ${profile.ageUnit === 'Months' ? 'MOS' : 'YRS'}`;
      ctx.fillText(infoText.toUpperCase(), 65, textBaseY);

      if (profile.type === 'pet') {
        ctx.font = 'bold 24px sans-serif';
        let lineY = textBaseY + 38;
        
        ctx.fillStyle = 'white';
        let label = "TEMPERAMENT - ";
        ctx.fillText(label, 65, lineY);
        ctx.fillStyle = profile.temperament !== 'Friendly' ? '#ef4444' : '#fbbf24';
        ctx.fillText(profile.temperament.toUpperCase(), 65 + ctx.measureText(label).width, lineY);
        
        lineY += 32;
        ctx.fillStyle = 'white';
        label = "VACCINATION STATUS - ";
        ctx.fillText(label, 65, lineY);
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(profile.vaccinationStatus.toUpperCase(), 65 + ctx.measureText(label).width, lineY);

        if (profile.microchip) {
          lineY += 32;
          ctx.fillStyle = 'white';
          label = "MICROCHIP NUMBER - ";
          ctx.fillText(label, 65, lineY);
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(profile.microchip.toUpperCase(), 65 + ctx.measureText(label).width, lineY);
        }
      } else if (profile.type === 'kid' && profile.specialNeeds) {
        ctx.fillStyle = '#ef4444'; 
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`ATTENTION: ${profile.specialNeeds}`.toUpperCase(), 65, textBaseY + 45);
      }

      const qrCanvas = document.getElementById("qr-canvas-modal");
      if (qrCanvas) {
        const boxSize = 600;
        const qrBoxX = (W - boxSize) / 2;
        const qrBoxY = imgHeight + 110; 

        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 15;

        const styleTheme = QR_STYLES[profile.qrStyle || 'obsidian'];
        
        ctx.fillStyle = styleTheme.bg; 
        ctx.beginPath();
        ctx.roundRect(qrBoxX, qrBoxY, boxSize, boxSize, 60);
        ctx.fill();

        ctx.shadowColor = 'transparent';

        ctx.strokeStyle = styleTheme.hexBorder;
        ctx.lineWidth = 14;
        ctx.stroke();

        const padding = 40;
        const qrSize = boxSize - (padding * 2);
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(qrCanvas, qrBoxX + padding, qrBoxY + padding, qrSize, qrSize);
        ctx.imageSmoothingEnabled = true; 
      }

      const textY = imgHeight + 110 + 600 + 90; 
      ctx.textAlign = 'center';
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 45px sans-serif';
      ctx.fillText("Scan (if lost) for", W / 2, textY);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 22px sans-serif';
      ctx.letterSpacing = "3px"; 
      ctx.fillText("EMERGENCY CONTACT, MEDICAL AND LOCATION", W / 2, textY + 55);
      ctx.fillText("INFO", W / 2, textY + 90);
      ctx.letterSpacing = "0px";

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`ID: ${profile.id.slice(0,8).toUpperCase()}`, W / 2, H - 70);

      const link = document.createElement('a');
      link.download = `${profile.name}-Mobile-ID.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

    } catch (e) {
      showMessage("Download Failed", "Could not generate image due to device restrictions. Please take a screenshot instead.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const filteredProfiles = profiles.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const activeStyle = qrModalProfile ? QR_STYLES[qrModalProfile.qrStyle || 'obsidian'] : QR_STYLES.obsidian;
  
  const unreadPersonalCount = lastViewedPersonal 
    ? scans.filter(scan => getTime(scan.timestamp) > new Date(lastViewedPersonal).getTime()).length 
    : scans.length;

  const unreadSystemCount = lastViewedSystem 
    ? systemMessages.filter(msg => getTime(msg.timestamp) > new Date(lastViewedSystem).getTime()).length 
    : systemMessages.length;

  const hasAnyUnread = unreadPersonalCount > 0 || unreadSystemCount > 0;

  const groupedScans = [];
  scans.forEach(scan => {
    const dateObj = new Date(getTime(scan.timestamp));
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let dateStr = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    if (dateObj.toDateString() === today.toDateString()) {
      dateStr = 'Today';
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      dateStr = 'Yesterday';
    }

    let group = groupedScans.find(g => g.date === dateStr);
    if (!group) {
      group = { date: dateStr, items: [] };
      groupedScans.push(group);
    }
    group.items.push(scan);
  });

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8 relative pb-32">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center gap-4 mb-6 bg-white p-5 rounded-3xl shadow-sm border border-zinc-100">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-10 h-10 rounded-xl shadow-sm" />
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold text-brandDark tracking-tight">KinTags</h1>
              <p className="text-sm text-zinc-500 font-medium truncate max-w-[200px] md:max-w-full">{currentUser?.email}</p>
            </div>
          </div>
          
          <button onClick={handleLogout} className="flex items-center justify-center space-x-2 text-white bg-red-600 hover:bg-red-700 p-3 md:px-4 md:py-2.5 rounded-xl transition-all font-bold text-sm shadow-sm">
            <LogOut size={18} />
            <span className="hidden md:inline">Log Out</span>
          </button>
        </div>

        {/* FULL WIDTH ACTION BUTTONS */}
        <div className="flex gap-3 mb-8">
          <button onClick={handleEnableAlertsClick} disabled={isEnablingPush} className="flex-1 flex items-center justify-center space-x-2 bg-brandGold text-white p-4 rounded-2xl hover:bg-amber-500 transition-all font-bold shadow-md disabled:opacity-50">
            {isEnablingPush ? <Loader2 size={18} className="animate-spin" /> : <BellRing size={18} />}
            <span>Enable Alerts</span>
          </button>
          
          <button onClick={() => setShowNotifCenter(true)} className="flex-1 flex items-center justify-center space-x-2 bg-white text-brandDark border border-zinc-200 p-4 rounded-2xl hover:bg-zinc-100 transition-all font-bold shadow-sm relative">
            <Bell size={18} />
            <span>Notifications</span>
            {hasAnyUnread && (
              <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm animate-pulse border border-white"></span>
            )}
          </button>
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
            <p className="text-zinc-500 mb-6 font-medium">Create your first digital contact card using the button below.</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 font-medium">No profiles match your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map(profile => (
              <div key={profile.id} className="bg-white rounded-3xl overflow-hidden shadow-premium border border-zinc-100 transition-all hover:-translate-y-1 flex flex-col">
                <div className="relative h-48 shrink-0">
                  <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brandDark/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-extrabold tracking-tight">{profile.name}</h3>
                    <p className="text-sm text-zinc-200 font-medium capitalize flex items-center gap-1.5 mt-0.5">
                      {profile.type === 'kid' ? <User size={12} /> : <PawPrint size={12} />}
                      {profile.type} • {profile.age} {profile.ageUnit === 'Months' ? 'Mos' : 'Yrs'} • {profile.gender}
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-white flex-1 flex flex-col justify-end">
                  <div className="flex gap-2">
                    <Link to={`/id/${profile.id}`} target="_blank" className="flex-1 flex items-center justify-center space-x-1.5 bg-brandMuted hover:bg-zinc-200 text-brandDark py-2.5 rounded-xl font-bold text-sm transition-colors" title="View Public Card">
                      <Eye size={16} />
                      <span>View</span>
                    </Link>
                    <button onClick={() => setQrModalProfile(profile)} className="bg-amber-50 hover:bg-amber-100 text-brandGold p-2.5 rounded-xl transition-colors" title="Mobile ID & QR">
                      <Smartphone size={18} />
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

      {/* FLOATING ACTION BUTTON (+) */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-50 via-zinc-50/80 to-transparent pointer-events-none z-40"></div>
      <Link to="/create" className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-brandDark text-white p-5 rounded-full shadow-2xl hover:bg-brandAccent transition-transform hover:scale-105 z-50 pointer-events-auto border-4 border-white">
        <Plus size={32} strokeWidth={3} />
      </Link>

      {/* GENERIC CUSTOM ALERT MODAL */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
              customAlert.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
              customAlert.type === 'error' ? 'bg-red-50 text-red-600' :
              customAlert.type === 'warning' ? 'bg-amber-50 text-amber-500' :
              'bg-brandMuted text-brandDark'
            }`}>
              {customAlert.type === 'success' && <CheckCircle2 size={32} />}
              {customAlert.type === 'error' && <AlertOctagon size={32} />}
              {customAlert.type === 'warning' && <AlertTriangle size={32} />}
              {customAlert.type === 'info' && <Info size={32} />}
            </div>
            <h2 className="text-2xl font-extrabold text-brandDark mb-2 tracking-tight">{customAlert.title}</h2>
            <p className="text-zinc-500 mb-8 text-sm font-medium leading-relaxed">{customAlert.message}</p>
            <button 
              onClick={() => {
                if(customAlert.onClose) customAlert.onClose();
                setCustomAlert({ ...customAlert, isOpen: false });
              }} 
              className="w-full bg-brandDark text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-brandAccent transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* SOFT ASK PERMISSION MODAL */}
      {showSoftAskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-brandGold/10 text-brandGold rounded-full flex items-center justify-center mx-auto mb-4">
              <BellRing size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-brandDark mb-2">Enable Alerts?</h2>
            <p className="text-zinc-500 mb-6 text-sm font-medium leading-relaxed">KinTag needs permission to send you emergency push notifications when your tag is scanned. This is crucial for your peace of mind.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSoftAskModal(false)} className="flex-1 bg-brandMuted text-brandDark py-3.5 rounded-xl font-bold">Maybe Later</button>
              <button onClick={processNotificationPermission} className="flex-1 bg-brandGold text-white py-3.5 rounded-xl font-bold shadow-md">Proceed</button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION CENTER MODAL */}
      {showNotifCenter && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-brandDark/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 shrink-0">
              <h2 className="text-2xl font-extrabold text-brandDark tracking-tight">Notifications</h2>
              <button onClick={() => setShowNotifCenter(false)} className="p-2 bg-white rounded-full text-zinc-500 hover:text-brandDark shadow-sm"><X size={20}/></button>
            </div>

            <div className="flex border-b border-zinc-200 shrink-0">
              <button onClick={() => setNotifTab('personal')} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 flex items-center justify-center gap-1.5 ${notifTab === 'personal' ? 'border-brandDark text-brandDark' : 'border-transparent text-zinc-400'}`}>
                Personal Scans
                {unreadPersonalCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{unreadPersonalCount}</span>
                )}
              </button>
              <button onClick={() => setNotifTab('system')} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 flex items-center justify-center gap-1.5 ${notifTab === 'system' ? 'border-brandDark text-brandDark' : 'border-transparent text-zinc-400'}`}>
                System Updates
                {unreadSystemCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{unreadSystemCount}</span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50">
              
              {/* PERSONAL SCANS TAB */}
              {notifTab === 'personal' && (
                groupedScans.length === 0 ? (
                  <div className="text-center mt-10 text-zinc-400 font-medium">No scans recorded yet.</div>
                ) : (
                  groupedScans.map(group => (
                    <div key={group.date} className="mb-6 last:mb-2">
                      <div className="flex items-center mb-4">
                        <div className="h-px bg-zinc-200 flex-1"></div>
                        <span className="px-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">{group.date}</span>
                        <div className="h-px bg-zinc-200 flex-1"></div>
                      </div>
                      
                      <div className="space-y-3">
                        {group.items.map(scan => (
                          <div key={scan.id} className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 relative group">
                            
                            <button 
                              onClick={() => setScanToDelete(scan.id)}
                              className="absolute top-3 right-3 p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                              title="Delete Scan Record"
                            >
                              <Trash2 size={16} />
                            </button>

                            <div className="flex items-center justify-between mb-2 pr-10">
                              <span className="font-extrabold text-brandDark truncate">{scan.profileName} Scanned</span>
                              <span className="text-[10px] text-zinc-400 font-bold uppercase shrink-0">{new Date(getTime(scan.timestamp)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            
                            {scan.type === 'active' ? (
                              <div className="bg-red-50 p-3 rounded-xl border border-red-100 mt-2">
                                <p className="text-xs text-red-800 font-bold mb-3">A Good Samaritan pinpointed their exact location!</p>
                                <a href={scan.googleMapsLink} target="_blank" rel="noopener noreferrer" className="bg-red-600 text-white px-3 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-700 w-full shadow-sm">
                                  <MapPin size={16}/> Open in Google Maps
                                </a>
                              </div>
                            ) : (
                              <p className="text-xs text-zinc-500 font-medium flex items-center gap-1.5 mt-2"><Info size={14} className="shrink-0 text-brandGold"/> Passive scan near {scan.city}, {scan.region}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )
              )}

              {/* SYSTEM UPDATES TAB */}
              {notifTab === 'system' && (
                systemMessages.length === 0 ? (
                  <div className="text-center mt-10">
                    <Bell size={32} className="mx-auto text-zinc-300 mb-3" />
                    <p className="text-zinc-500 font-medium text-sm">System broadcast messages from KinTag Admin will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {systemMessages.map(msg => (
                      <div key={msg.id} className="bg-brandDark text-white p-5 rounded-2xl shadow-md border border-brandDark">
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
                          <span className="font-extrabold flex items-center gap-2 text-lg"><BellRing size={18} className="text-brandGold"/> {msg.title}</span>
                          <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                            {new Date(getTime(msg.timestamp)).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-white/80 font-medium leading-relaxed">{msg.body}</p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {qrModalProfile && (
        <div className="fixed inset-0 z-[100] bg-brandDark/95 backdrop-blur-lg overflow-y-auto flex p-4 md:p-8">
          
          <button 
            onClick={() => setQrModalProfile(null)} 
            className="fixed top-6 right-6 z-[110] text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition shadow-lg backdrop-blur-md"
          >
            <X size={24} />
          </button>

          <div className="max-w-sm w-full relative m-auto py-8">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="text-left">
                 <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight">Mobile ID</h2>
                 <p className="text-white/60 text-[10px] sm:text-xs font-medium mt-0.5 leading-snug">Download this card to save to your photos.</p>
              </div>
              <button 
                onClick={() => downloadFullPass(qrModalProfile)} 
                disabled={downloading}
                className="shrink-0 flex items-center justify-center space-x-1.5 bg-white text-brandDark px-4 py-2.5 rounded-xl font-bold shadow-lg hover:bg-zinc-200 transition-all disabled:opacity-50 text-sm"
              >
                {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                <span>{downloading ? 'Wait...' : 'Download ID'}</span>
              </button>
            </div>

            <div className="bg-brandDark rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-700 w-full aspect-[9/16] flex flex-col relative mx-auto">
              <div className="h-[45%] w-full relative shrink-0">
                <img src={qrModalProfile.imageUrl} alt="Profile" className="w-full h-full object-cover opacity-90" crossOrigin="anonymous" />
                <div className="absolute inset-0 bg-gradient-to-t from-brandDark via-brandDark/20 to-transparent"></div>
                
                <div className="absolute top-5 left-5 flex items-center space-x-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                   <img src="/kintag-logo.png" alt="Logo" className="w-5 h-5 rounded" />
                   <span className="text-white font-bold text-xs tracking-wide">KinTag</span>
                </div>

                <div className="absolute bottom-3 left-6 right-6">
                  <h3 className="text-3xl font-extrabold text-white tracking-tight leading-none mb-1">{qrModalProfile.name}</h3>
                  <div className="flex items-center space-x-2 text-brandGold text-[11px] font-bold uppercase tracking-widest mb-1">
                     <span>{qrModalProfile.typeSpecific}</span>
                     <span>•</span>
                     {/* 🌟 NEW: Handles UI Age unit in Mobile View */}
                     <span>{qrModalProfile.age} {qrModalProfile.ageUnit === 'Months' ? 'Mos' : 'Yrs'}</span>
                  </div>
                  
                  {qrModalProfile.type === 'kid' && qrModalProfile.specialNeeds && (
                    <p className="text-red-400 font-bold text-[10px] uppercase tracking-wider mt-1">{qrModalProfile.specialNeeds}</p>
                  )}
                  {qrModalProfile.type === 'pet' && (
                    <div className="space-y-0.5 mt-2">
                       <p className="text-white text-[10px] font-bold uppercase tracking-wider">
                         Temperament - <span className={qrModalProfile.temperament !== 'Friendly' ? 'text-red-400' : 'text-brandGold'}>{qrModalProfile.temperament}</span>
                       </p>
                       <p className="text-white text-[10px] font-bold uppercase tracking-wider">
                         Vaccination - <span className="text-brandGold">{qrModalProfile.vaccinationStatus}</span>
                       </p>
                       {qrModalProfile.microchip && (
                         <p className="text-white text-[10px] font-bold uppercase tracking-wider">
                           Microchip - <span className="text-brandGold">{qrModalProfile.microchip}</span>
                         </p>
                       )}
                    </div>
                  )}

                </div>
              </div>

              <div className="flex-1 bg-brandDark p-6 flex flex-col items-center justify-center text-center relative">
                <div className={`bg-white p-4 rounded-3xl shadow-lg border-4 ${activeStyle.border}`}>
                  <QRCodeCanvas 
                    id="qr-canvas-modal"
                    value={`${window.location.origin}/#/id/${qrModalProfile.id}`} 
                    size={1024} 
                    style={{ width: '160px', height: '160px' }}
                    level="H" 
                    includeMargin={false} 
                    fgColor={activeStyle.fg} 
                    bgColor={activeStyle.bg} 
                    imageSettings={{ src: "/kintag-logo.png", height: 224, width: 224, excavate: true }} 
                  />
                </div>
                
                <div className="mt-5 text-center px-4">
                  <p className="text-white font-bold text-lg tracking-tight mb-1">Scan (if lost) for</p>
                  <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold leading-relaxed">
                    Emergency Contact, Medical and Location<br/>Info
                  </p>
                </div>
                
                <div className="absolute bottom-6 text-white/20 text-[10px] font-mono">
                   ID: {qrModalProfile.id.slice(0,8).toUpperCase()}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DELETE PROFILE CONFIRMATION MODAL */}
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

      {/* DELETE NOTIFICATION SCAN MODAL */}
      {scanToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertOctagon size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-brandDark mb-2 tracking-tight">Delete Notification?</h2>
            <p className="text-zinc-500 mb-8 text-sm font-medium leading-relaxed">This action cannot be undone. This scan record will be permanently removed from your history.</p>
            
            <div className="flex gap-3">
              <button onClick={() => setScanToDelete(null)} className="flex-1 bg-brandMuted text-brandDark py-3.5 rounded-xl font-bold hover:bg-zinc-200 transition-colors">
                Cancel
              </button>
              <button onClick={confirmDeleteScan} className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-24 bg-zinc-200 animate-pulse rounded-3xl w-full"></div>
        <div className="h-14 bg-zinc-200 animate-pulse rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[300px] bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-100 flex flex-col">
              <div className="h-48 bg-zinc-200 animate-pulse w-full"></div>
              <div className="p-4 flex-1 flex items-end">
                <div className="h-10 bg-zinc-100 animate-pulse w-full rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
