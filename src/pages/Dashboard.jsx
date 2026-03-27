import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, getDoc, doc, deleteDoc, setDoc, onSnapshot, updateDoc, addDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import GoogleWalletIcon from '../components/ui/GoogleWalletIcon';
import NotificationCenter from '../components/NotificationCenter';
import {
  Plus, User, QrCode, PawPrint, Trash2, Edit, Download, X,
  Eye, Search, AlertOctagon, Smartphone, Loader2, AlertTriangle,
  EyeOff, Siren, Megaphone, Settings, CheckCircle2, Info
} from 'lucide-react';
import { avatars } from '../components/ui/avatar-picker';
import { mw } from 'motionwind-react';

// ─── QR Style Presets ────────────────────────────────────────────────────────
const QR_STYLES = {
  obsidian:  { name: 'Classic Obsidian',   fg: '#18181b', bg: '#ffffff', border: 'border-zinc-200',   hexBorder: '#e4e4e7' },
  bubblegum: { name: 'Bubblegum Pink',     fg: '#db2777', bg: '#fdf2f8', border: 'border-pink-200',   hexBorder: '#fbcfe8' },
  ocean:     { name: 'Ocean Blue',         fg: '#0284c7', bg: '#f0f9ff', border: 'border-sky-200',    hexBorder: '#bae6fd' },
  minty:     { name: 'Minty Green',        fg: '#0d9488', bg: '#f0fdfa', border: 'border-teal-200',   hexBorder: '#99f6e4' },
  lavender:  { name: 'Lavender Violet',    fg: '#7c3aed', bg: '#f5f3ff', border: 'border-violet-200', hexBorder: '#ddd6fe' },
  sunshine:  { name: 'Sunshine Orange',   fg: '#d97706', bg: '#fffbeb', border: 'border-amber-200',  hexBorder: '#fde68a' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getTime = (ts) => ts?.toDate ? ts.toDate().getTime() : new Date(ts || 0).getTime();

const getComputedAge = (profile) => {
  if (profile.dob) {
    const dob = new Date(profile.dob);
    const today = new Date();
    let months = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
    if (today.getDate() < dob.getDate()) months--;
    if (months < 0) months = 0;
    if (months < 12) return { value: months === 0 ? 1 : months, label: 'Mos', fullLabel: 'MOS' };
    return { value: Math.floor(months / 12), label: 'Yrs', fullLabel: 'YRS' };
  }
  return {
    value: profile.age || 'Unknown',
    label: profile.ageUnit === 'Months' ? 'Mos' : 'Yrs',
    fullLabel: profile.ageUnit === 'Months' ? 'MOS' : 'YRS',
  };
};

const CARD_DELAYS = [
  'animate-delay-0', 'animate-delay-100', 'animate-delay-200',
  'animate-delay-300', 'animate-delay-400', 'animate-delay-500',
];
const cardDelay = (i) => CARD_DELAYS[Math.min(i, CARD_DELAYS.length - 1)];

// ─── Profile Card Component (Memoized) ───────────────────────────────────────
const ProfileCard = React.memo(({ 
  profile, idx, setBroadcastModalProfile, setLostModalProfile, 
  setFoundModalProfile, toggleProfileStatus, setQrModalProfile, setProfileToDelete 
}) => {
  const ageInfo = getComputedAge(profile);
  
  return (
    <mw.div
      className={`bg-white/90 backdrop-blur-md rounded-[2.5rem] overflow-hidden border shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col group animate-initial:opacity-0 animate-initial:y-16 animate-enter:opacity-100 animate-enter:y-0 animate-spring animate-stiffness-220 animate-damping-7 ${cardDelay(idx)} ${profile.isActive === false ? 'border-red-200 opacity-70 grayscale-[50%]' : profile.isLost ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'border-zinc-200/80 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:border-brandDark/20 transition-all duration-500'} animate-hover:scale-105 animate-tap:scale-95`}
    >
      <div className="relative h-56 shrink-0 overflow-hidden bg-zinc-100">
        <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-brandDark/90 via-brandDark/20 to-transparent pointer-events-none" />

        {profile.isActive === false && (
          <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-md text-white text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg tracking-widest shadow-lg border border-white/20">Disabled</div>
        )}

        <div className="absolute top-4 right-4 flex gap-2 z-30">
          <mw.button
            disabled={!profile.isLost || profile.kinAlertActive}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBroadcastModalProfile(profile); }}
            className={`p-2.5 rounded-xl shadow-lg backdrop-blur-md transition-colors animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7 ${
              profile.kinAlertActive ? 'bg-emerald-500 text-white cursor-default' : profile.isLost ? 'bg-amber-500 text-white hover:bg-amber-400' : 'bg-white/50 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <Megaphone size={18} />
          </mw.button>
          <mw.button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); profile.isLost ? setFoundModalProfile(profile) : setLostModalProfile(profile); }}
            className={`p-2.5 rounded-xl shadow-lg backdrop-blur-md transition-colors animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7 ${
              profile.isLost ? 'bg-red-600 text-white animate-pulse hover:bg-red-500' : 'bg-white/80 text-zinc-600 hover:text-red-600 hover:bg-white'
            }`}
          >
            <Siren size={18} />
          </mw.button>
        </div>

        <div className="absolute bottom-5 left-5 right-5 text-white pointer-events-none">
          <h3 className="text-2xl font-extrabold tracking-tight mb-1 drop-shadow-sm">{profile.name}</h3>
          <p className="text-xs text-white/80 font-bold capitalize flex items-center gap-1.5">
            {profile.type === 'kid' ? <User size={14} /> : <PawPrint size={14} />}
            {profile.type} • {ageInfo.value} {ageInfo.label} • {profile.gender}
          </p>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-end">
        <div className="flex flex-wrap gap-2.5">
          <Link to={`/id/${profile.id}`} target="_blank" className="flex-1 group" onClick={(e) => e.stopPropagation()}>
            <mw.div className="w-full h-full flex items-center justify-center space-x-2 bg-zinc-50 border border-zinc-200 group-hover:bg-white text-brandDark py-3 rounded-2xl font-bold text-sm shadow-sm transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">
              <Eye size={16} /><span>View</span>
            </mw.div>
          </Link>

          <mw.button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleProfileStatus(profile.id, profile.isActive); }}
            className={`flex items-center justify-center p-3 rounded-2xl shadow-sm transition-colors animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7 ${
              profile.isActive === false ? 'bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 border border-red-100 text-red-600 hover:bg-red-100'
            }`}
          >
            {profile.isActive === false ? <Eye size={18} /> : <EyeOff size={18} />}
          </mw.button>
          <mw.button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQrModalProfile(profile); }}
            className="bg-amber-50 border border-amber-100 text-amber-600 hover:bg-amber-100 p-3 rounded-2xl shadow-sm transition-colors animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7"
          >
            <Smartphone size={18} />
          </mw.button>
          
          <Link to={`/edit/${profile.id}`} className="group" onClick={(e) => e.stopPropagation()}>
            <mw.div className="bg-blue-50 border border-blue-100 text-blue-600 group-hover:bg-blue-100 p-3 rounded-2xl shadow-sm transition-colors animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7">
              <Edit size={18} />
            </mw.div>
          </Link>
          
          <mw.button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setProfileToDelete({ id: profile.id, imageUrl: profile.imageUrl }); }}
            className="bg-zinc-50 border border-zinc-200 text-zinc-500 hover:bg-zinc-100 p-3 rounded-2xl shadow-sm transition-colors animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7"
          >
            <Trash2 size={18} />
          </mw.button>
        </div>
      </div>
    </mw.div>
  );
});

// ─── Component ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [profiles,     setProfiles]     = useState([]);
  const [scans,        setScans]        = useState([]);
  const [systemMessages, setSystemMessages] = useState([]);
  const [pendingInvite,  setPendingInvite]  = useState(null);
  const [loading,      setLoading]      = useState(true);

  const [qrModalProfile,    setQrModalProfile]    = useState(null);
  const [searchTerm,        setSearchTerm]        = useState('');
  const [profileToDelete,   setProfileToDelete]   = useState(null);
  const [downloading,       setDownloading]       = useState(false);
  const [generatingWallet,  setGeneratingWallet]  = useState(false);

  const [lostModalProfile,      setLostModalProfile]      = useState(null);
  const [foundModalProfile,     setFoundModalProfile]     = useState(null);
  const [broadcastModalProfile, setBroadcastModalProfile] = useState(null);
  const [allActiveAlerts,       setAllActiveAlerts]       = useState([]);
  const [dismissedAlerts,       setDismissedAlerts]       = useState([]);
  const [foundPopups,           setFoundPopups]           = useState([]);
  const [dismissedFoundAlerts,  setDismissedFoundAlerts]  = useState([]);

  const [customAlert, setCustomAlert] = useState({ isOpen: false, title: '', message: '', type: 'info', onClose: null });

  const [userFamilyId, setUserFamilyId] = useState(null);
  const [userZipCode,  setUserZipCode]  = useState('');
  const [userAvatarId, setUserAvatarId] = useState(null);

  // Auto-hide FAB state
  const [isFabHidden, setIsFabHidden] = useState(false);

  const isInitialScansLoad = useRef(true);
  const isInitialSysLoad   = useRef(true);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Handle clicking outside to bring FAB back
  useEffect(() => {
    const handleDocumentClick = (e) => {
      const notifArea = document.getElementById('notif-wrapper');
      if (notifArea && !notifArea.contains(e.target)) {
        setIsFabHidden(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const playChime = () => {
    try { const a = new Audio('/chime.mp3'); a.play().catch(() => {}); } catch (_) {}
  };

  const showMessage = (title, message, type = 'info', onClose = null) =>
    setCustomAlert({ isOpen: true, title, message, type, onClose });

  useEffect(() => {
    if (!currentUser) return;
    let unsubProfiles, unsubScans, unsubSys, unsubInvite, unsubAlerts;

    const setupListeners = async () => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc    = await getDoc(userDocRef);
        let currentFamilyId = currentUser.uid;

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserZipCode(data.zipCode   || '');
          setUserAvatarId(data.avatarId || null);
          currentFamilyId = data.familyId || currentUser.uid;
        } else {
          await setDoc(userDocRef, { email: currentUser.email, familyId: currentUser.uid }, { merge: true });
        }

        setUserFamilyId(currentFamilyId);

        unsubProfiles = onSnapshot(
          query(collection(db, 'profiles'), where('familyId', '==', currentFamilyId)),
          (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
            setProfiles(list);
          }
        );

        unsubScans = onSnapshot(
          query(collection(db, 'scans'), where('familyId', '==', currentFamilyId)),
          (snap) => {
            if (!isInitialScansLoad.current) {
              let hasNew = false;
              snap.docChanges().forEach(c => { if (c.type === 'added') hasNew = true; });
              if (hasNew) playChime();
            }
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => getTime(b.timestamp) - getTime(a.timestamp));
            setScans(list);
            isInitialScansLoad.current = false;
          }
        );

        unsubSys = onSnapshot(query(collection(db, 'systemMessages')), (snap) => {
          if (!isInitialSysLoad.current) {
            let hasNew = false;
            snap.docChanges().forEach(c => { if (c.type === 'added') hasNew = true; });
            if (hasNew) playChime();
          }
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          list.sort((a, b) => getTime(b.timestamp) - getTime(a.timestamp));
          setSystemMessages(list);
          isInitialSysLoad.current = false;
        });

        unsubInvite = onSnapshot(doc(db, 'invites', currentUser.email.toLowerCase()), (snap) => {
          if (snap.exists() && snap.data().status === 'pending') setPendingInvite({ id: snap.id, ...snap.data() });
          else setPendingInvite(null);
        });

        unsubAlerts = onSnapshot(
          query(collection(db, 'profiles'), where('kinAlertActive', '==', true)),
          (snap) => setAllActiveAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );

        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    setupListeners();
    return () => {
      if (unsubProfiles) unsubProfiles();
      if (unsubScans)    unsubScans();
      if (unsubSys)      unsubSys();
      if (unsubInvite)   unsubInvite();
      if (unsubAlerts)   unsubAlerts();
    };
  }, [currentUser]);

  useEffect(() => {
    if (scans.length > 0) {
      const recent = scans.filter(s => s.type === 'kinAlert_found' && (Date.now() - new Date(s.timestamp).getTime() < 300000));
      setFoundPopups(recent);
    }
  }, [scans]);

  const handleConfirmLost = async () => {
    if (!lostModalProfile) return;
    const p = lostModalProfile;
    setLostModalProfile(null);
    try {
      await updateDoc(doc(db, 'profiles', p.id), { isLost: true });
      setBroadcastModalProfile({ ...p, isLost: true });
    } catch { showMessage('Error', 'Failed to activate Lost Mode.', 'error'); }
  };

  const handleConfirmBroadcast = async () => {
    if (!broadcastModalProfile) return;
    const profile = broadcastModalProfile;
    setBroadcastModalProfile(null);
    if (!profile.pincode) {
      showMessage('Missing Pincode', "Set a local Area Pincode in this profile's edit settings to broadcast an alert.", 'warning');
      return;
    }
    try {
      await updateDoc(doc(db, 'profiles', profile.id), { kinAlertActive: true, kinAlertTimestamp: Date.now() });
      const uQuery = query(collection(db, 'users'), where('zipCode', '==', profile.pincode));
      const uSnap  = await getDocs(uQuery);
      const targets = new Set();
      uSnap.forEach(d => { const fam = d.data().familyId || d.id; if (fam !== profile.familyId) targets.add(fam); });
      targets.forEach(async (familyId) => {
        await addDoc(collection(db, 'scans'), { familyId, type: 'kinAlert', profileName: profile.name, message: `🚨 MISSING ${profile.type.toUpperCase()}: ${profile.name} in your area (${profile.pincode}). Please keep an eye out!`, timestamp: new Date().toISOString(), publicLink: `${window.location.origin}/#/id/${profile.id}` });
      });
      uSnap.forEach(uDoc => {
        const token = uDoc.data().fcmToken;
        if (token && (uDoc.data().familyId || uDoc.id) !== profile.familyId) {
          fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerId: uDoc.id, title: `🚨 Local KinAlert: ${profile.name} is missing!`, body: `Missing near ${profile.pincode}. Tap to view details and help.` }) }).catch(() => {});
        }
      });
      showMessage('KinAlert Active', `Broadcasted alert to guardians in Zip Code ${profile.pincode}.`, 'success');
    } catch { showMessage('Error', 'Failed to broadcast KinAlert.', 'error'); }
  };

  const handleDeactivateLost = async (profile) => {
    try {
      await updateDoc(doc(db, 'profiles', profile.id), { isLost: false, kinAlertActive: false });
      if (profile.kinAlertActive && profile.pincode) {
        const uQuery = query(collection(db, 'users'), where('zipCode', '==', profile.pincode));
        const uSnap  = await getDocs(uQuery);
        const targets = new Set();
        uSnap.forEach(d => { const fam = d.data().familyId || d.id; if (fam !== profile.familyId) targets.add(fam); });
        targets.forEach(async (familyId) => {
          await addDoc(collection(db, 'scans'), { familyId, type: 'kinAlert_found', profileName: profile.name, message: `✅ SAFE AND SOUND! ${profile.name} (${profile.pincode}) has been found. Thank you for your vigilance.`, timestamp: new Date().toISOString() });
        });
      }
      showMessage('Safe and Sound', `${profile.name} has been marked as found.`, 'success');
    } catch { showMessage('Error', 'Failed to deactivate Lost Mode.', 'error'); }
  };

  const confirmDelete = async () => {
    if (!profileToDelete) return;
    try {
      const publicId = (() => {
        if (!profileToDelete.imageUrl || profileToDelete.imageUrl.includes('placehold.co')) return null;
        const m = profileToDelete.imageUrl.match(/\/v\d+\/([^.]+)/);
        return m ? m[1] : null;
      })();
      if (publicId) await fetch('/api/delete-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicId }) }).catch(() => {});
      await deleteDoc(doc(db, 'profiles', profileToDelete.id));
      setProfiles(profiles.filter(p => p.id !== profileToDelete.id));
    } catch { showMessage('Error', 'Failed to delete profile.', 'error'); }
    finally { setProfileToDelete(null); }
  };

  const toggleProfileStatus = useCallback(async (profileId, currentStatus) => {
    try { await updateDoc(doc(db, 'profiles', profileId), { isActive: !currentStatus }); }
    catch { setCustomAlert({ isOpen: true, title: 'Error', message: 'Failed to change profile status.', type: 'error', onClose: null }); }
  }, []);

  const handleAddToWallet = async (profile) => {
    setGeneratingWallet(true);
    try {
      const ageInfo = getComputedAge(profile);
      const res  = await fetch('/api/generate-wallet-pass', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: profile.id, name: profile.name, type: profile.type, age: `${ageInfo.value} ${ageInfo.fullLabel || ageInfo.label}`.toUpperCase() }) });
      const data = await res.json();
      if (data.token) window.location.href = `https://pay.google.com/gp/v/save/${data.token}`;
      else showMessage('Wallet Generation Failed', 'Failed to generate the Google Wallet pass.', 'error');
    } catch { showMessage('Network Error', 'Something went wrong connecting to the Google Wallet server.', 'error'); }
    finally { setGeneratingWallet(false); }
  };

  const downloadFullPass = async (profile) => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx    = canvas.getContext('2d');
      const W = 1080; const H = 1920; const scale = 2;
      canvas.width = W * scale; canvas.height = H * scale;
      ctx.scale(scale, scale);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.beginPath(); ctx.roundRect(0, 0, W, H, 80); ctx.clip();
      ctx.fillStyle = '#18181b'; ctx.fillRect(0, 0, W, H);

      const img = new Image(); img.crossOrigin = 'anonymous'; img.src = profile.imageUrl;
      await new Promise(r => { img.onload = r; img.onerror = r; });

      const imgH = H * 0.45;
      if (img.width && img.height) {
        const s = Math.max(W / img.width, imgH / img.height);
        const dW = W / s; const dH = imgH / s;
        ctx.drawImage(img, (img.width - dW) / 2, (img.height - dH) / 2, dW, dH, 0, 0, W, imgH);
      }
      const grad = ctx.createLinearGradient(0, imgH - 350, 0, imgH);
      grad.addColorStop(0, 'rgba(24,24,27,0)'); grad.addColorStop(1, '#18181b');
      ctx.fillStyle = grad; ctx.fillRect(0, imgH - 350, W, 350);

      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.roundRect(50, 50, 220, 70, 35); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; ctx.stroke();

      const logoImg = new Image(); logoImg.crossOrigin = 'anonymous'; logoImg.src = '/kintag-logo.png';
      await new Promise(r => { logoImg.onload = r; logoImg.onerror = r; });
      if (logoImg.width) ctx.drawImage(logoImg, 65, 60, 50, 50);
      ctx.fillStyle = 'white'; ctx.font = 'bold 30px sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText('KinTag', 130, 85);

      ctx.textBaseline = 'alphabetic';
      let textBaseY = imgH - 30;
      if (profile.type === 'pet') textBaseY = imgH - 115;
      else if (profile.type === 'kid' && profile.specialNeeds) textBaseY = imgH - 75;

      ctx.fillStyle = 'white'; ctx.font = '900 85px sans-serif'; ctx.fillText(profile.name, 60, textBaseY - 45);
      ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 28px sans-serif';
      const ageInfo = getComputedAge(profile);
      ctx.fillText(`${profile.typeSpecific || 'Family Member'}  •  ${ageInfo.value} ${ageInfo.fullLabel}`.toUpperCase(), 65, textBaseY);

      if (profile.type === 'pet') {
        ctx.font = 'bold 24px sans-serif'; let lY = textBaseY + 38;
        ctx.fillStyle = 'white'; let lbl = 'TEMPERAMENT - '; ctx.fillText(lbl, 65, lY);
        ctx.fillStyle = profile.temperament !== 'Friendly' ? '#ef4444' : '#fbbf24'; ctx.fillText(profile.temperament.toUpperCase(), 65 + ctx.measureText(lbl).width, lY);
        lY += 32; ctx.fillStyle = 'white'; lbl = 'VACCINATION STATUS - '; ctx.fillText(lbl, 65, lY);
        ctx.fillStyle = '#fbbf24'; ctx.fillText(profile.vaccinationStatus.toUpperCase(), 65 + ctx.measureText(lbl).width, lY);
        if (profile.microchip) { lY += 32; ctx.fillStyle = 'white'; lbl = 'MICROCHIP NUMBER - '; ctx.fillText(lbl, 65, lY); ctx.fillStyle = '#fbbf24'; ctx.fillText(profile.microchip.toUpperCase(), 65 + ctx.measureText(lbl).width, lY); }
      } else if (profile.type === 'kid' && profile.specialNeeds) {
        ctx.fillStyle = '#ef4444'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(`ATTENTION: ${profile.specialNeeds}`.toUpperCase(), 65, textBaseY + 45);
      }

      const qrCanvas = document.getElementById('qr-canvas-modal');
      if (qrCanvas) {
        const boxSize = 600; const qrBoxX = (W - boxSize) / 2; const qrBoxY = imgH + 110;
        ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 15;
        const style = QR_STYLES[profile.qrStyle || 'obsidian'];
        ctx.fillStyle = style.bg; ctx.beginPath(); ctx.roundRect(qrBoxX, qrBoxY, boxSize, boxSize, 60); ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.strokeStyle = style.hexBorder; ctx.lineWidth = 14; ctx.stroke();
        const pad = 40; ctx.imageSmoothingEnabled = false; ctx.drawImage(qrCanvas, qrBoxX + pad, qrBoxY + pad, boxSize - pad * 2, boxSize - pad * 2);
        ctx.imageSmoothingEnabled = true;
      }

      const textY = imgH + 110 + 600 + 90;
      ctx.textAlign = 'center'; ctx.fillStyle = 'white'; ctx.font = 'bold 45px sans-serif'; ctx.fillText('Scan (if lost) for', W / 2, textY);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = 'bold 22px sans-serif'; ctx.letterSpacing = '3px';
      ctx.fillText('EMERGENCY CONTACT, MEDICAL AND LOCATION', W / 2, textY + 55); ctx.fillText('INFO', W / 2, textY + 90);
      ctx.letterSpacing = '0px'; ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = 'bold 22px monospace';
      ctx.fillText(`ID: ${profile.id.slice(0, 8).toUpperCase()}`, W / 2, H - 70);

      const link = document.createElement('a'); link.download = `${profile.name}-Mobile-ID.png`; link.href = canvas.toDataURL('image/png', 1.0); link.click();
    } catch { showMessage('Download Failed', 'Could not generate image due to device restrictions. Please take a screenshot instead.', 'error'); }
    finally { setDownloading(false); }
  };

  const filteredProfiles  = profiles.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const activeStyle       = qrModalProfile ? QR_STYLES[qrModalProfile.qrStyle || 'obsidian'] : QR_STYLES.obsidian;
  const localAlerts       = allActiveAlerts.filter(a => a.pincode === userZipCode && a.familyId !== userFamilyId);
  const activeAlertToDisplay      = localAlerts.find(a => !dismissedAlerts.includes(a.id));
  const activeFoundPopupToDisplay = foundPopups.find(p => !dismissedFoundAlerts.includes(p.id));
  const currentAvatar = avatars.find(a => a.id === userAvatarId) || null;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] p-4 md:p-8 relative pb-32 selection:bg-brandGold selection:text-white">

      {/* CSS Block to seamlessly hide the FAB based on focus state */}
      <style>{`
        /* If anything inside the notif-wrapper receives focus, seamlessly hide the FAB */
        body:has(#notif-wrapper:focus-within) #fab-tray {
          opacity: 0;
          pointer-events: none;
          transform: translateY(20px) scale(0.95);
        }
      `}</style>

      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-brandGold/10 via-emerald-400/5 to-transparent rounded-full blur-[100px] pointer-events-none z-0" />

      {/* NOTE: Removed the z-index from max-w-5xl to break the stacking context trap! */}
      <div className="max-w-5xl mx-auto relative pt-4">

        {/* ── SECTION 1: Header ── delay-0 ───────────────────────────────── */}
        <div className="relative z-[20] animate-initial:opacity-0 animate-initial:y-16 animate-enter:opacity-100 animate-enter:y-0 animate-spring animate-stiffness-220 animate-damping-7 animate-delay-0">
          <mw.div className="flex justify-between items-center gap-4 mb-8 bg-white/80 backdrop-blur-xl p-5 md:px-8 md:py-6 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-200/80 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">
            <div className="flex items-center space-x-4 w-full">
              <img src="/kintag-logo.png" alt="KinTag Logo" className="w-12 h-12 rounded-[1rem] shadow-sm" />
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-extrabold text-brandDark tracking-tight leading-none mb-0.5">KinTag</h1>
                <p className="text-sm text-zinc-500 font-medium truncate">Family Dashboard</p>
              </div>
            </div>
          </mw.div>
        </div>

        {/* ── SECTION 2: Action Buttons (NotificationCenter) ── delay-100 ── */}
        <div 
          id="notif-wrapper" 
          onClick={() => setIsFabHidden(true)} 
          className="relative z-[60] w-full mb-10 flex justify-between gap-4 animate-initial:opacity-0 animate-initial:y-16 animate-enter:opacity-100 animate-enter:y-0 animate-spring animate-stiffness-220 animate-damping-7 animate-delay-100
          [&>div]:flex [&>div]:w-full [&>div]:justify-between [&>div]:gap-4
          [&_button]:transition-transform [&_button]:duration-[400ms] [&_button]:ease-[cubic-bezier(0.34,1.56,0.64,1)] [&_button]:will-change-transform
          hover:[&_button]:scale-[1.05] active:[&_button]:scale-[0.95]"
        >
          <NotificationCenter 
  scans={scans} 
  systemMessages={systemMessages} 
  pendingInvite={pendingInvite} 
  currentUser={currentUser} 
  showMessage={showMessage}
  profiles={profiles} // 🌟 ADD THIS LINE
/>
        </div>

        {/* ── SECTION 3: Local alert marquee (conditional) ── delay-150 ──── */}
        {localAlerts.length > 0 && (
          <div className="relative z-[20] animate-initial:opacity-0 animate-initial:y-16 animate-enter:opacity-100 animate-enter:y-0 animate-spring animate-stiffness-220 animate-damping-7 animate-delay-150">
            <div className="mb-10">
              <style>{`
                @keyframes seamlessDash { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-seamless-dash { display: flex; width: max-content; animation: seamlessDash 15s linear infinite; }
              `}</style>
              <Link 
                to={`/id/${localAlerts[0].id}`} 
                target="_blank" 
                className="block overflow-hidden rounded-[2rem] shadow-[0_10px_30px_rgba(239,68,68,0.4)] relative group cursor-pointer transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="bg-red-600 text-white border-[6px] border-red-500 group-hover:border-red-400 transition-colors h-[72px]">
                  <div className="animate-seamless-dash flex items-center h-full group-hover:[animation-play-state:paused]">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center shrink-0">
                        {localAlerts.map(alert => (
                          <span key={`${i}-${alert.id}`} className="mx-8 font-black text-xl tracking-[0.1em] uppercase flex items-center gap-4 whitespace-nowrap hover:underline drop-shadow-sm">
                            <AlertTriangle size={28} className="animate-pulse text-brandGold shrink-0" />
                            MISSING {alert.type}: {alert.name} IN YOUR AREA ({alert.pincode}) - TAP TO HELP!
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* ── SECTION 4: Search (conditional) ── delay-200 ─────────────── */}
        {profiles.length > 0 && (
          <div className="relative z-[20] animate-initial:opacity-0 animate-initial:y-16 animate-enter:opacity-100 animate-enter:y-0 animate-spring animate-stiffness-220 animate-damping-7 animate-delay-200">
            <mw.div className="mb-8 relative group animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-brandDark z-10 pointer-events-none" size={20} />
              <input
                type="text"
                placeholder="Search profiles by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-5 py-4 md:py-5 bg-white/80 backdrop-blur-xl border border-zinc-200/80 rounded-[2rem] focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 outline-none transition-all shadow-sm hover:shadow-md font-medium text-brandDark text-lg relative z-0"
              />
            </mw.div>
          </div>
        )}

        {/* ── SECTION 5: Profile Grid ── delay-300 ─────────────────────── */}
        <div className="relative z-[20] max-h-[60vh] overflow-y-auto pb-40 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {profiles.length === 0 ? (
            <div className="text-center bg-white/50 backdrop-blur-md p-16 rounded-[3rem] border-2 border-dashed border-zinc-300 shadow-sm animate-initial:opacity-0 animate-initial:y-16 animate-enter:opacity-100 animate-enter:y-0 animate-spring animate-stiffness-220 animate-damping-7 animate-delay-300">
              <div className="w-20 h-20 bg-zinc-100 text-zinc-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <QrCode size={36} />
              </div>
              <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">No Profiles Yet</h2>
              <p className="text-zinc-500 mb-8 font-medium text-lg max-w-sm mx-auto leading-relaxed">Create your very first digital contact card using the big plus button below.</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 font-bold text-lg">No profiles match your search.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProfiles.map((profile, idx) => (
                <ProfileCard 
                  key={profile.id}
                  profile={profile}
                  idx={idx}
                  setBroadcastModalProfile={setBroadcastModalProfile}
                  setLostModalProfile={setLostModalProfile}
                  setFoundModalProfile={setFoundModalProfile}
                  toggleProfileStatus={toggleProfileStatus}
                  setQrModalProfile={setQrModalProfile}
                  setProfileToDelete={setProfileToDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom fade (z-[30]) ────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#fafafa] via-[#fafafa]/80 to-transparent pointer-events-none z-[30]" />

      {/* ── FAB Tray (z-[40]) auto-hides gracefully using React state AND CSS :has() selectors ── */}
      <div 
        id="fab-tray" 
        className={`fixed bottom-8 left-0 right-0 w-full flex justify-center z-[40] pointer-events-none transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isFabHidden ? 'opacity-0 translate-y-8 scale-95' : 'opacity-100 translate-y-0 scale-100'
        } animate-initial:opacity-0 animate-initial:y-16 animate-enter:opacity-100 animate-enter:y-0 animate-spring animate-stiffness-220 animate-damping-7 animate-delay-400`}
      >
        <div className="w-max bg-white/80 backdrop-blur-xl border border-zinc-200/80 rounded-[2.5rem] px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-between gap-8 pointer-events-auto">
          
          <Link to="/settings" className="w-12 h-12 text-zinc-400 hover:text-brandDark group relative z-10">
            <mw.div className="w-full h-full flex items-center justify-center transition-colors animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7">
              <Settings size={28} className="group-hover:rotate-45 transition-transform duration-500" />
            </mw.div>
          </Link>

          <Link to="/create" className="shrink-0 relative z-10 group">
            <mw.div className="w-16 h-16 bg-brandDark text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(24,24,27,0.4)] border-[6px] border-[#fafafa] -mt-12 group-hover:bg-brandAccent animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7">
              <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
            </mw.div>
          </Link>

          <Link to="/profile" className="w-12 h-12 text-zinc-400 hover:text-brandDark group relative z-10">
            <mw.div className="w-full h-full flex items-center justify-center transition-colors animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7">
              {currentAvatar ? (
                <div className="w-7 h-7 group-hover:scale-110 transition-transform duration-300">{currentAvatar.svg}</div>
              ) : (
                <User size={28} className="group-hover:scale-110 transition-transform duration-300" />
              )}
              {!userZipCode && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse z-10" />}
            </mw.div>
          </Link>

        </div>
      </div>

      {/* ── QR Modal ─────────────────────────────────────────────────────── */}
      {qrModalProfile && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-xl overflow-y-auto flex p-4 md:p-8 animate-in fade-in duration-200">
          <mw.button
            onClick={() => setQrModalProfile(null)}
            className="absolute top-6 right-6 md:fixed md:top-8 md:right-8 z-[110] text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full border border-white/10 shadow-xl transition-colors animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7"
          >
            <X size={24} />
          </mw.button>
          <div className="max-w-sm w-full relative m-auto pt-20 pb-8 md:py-8 animate-initial:opacity-0 animate-initial:scale-90 animate-enter:opacity-100 animate-enter:scale-100 animate-spring animate-stiffness-220 animate-damping-7">
            <div className="flex flex-col gap-4 mb-6">
              <div className="text-center sm:text-left">
                <h2 className="text-3xl font-extrabold text-white tracking-tight leading-none mb-1">Mobile ID</h2>
                <p className="text-white/60 text-xs font-bold leading-snug">Download or add to your wallet.</p>
              </div>
              <div className="flex flex-row items-center gap-3 w-full">
                <mw.button
                  onClick={() => handleAddToWallet(qrModalProfile)}
                  disabled={generatingWallet}
                  className="flex-1 relative flex items-center justify-center space-x-2 h-[46px] px-4 rounded-full border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 shadow-md disabled:opacity-50 text-white font-bold text-sm transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7"
                >
                  {generatingWallet ? <Loader2 className="animate-spin text-white" size={20} /> : <><GoogleWalletIcon /><span>Add to Google Wallet</span></>}
                </mw.button>
                <mw.button
                  onClick={() => downloadFullPass(qrModalProfile)}
                  disabled={downloading}
                  className="flex-1 flex items-center justify-center space-x-2 bg-brandGold text-brandDark h-[46px] rounded-full font-bold shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] disabled:opacity-50 text-sm transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7"
                >
                  {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                  <span>{downloading ? 'Wait...' : 'Image'}</span>
                </mw.button>
              </div>
            </div>

            <div className="bg-brandDark rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 w-full aspect-[9/16] flex flex-col relative mx-auto group">
              <div className="h-[45%] w-full relative shrink-0">
                <img src={qrModalProfile.imageUrl} alt="Profile" className="w-full h-full object-cover opacity-90" crossOrigin="anonymous" />
                <div className="absolute inset-0 bg-gradient-to-t from-brandDark via-brandDark/20 to-transparent" />
                <div className="absolute top-5 left-5 flex items-center space-x-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <img src="/kintag-logo.png" alt="Logo" className="w-5 h-5 rounded" />
                  <span className="text-white font-bold text-xs tracking-wide">KinTag</span>
                </div>
                <div className="absolute bottom-4 left-6 right-6">
                  <h3 className="text-4xl font-black text-white tracking-tight leading-none mb-1.5 drop-shadow-sm">{qrModalProfile.name}</h3>
                  <div className="flex items-center space-x-2 text-brandGold text-[11px] font-extrabold uppercase tracking-widest mb-1 drop-shadow-sm">
                    <span>{qrModalProfile.typeSpecific}</span><span>•</span>
                    <span>{getComputedAge(qrModalProfile).value} {getComputedAge(qrModalProfile).label}</span>
                  </div>
                  {qrModalProfile.type === 'kid' && qrModalProfile.specialNeeds && <p className="text-red-400 font-bold text-[10px] uppercase tracking-wider mt-1.5">{qrModalProfile.specialNeeds}</p>}
                  {qrModalProfile.type === 'pet' && (
                    <div className="space-y-0.5 mt-2">
                      <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Temperament - <span className={qrModalProfile.temperament !== 'Friendly' ? 'text-red-400' : 'text-brandGold'}>{qrModalProfile.temperament}</span></p>
                      <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Vaccination - <span className="text-brandGold">{qrModalProfile.vaccinationStatus}</span></p>
                      {qrModalProfile.microchip && <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Microchip - <span className="text-brandGold font-mono">{qrModalProfile.microchip}</span></p>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 bg-brandDark p-6 flex flex-col items-center justify-center text-center relative">
                <div className={`bg-white p-4 rounded-[2rem] shadow-xl border-[6px] ${activeStyle.border} group-hover:scale-105 transition-transform duration-500`}>
                  <QRCodeCanvas
                    id="qr-canvas-modal"
                    value={`${window.location.origin}/#/id/${qrModalProfile.id}`}
                    size={1024}
                    style={{ width: '160px', height: '160px' }}
                    level="H"
                    includeMargin={false}
                    fgColor={activeStyle.fg}
                    bgColor={activeStyle.bg}
                    imageSettings={{ src: '/kintag-logo.png', height: 224, width: 224, excavate: true }}
                  />
                </div>
                <div className="mt-6 text-center px-4">
                  <p className="text-white font-extrabold text-xl tracking-tight mb-1">Scan (if lost) for</p>
                  <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold leading-relaxed">Emergency Contact, Medical and Location<br />Info</p>
                </div>
                <div className="absolute bottom-6 text-white/20 text-[10px] font-mono tracking-widest font-bold">ID: {qrModalProfile.id.slice(0, 8).toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark as Found Modal ───────────────────────────────────────────── */}
      {foundModalProfile && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-initial:opacity-0 animate-initial:scale-90 animate-enter:opacity-100 animate-enter:scale-100 animate-spring animate-stiffness-220 animate-damping-7">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Mark as Found?</h2>
            <p className="text-zinc-500 mb-8 text-base font-medium leading-relaxed">This will immediately deactivate the distress signal and notify your local community that {foundModalProfile.name} is safe and sound.</p>
            <div className="flex flex-col gap-3">
              <mw.button onClick={() => { handleDeactivateLost(foundModalProfile); setFoundModalProfile(null); }} className="w-full bg-emerald-500 text-white py-4 rounded-full font-bold shadow-lg transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Yes, Safe & Sound</mw.button>
              <mw.button onClick={() => setFoundModalProfile(null)} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Cancel</mw.button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark as Lost Modal ────────────────────────────────────────────── */}
      {lostModalProfile && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-initial:opacity-0 animate-initial:scale-90 animate-enter:opacity-100 animate-enter:scale-100 animate-spring animate-stiffness-220 animate-damping-7">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
              <Siren size={36} className="animate-pulse" />
            </div>
            <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Mark as Lost?</h2>
            <p className="text-zinc-500 mb-8 text-base font-medium leading-relaxed">This will instantly change {lostModalProfile.name}'s public ID into a high-alert distress signal with pulsing warnings.</p>
            <div className="flex flex-col gap-3">
              <mw.button onClick={handleConfirmLost} className="w-full bg-red-600 text-white py-4 rounded-full font-bold shadow-lg transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Yes, I'm Sure</mw.button>
              <mw.button onClick={() => setLostModalProfile(null)} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Cancel</mw.button>
            </div>
          </div>
        </div>
      )}

      {/* ── Broadcast Alert Modal ─────────────────────────────────────────── */}
      {broadcastModalProfile && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-initial:opacity-0 animate-initial:scale-90 animate-enter:opacity-100 animate-enter:scale-100 animate-spring animate-stiffness-220 animate-damping-7">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-100">
              <Megaphone size={36} />
            </div>
            <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Broadcast Alert?</h2>
            <p className="text-zinc-500 mb-8 text-base font-medium leading-relaxed">Would you like to send a KinAlert? This will instantly notify all other KinTag users in your exact Pincode ({broadcastModalProfile.pincode}) to keep an eye out.</p>
            <div className="flex flex-col gap-3">
              <mw.button onClick={handleConfirmBroadcast} className="w-full bg-amber-500 text-white py-4 rounded-full font-bold shadow-lg transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Yes, Broadcast</mw.button>
              <mw.button onClick={() => setBroadcastModalProfile(null)} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Not Now</mw.button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Profile Modal ──────────────────────────────────────────── */}
      {profileToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-initial:opacity-0 animate-initial:scale-90 animate-enter:opacity-100 animate-enter:scale-100 animate-spring animate-stiffness-220 animate-damping-7">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
              <AlertOctagon size={36} />
            </div>
            <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Delete Profile?</h2>
            <p className="text-zinc-500 mb-8 text-base font-medium leading-relaxed">This action cannot be undone. This profile and its associated QR code will be permanently deactivated.</p>
            <div className="flex flex-col gap-3">
              <mw.button onClick={confirmDelete} className="w-full bg-red-600 text-white py-4 rounded-full font-bold shadow-lg transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Yes, Delete It</mw.button>
              <mw.button onClick={() => setProfileToDelete(null)} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Cancel</mw.button>
            </div>
          </div>
        </div>
      )}

      {/* ── Local Community Alert Modal ───────────────────────────────────── */}
      {activeAlertToDisplay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full text-center shadow-2xl border border-red-500/20 relative overflow-hidden animate-initial:opacity-0 animate-initial:scale-90 animate-enter:opacity-100 animate-enter:scale-100 animate-spring animate-stiffness-220 animate-damping-7">
            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
              <Siren size={48} />
            </div>
            <h2 className="text-3xl font-extrabold text-red-600 mb-2 uppercase tracking-tight">KinAlert</h2>
            <p className="text-zinc-800 font-bold text-lg mb-4">{activeAlertToDisplay.name} is missing near you ({activeAlertToDisplay.pincode})!</p>
            <p className="text-zinc-500 mb-8 text-sm font-medium">Please keep an eye out and tap below for details.</p>
            <div className="flex flex-col gap-3">
              <Link to={`/id/${activeAlertToDisplay.id}`} target="_blank" onClick={() => setDismissedAlerts([...dismissedAlerts, activeAlertToDisplay.id])}>
                <mw.div className="w-full bg-red-600 text-white py-4 rounded-full font-bold shadow-lg flex items-center justify-center transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">View Details</mw.div>
              </Link>
              <mw.button onClick={() => setDismissedAlerts([...dismissedAlerts, activeAlertToDisplay.id])} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Dismiss</mw.button>
            </div>
          </div>
        </div>
      )}

      {/* ── Found Popup Modal ─────────────────────────────────────────────── */}
      {activeFoundPopupToDisplay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full text-center shadow-2xl border border-emerald-500/20 relative overflow-hidden animate-initial:opacity-0 animate-initial:scale-90 animate-enter:opacity-100 animate-enter:scale-100 animate-spring animate-stiffness-220 animate-damping-7">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-extrabold text-emerald-600 mb-2 uppercase tracking-tight">Found!</h2>
            <p className="text-zinc-800 font-bold text-lg mb-4">{activeFoundPopupToDisplay.profileName} is safe.</p>
            <p className="text-zinc-500 mb-8 text-sm font-medium">{activeFoundPopupToDisplay.message}</p>
            <mw.button onClick={() => setDismissedFoundAlerts([...dismissedFoundAlerts, activeFoundPopupToDisplay.id])} className="w-full bg-emerald-500 text-white py-4 rounded-full font-bold shadow-lg transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Wonderful News</mw.button>
          </div>
        </div>
      )}

      {/* ── Custom Alert Modal ────────────────────────────────────────────── */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-initial:opacity-0 animate-initial:scale-90 animate-enter:opacity-100 animate-enter:scale-100 animate-spring animate-stiffness-220 animate-damping-7">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border ${
              customAlert.type === 'error'   ? 'bg-red-50 text-red-600 border-red-100'       :
              customAlert.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              customAlert.type === 'warning' ? 'bg-amber-50 text-amber-500 border-amber-100' :
              'bg-blue-50 text-blue-500 border-blue-100'
            }`}>
              {customAlert.type === 'error'   ? <AlertOctagon size={36} />  :
               customAlert.type === 'success' ? <CheckCircle2 size={36} /> :
               customAlert.type === 'warning' ? <AlertTriangle size={36} /> :
               <Info size={36} />}
            </div>
            <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">{customAlert.title}</h2>
            <p className="text-zinc-500 mb-8 text-base font-medium leading-relaxed">{customAlert.message}</p>
            <mw.button
              onClick={() => { if (customAlert.onClose) customAlert.onClose(); setCustomAlert({ ...customAlert, isOpen: false }); }}
              className="w-full bg-brandDark text-white py-4 rounded-full font-bold shadow-lg transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7"
            >
              Okay
            </mw.button>
          </div>
        </div>
      )}

    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#fafafa] p-4 md:p-8 pt-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="h-[88px] bg-zinc-200 animate-pulse rounded-[2.5rem] w-full" />
        <div className="flex gap-4">
          <div className="h-[72px] bg-zinc-200 animate-pulse rounded-[2.5rem] w-1/2" />
          <div className="h-[72px] bg-zinc-200 animate-pulse rounded-[2.5rem] w-1/2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[360px] bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-zinc-200 flex flex-col">
              <div className="h-56 bg-zinc-200 animate-pulse w-full" />
              <div className="p-5 flex-1 flex items-end">
                <div className="h-12 bg-zinc-100 animate-pulse w-full rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
