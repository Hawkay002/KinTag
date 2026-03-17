import { useState, useEffect, useRef } from 'react';
import { db, auth, messaging } from '../firebase';  
import { collection, query, where, getDocs, getDoc, doc, deleteDoc, setDoc, onSnapshot, updateDoc, addDoc } from 'firebase/firestore'; 
import { getToken } from 'firebase/messaging'; 
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import GoogleWalletIcon from '../components/ui/GoogleWalletIcon';
import { Plus, User, QrCode, PawPrint, Trash2, Edit, Download, X, Eye, Search, AlertOctagon, Smartphone, Loader2, BellRing, Bell, MapPin, Info, CheckCircle2, AlertTriangle, EyeOff, Users, Siren, Megaphone } from 'lucide-react';
import { avatars } from '../components/ui/avatar-picker'; 

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

const getComputedAge = (profile) => {
  if (profile.dob) {
    const dob = new Date(profile.dob);
    const today = new Date();
    let months = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
    if (today.getDate() < dob.getDate()) months--;
    if (months < 0) months = 0;
    
    if (months < 12) {
      return { value: months === 0 ? 1 : months, label: 'Mos', fullLabel: 'MOS' };
    } else {
      return { value: Math.floor(months / 12), label: 'Yrs', fullLabel: 'YRS' };
    }
  }
  return { 
    value: profile.age || 'Unknown', 
    label: profile.ageUnit === 'Months' ? 'Mos' : 'Yrs', 
    fullLabel: profile.ageUnit === 'Months' ? 'MOS' : 'YRS' 
  };
};

const renderFormattedTextDark = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const isBullet = line.trim().startsWith('-');
    let content = isBullet ? line.substring(line.indexOf('-') + 1).trim() : line;
    let htmlContent = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-white">$1</strong>').replace(/\*(.*?)\*/g, '<em class="italic text-white/90">$1</em>');
    if (isBullet) return <li key={i} className="ml-5 list-disc marker:text-brandGold pl-1 mb-1" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
    return <p key={i} className="mb-2 last:mb-0 min-h-[1rem]" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  });
};

export default function Dashboard() {
  const [profiles, setProfiles] = useState([]);
  const [scans, setScans] = useState([]);
  const [systemMessages, setSystemMessages] = useState([]);
  const [pendingInvite, setPendingInvite] = useState(null); 

  const [loading, setLoading] = useState(true);
  const [qrModalProfile, setQrModalProfile] = useState(null); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [profileToDelete, setProfileToDelete] = useState(null); 
  const [downloading, setDownloading] = useState(false);
  const [generatingWallet, setGeneratingWallet] = useState(false); // Google Wallet Loading State
  
  // SCAN DELETION STATES
  const [scanToDelete, setScanToDelete] = useState(null);
  const [selectedScans, setSelectedScans] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [showSoftAskModal, setShowSoftAskModal] = useState(false);
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [notifTab, setNotifTab] = useState('personal'); 
  const [customAlert, setCustomAlert] = useState({ isOpen: false, title: '', message: '', type: 'info', onClose: null });
  const [lastViewedPersonal, setLastViewedPersonal] = useState(null);
  const [lastViewedSystem, setLastViewedSystem] = useState(null);

  const [userFamilyId, setUserFamilyId] = useState(null);
  const [userZipCode, setUserZipCode] = useState(''); 
  const [userAvatarId, setUserAvatarId] = useState(null); 

  // ALERT MODAL STATES
  const [lostModalProfile, setLostModalProfile] = useState(null);
  const [foundModalProfile, setFoundModalProfile] = useState(null);
  const [broadcastModalProfile, setBroadcastModalProfile] = useState(null);
  const [allActiveAlerts, setAllActiveAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]); 
  const [foundPopups, setFoundPopups] = useState([]); 
  const [dismissedFoundAlerts, setDismissedFoundAlerts] = useState([]);

  const isInitialScansLoad = useRef(true);
  const isInitialSysLoad = useRef(true);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const playChime = () => {
    try {
      const audio = new Audio('/chime.mp3');
      audio.play().catch(() => {});
    } catch (err) {}
  };

  const showMessage = (title, message, type = 'info', onClose = null) => {
    setCustomAlert({ isOpen: true, title, message, type, onClose });
  };

  useEffect(() => {
    if (window.location.hash.includes('view=notifications')) {
      setShowNotifCenter(true);
      window.history.replaceState(null, '', '/#/dashboard'); 
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    let unsubProfiles, unsubScans, unsubSys, unsubInvite, unsubAlerts;

    const setupListeners = async () => {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        let currentFamilyId = currentUser.uid;

        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.lastViewedPersonal) setLastViewedPersonal(data.lastViewedPersonal);
          if (data.lastViewedSystem) setLastViewedSystem(data.lastViewedSystem);
          setUserZipCode(data.zipCode || ''); 
          setUserAvatarId(data.avatarId || null); 
          currentFamilyId = data.familyId || currentUser.uid;
        } else {
          await setDoc(userDocRef, { email: currentUser.email, familyId: currentUser.uid }, { merge: true });
        }
        
        setUserFamilyId(currentFamilyId);

        const legacyProfilesQuery = query(collection(db, "profiles"), where("userId", "==", currentUser.uid));
        const legacySnaps = await getDocs(legacyProfilesQuery);
        legacySnaps.forEach(async (d) => {
           const data = d.data();
           if (!data.familyId || data.isActive === undefined) {
             await updateDoc(doc(db, "profiles", d.id), { familyId: currentFamilyId, isActive: data.isActive !== undefined ? data.isActive : true });
           }
        });

        const legacyScansQuery = query(collection(db, "scans"), where("ownerId", "==", currentUser.uid));
        const legacyScanSnaps = await getDocs(legacyScansQuery);
        legacyScanSnaps.forEach(async (d) => {
           if (!d.data().familyId) await updateDoc(doc(db, "scans", d.id), { familyId: currentFamilyId });
        });

        const inviteRef = doc(db, "invites", currentUser.email.toLowerCase());
        unsubInvite = onSnapshot(inviteRef, (docSnap) => {
           if (docSnap.exists() && docSnap.data().status === 'pending') {
              setPendingInvite({ id: docSnap.id, ...docSnap.data() });
           } else {
              setPendingInvite(null);
           }
        });

        const qProfiles = query(collection(db, "profiles"), where("familyId", "==", currentFamilyId));
        unsubProfiles = onSnapshot(qProfiles, (snap) => {
          const fetchedProfiles = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          fetchedProfiles.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
          setProfiles(fetchedProfiles);
        });

        const qScans = query(collection(db, "scans"), where("familyId", "==", currentFamilyId));
        unsubScans = onSnapshot(qScans, (snap) => {
          if (!isInitialScansLoad.current) {
            let hasNew = false;
            snap.docChanges().forEach(change => { if (change.type === 'added') hasNew = true; });
            if (hasNew) playChime();
          }
          const fetchedScans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          fetchedScans.sort((a, b) => getTime(b.timestamp) - getTime(a.timestamp));
          setScans(fetchedScans);
          
          setSelectedScans(prev => prev.filter(id => fetchedScans.some(s => s.id === id)));
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

        const qAlerts = query(collection(db, "profiles"), where("kinAlertActive", "==", true));
        unsubAlerts = onSnapshot(qAlerts, (snap) => {
           setAllActiveAlerts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        setLoading(false);
      } catch (error) {
        console.error("Error setting up listeners:", error);
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      if (unsubProfiles) unsubProfiles();
      if (unsubScans) unsubScans();
      if (unsubSys) unsubSys();
      if (unsubInvite) unsubInvite();
      if (unsubAlerts) unsubAlerts();
    };
  }, [currentUser]);

  useEffect(() => {
    if (scans.length > 0) {
      const recentFound = scans.filter(s => s.type === 'kinAlert_found' && (Date.now() - new Date(s.timestamp).getTime() < 300000));
      setFoundPopups(recentFound);
    }
  }, [scans]);

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

  const handleConfirmLost = async () => {
    if (!lostModalProfile) return;
    const profileToUpdate = lostModalProfile;
    setLostModalProfile(null); 
    
    try {
      await updateDoc(doc(db, "profiles", profileToUpdate.id), { isLost: true });
      const updatedProfile = { ...profileToUpdate, isLost: true };
      setBroadcastModalProfile(updatedProfile);
    } catch (e) {
      showMessage("Error", "Failed to activate Lost Mode.", "error");
    }
  };

  const handleConfirmBroadcast = async () => {
    if (!broadcastModalProfile) return;
    const profile = broadcastModalProfile;
    setBroadcastModalProfile(null);
    
    if (!profile.pincode) {
        showMessage("Missing Pincode", "You need to set a local Area Pincode or Zip Code in this profile's edit settings to broadcast an alert.", "warning");
        return;
    }

    try {
      const newTimestamp = Date.now();
      await updateDoc(doc(db, "profiles", profile.id), { kinAlertActive: true, kinAlertTimestamp: newTimestamp });
      
      const uQuery = query(collection(db, "users"), where("zipCode", "==", profile.pincode));
      const uSnap = await getDocs(uQuery);
      const targetFamilies = new Set();
      uSnap.forEach(d => {
          const fam = d.data().familyId || d.id;
          if (fam !== profile.familyId) targetFamilies.add(fam);
      });
      
      targetFamilies.forEach(async (familyId) => {
          await addDoc(collection(db, "scans"), {
              familyId: familyId,
              type: 'kinAlert',
              profileName: profile.name,
              message: `🚨 MISSING ${profile.type.toUpperCase()}: ${profile.name} in your area (${profile.pincode}). Please keep an eye out!`,
              timestamp: new Date().toISOString(),
              publicLink: `${window.location.origin}/#/id/${profile.id}`
          });
      });

      uSnap.forEach(uDoc => {
          const token = uDoc.data().fcmToken;
          if (token && (uDoc.data().familyId || uDoc.id) !== profile.familyId) {
              fetch('/api/notify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      ownerId: uDoc.id,
                      title: `🚨 Local KinAlert: ${profile.name} is missing!`,
                      body: `Missing near ${profile.pincode}. Tap to view details and help.`
                  })
              }).catch(()=>{});
          }
      });

      showMessage("KinAlert Active", `Broadcasted alert to guardians in Zip Code ${profile.pincode}.`, "success");
    } catch (e) {
      showMessage("Error", "Failed to broadcast KinAlert.", "error");
    }
  };

  const handleDeactivateLost = async (profile) => {
    try {
      await updateDoc(doc(db, "profiles", profile.id), { isLost: false, kinAlertActive: false });
      
      if (profile.kinAlertActive && profile.pincode) {
          const uQuery = query(collection(db, "users"), where("zipCode", "==", profile.pincode));
          const uSnap = await getDocs(uQuery);
          const targetFamilies = new Set();
          uSnap.forEach(d => {
              const fam = d.data().familyId || d.id;
              if (fam !== profile.familyId) targetFamilies.add(fam);
          });

          targetFamilies.forEach(async (familyId) => {
              await addDoc(collection(db, "scans"), {
                  familyId: familyId,
                  type: 'kinAlert_found',
                  profileName: profile.name,
                  message: `✅ SAFE AND SOUND! ${profile.name} (${profile.pincode}) has been found. Thank you for your vigilance.`,
                  timestamp: new Date().toISOString(),
              });
          });
      }
      showMessage("Safe and Sound", `${profile.name} has been marked as found.`, "success");
    } catch (e) {
      showMessage("Error", "Failed to deactivate Lost Mode.", "error");
    }
  };

  const handleAcceptInvite = async () => {
    if (!pendingInvite) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { familyId: pendingInvite.familyId });
      await deleteDoc(doc(db, "invites", currentUser.email.toLowerCase()));
      
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const acceptName = userDoc.exists() && userDoc.data().name ? userDoc.data().name : currentUser.email;

      await addDoc(collection(db, "scans"), {
        familyId: pendingInvite.familyId,
        type: 'invite_response',
        profileName: 'Family Update',
        message: `${acceptName} accepted your co-guardian request and can now manage your profiles.`,
        timestamp: new Date().toISOString()
      });

      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: pendingInvite.inviterUid,
          title: `🤝 Guardian Joined!`,
          body: `${acceptName} accepted your invite.`,
          link: `https://kintag.vercel.app/#/dashboard?view=notifications` 
        })
      }).catch(()=>{});

      window.location.reload(); 
    } catch(e) { console.error(e); }
  };

  const handleDeclineInvite = async () => {
    if (!pendingInvite) return;
    try {
      await deleteDoc(doc(db, "invites", currentUser.email.toLowerCase()));
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const declineName = userDoc.exists() && userDoc.data().name ? userDoc.data().name : currentUser.email;
      await addDoc(collection(db, "scans"), {
        familyId: pendingInvite.familyId,
        type: 'invite_response',
        profileName: 'Family Update',
        message: `${declineName} declined your co-guardian request.`,
        timestamp: new Date().toISOString()
      });
    } catch(e) { console.error(e); }
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
          swRegistration = await navigator.serviceWorker.ready; 
        }
        const currentToken = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swRegistration });
        if (currentToken) {
          await setDoc(doc(db, "users", currentUser.uid), { fcmToken: currentToken, email: currentUser.email, lastUpdated: new Date().toISOString() }, { merge: true }); 
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
        await fetch('/api/delete-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicId }) }).catch(()=>console.log("Image delete skipped"));
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
      showMessage("Error", "Failed to delete notification.", "error");
    } finally {
      setScanToDelete(null); 
    }
  };

  const toggleScanSelection = (scanId) => {
    setSelectedScans(prev => prev.includes(scanId) ? prev.filter(id => id !== scanId) : [...prev, scanId]);
  };

  const handleSelectAll = () => {
    if (selectedScans.length === scans.length) {
      setSelectedScans([]);
    } else {
      setSelectedScans(scans.map(s => s.id));
    }
  };

  const confirmBulkDelete = async () => {
    try {
      await Promise.all(selectedScans.map(id => deleteDoc(doc(db, "scans", id))));
      setScans(scans.filter(s => !selectedScans.includes(s.id)));
      setSelectedScans([]);
      setShowBulkDeleteModal(false);
      showMessage("Success", "Selected notifications have been deleted.", "success");
    } catch (error) {
      showMessage("Error", "Failed to delete selected notifications.", "error");
    }
  };

  const toggleProfileStatus = async (profileId, currentStatus) => {
    try {
      await updateDoc(doc(db, "profiles", profileId), { isActive: !currentStatus });
    } catch (error) {
      showMessage("Error", "Failed to change profile status.", "error");
    }
  };

  // Google Wallet Backend Caller
  const handleAddToWallet = async (profile) => {
    setGeneratingWallet(true);
    try {
      const response = await fetch('/api/generate-wallet-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id, petName: profile.name })
      });
      
      const data = await response.json();
      
      if (data.token) {
        window.location.href = `https://pay.google.com/gp/v/save/${data.token}`;
      } else {
        showMessage("Wallet Generation Failed", "Failed to generate the Google Wallet pass. Please check your backend keys.", "error");
        console.error(data.error);
      }
    } catch (error) {
      console.error("Wallet Error:", error);
      showMessage("Network Error", "Something went wrong connecting to the Google Wallet server.", "error");
    } finally {
      setGeneratingWallet(false);
    }
  };

  const downloadFullPass = async (profile) => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const pixelScale = 2; const W = 1080; const H = 1920; 
      canvas.width = W * pixelScale; canvas.height = H * pixelScale; 
      ctx.scale(pixelScale, pixelScale);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';

      ctx.beginPath(); ctx.roundRect(0, 0, W, H, 80); ctx.clip(); 
      ctx.fillStyle = '#18181b'; ctx.fillRect(0, 0, W, H);

      const img = new Image(); img.crossOrigin = "anonymous"; img.src = profile.imageUrl;
      await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });

      const imgHeight = H * 0.45; 
      if (img.width && img.height) {
        const scaleFactor = Math.max(W / img.width, imgHeight / img.height);
        const drawW = W / scaleFactor; const drawH = imgHeight / scaleFactor;
        const sX = (img.width - drawW) / 2; const sY = (img.height - drawH) / 2;
        ctx.drawImage(img, sX, sY, drawW, drawH, 0, 0, W, imgHeight);
      }

      const gradient = ctx.createLinearGradient(0, imgHeight - 350, 0, imgHeight);
      gradient.addColorStop(0, "rgba(24, 24, 27, 0)"); gradient.addColorStop(1, "#18181b");
      ctx.fillStyle = gradient; ctx.fillRect(0, imgHeight - 350, W, 350);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.beginPath(); ctx.roundRect(50, 50, 220, 70, 35); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.lineWidth = 2; ctx.stroke();

      const logoImg = new Image(); logoImg.crossOrigin = "anonymous"; logoImg.src = "/kintag-logo.png";
      await new Promise((resolve) => { logoImg.onload = resolve; logoImg.onerror = resolve; });
      if (logoImg.width) ctx.drawImage(logoImg, 65, 60, 50, 50);
      
      ctx.fillStyle = 'white'; ctx.font = 'bold 30px sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText("KinTag", 130, 85);

      ctx.textBaseline = 'alphabetic';
      let textBaseY = imgHeight - 30;
      if (profile.type === 'pet') textBaseY = imgHeight - 115; 
      else if (profile.type === 'kid' && profile.specialNeeds) textBaseY = imgHeight - 75; 

      ctx.fillStyle = 'white'; ctx.font = '900 85px sans-serif'; ctx.fillText(profile.name, 60, textBaseY - 45);
      ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 28px sans-serif';
      const ageInfo = getComputedAge(profile);
      ctx.fillText(`${profile.typeSpecific || 'Family Member'}  •  ${ageInfo.value} ${ageInfo.fullLabel}`.toUpperCase(), 65, textBaseY);

      if (profile.type === 'pet') {
        ctx.font = 'bold 24px sans-serif'; let lineY = textBaseY + 38;
        ctx.fillStyle = 'white'; let label = "TEMPERAMENT - "; ctx.fillText(label, 65, lineY);
        ctx.fillStyle = profile.temperament !== 'Friendly' ? '#ef4444' : '#fbbf24'; ctx.fillText(profile.temperament.toUpperCase(), 65 + ctx.measureText(label).width, lineY);
        
        lineY += 32; ctx.fillStyle = 'white'; label = "VACCINATION STATUS - "; ctx.fillText(label, 65, lineY);
        ctx.fillStyle = '#fbbf24'; ctx.fillText(profile.vaccinationStatus.toUpperCase(), 65 + ctx.measureText(label).width, lineY);

        if (profile.microchip) {
          lineY += 32; ctx.fillStyle = 'white'; label = "MICROCHIP NUMBER - "; ctx.fillText(label, 65, lineY);
          ctx.fillStyle = '#fbbf24'; ctx.fillText(profile.microchip.toUpperCase(), 65 + ctx.measureText(label).width, lineY);
        }
      } else if (profile.type === 'kid' && profile.specialNeeds) {
        ctx.fillStyle = '#ef4444'; ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`ATTENTION: ${profile.specialNeeds}`.toUpperCase(), 65, textBaseY + 45);
      }

      const qrCanvas = document.getElementById("qr-canvas-modal");
      if (qrCanvas) {
        const boxSize = 600; const qrBoxX = (W - boxSize) / 2; const qrBoxY = imgHeight + 110; 
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 15;
        const styleTheme = QR_STYLES[profile.qrStyle || 'obsidian'];
        ctx.fillStyle = styleTheme.bg; ctx.beginPath(); ctx.roundRect(qrBoxX, qrBoxY, boxSize, boxSize, 60); ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.strokeStyle = styleTheme.hexBorder; ctx.lineWidth = 14; ctx.stroke();
        const padding = 40; const qrSize = boxSize - (padding * 2);
        ctx.imageSmoothingEnabled = false; ctx.drawImage(qrCanvas, qrBoxX + padding, qrBoxY + padding, qrSize, qrSize);
        ctx.imageSmoothingEnabled = true; 
      }

      const textY = imgHeight + 110 + 600 + 90; 
      ctx.textAlign = 'center'; ctx.fillStyle = 'white'; ctx.font = 'bold 45px sans-serif'; ctx.fillText("Scan (if lost) for", W / 2, textY);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.font = 'bold 22px sans-serif'; ctx.letterSpacing = "3px"; 
      ctx.fillText("EMERGENCY CONTACT, MEDICAL AND LOCATION", W / 2, textY + 55); ctx.fillText("INFO", W / 2, textY + 90);
      ctx.letterSpacing = "0px"; ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; ctx.font = 'bold 22px monospace';
      ctx.fillText(`ID: ${profile.id.slice(0,8).toUpperCase()}`, W / 2, H - 70);

      const link = document.createElement('a'); link.download = `${profile.name}-Mobile-ID.png`; link.href = canvas.toDataURL('image/png', 1.0); link.click();
    } catch (e) {
      showMessage("Download Failed", "Could not generate image due to device restrictions. Please take a screenshot instead.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const filteredProfiles = profiles.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const activeStyle = qrModalProfile ? QR_STYLES[qrModalProfile.qrStyle || 'obsidian'] : QR_STYLES.obsidian;
  
  const unreadPersonalCount = lastViewedPersonal ? scans.filter(scan => getTime(scan.timestamp) > new Date(lastViewedPersonal).getTime()).length : scans.length;
  const unreadSystemCount = lastViewedSystem ? systemMessages.filter(msg => getTime(msg.timestamp) > new Date(lastViewedSystem).getTime()).length : systemMessages.length;
  const hasAnyUnread = unreadPersonalCount > 0 || unreadSystemCount > 0 || pendingInvite;

  const localAlerts = allActiveAlerts.filter(a => a.pincode === userZipCode && a.familyId !== userFamilyId);
  const activeAlertToDisplay = localAlerts.find(a => !dismissedAlerts.includes(a.id));
  const activeFoundPopupToDisplay = foundPopups.find(p => !dismissedFoundAlerts.includes(p.id));

  const groupedScans = [];
  scans.forEach(scan => {
    const dateObj = new Date(getTime(scan.timestamp));
    const today = new Date(); const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    let dateStr = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    if (dateObj.toDateString() === today.toDateString()) dateStr = 'Today';
    else if (dateObj.toDateString() === yesterday.toDateString()) dateStr = 'Yesterday';
    let group = groupedScans.find(g => g.date === dateStr);
    if (!group) { group = { date: dateStr, items: [] }; groupedScans.push(group); }
    group.items.push(scan);
  });

  const currentAvatar = avatars.find(a => a.id === userAvatarId) || null;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] p-4 md:p-8 relative pb-32 selection:bg-brandGold selection:text-white">
      
      {/* Premium Background Elements */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-brandGold/10 via-emerald-400/5 to-transparent rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="max-w-5xl mx-auto relative z-10 animate-in fade-in duration-700 pt-4">
        
        {/* HEADER */}
        <div className="flex justify-between items-center gap-4 mb-8 bg-white/80 backdrop-blur-xl p-5 md:px-8 md:py-6 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-200/80">
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <img src="/kintag-logo.png" alt="KinTag Logo" className="w-12 h-12 rounded-[1rem] shadow-sm" />
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-brandDark tracking-tight leading-none mb-0.5">KinTag</h1>
              <p className="text-sm text-zinc-500 font-medium truncate max-w-[200px] md:max-w-full">Family Dashboard</p>
            </div>
          </div>
          
          <button onClick={() => navigate('/profile')} className="relative flex items-center justify-center bg-white border border-zinc-200 hover:border-brandDark/30 p-2 md:pr-5 md:pl-2 md:py-2 rounded-full transition-all shadow-sm hover:shadow-md group active:scale-95 shrink-0">
            <div className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-400 shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-300 p-0.5 border border-zinc-200">
               {currentAvatar ? currentAvatar.svg : <User size={20} />}
            </div>
            <span className="hidden md:inline ml-3 font-bold text-sm text-brandDark">Profile</span>
            {!userZipCode && <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse z-10" title="Missing Zip Code"></span>}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-10">
          <button onClick={handleEnableAlertsClick} disabled={isEnablingPush} className="flex-1 flex items-center justify-center space-x-2 bg-brandGold text-white p-4 md:py-5 rounded-[2rem] hover:bg-amber-500 transition-all font-bold shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0">
            {isEnablingPush ? <Loader2 size={20} className="animate-spin" /> : <BellRing size={20} />}
            <span>Enable Alerts</span>
          </button>
          
          <button onClick={() => setShowNotifCenter(true)} className="flex-1 flex items-center justify-center space-x-2 bg-white/80 backdrop-blur-md text-brandDark border border-zinc-200/80 p-4 md:py-5 rounded-[2rem] hover:bg-white transition-all font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 relative">
            <Bell size={20} />
            <span>Notifications</span>
            {hasAnyUnread && <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full shadow-sm animate-pulse border-2 border-white"></span>}
          </button>
        </div>

        {/* TRUE SEAMLESS MARQUEE FOR LOCAL ALERTS */}
        {localAlerts.length > 0 && (
          <Link to={`/id/${localAlerts[0].id}`} target="_blank" className="block mb-10 overflow-hidden bg-red-600 text-white rounded-[2rem] shadow-[0_10px_30px_rgba(239,68,68,0.4)] border-[6px] border-red-500 relative h-[72px] group cursor-pointer hover:border-red-400 transition-all active:scale-[0.98]">
            <style>{`
              @keyframes seamlessDash { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
              .animate-seamless-dash { display: flex; width: max-content; animation: seamlessDash 15s linear infinite; }
            `}</style>
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
          </Link>
        )}

        {profiles.length > 0 && (
          <div className="mb-10 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-brandDark" size={20} />
            <input type="text" placeholder="Search profiles by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-5 py-4 md:py-5 bg-white/80 backdrop-blur-xl border border-zinc-200/80 rounded-[2rem] focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 outline-none transition-all shadow-sm hover:shadow-md font-medium text-brandDark text-lg" />
          </div>
        )}

        {profiles.length === 0 ? (
          <div className="text-center bg-white/50 backdrop-blur-md p-16 rounded-[3rem] border-2 border-dashed border-zinc-300 shadow-sm">
            <div className="w-20 h-20 bg-zinc-100 text-zinc-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner"><QrCode size={36} /></div>
            <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">No Profiles Yet</h2>
            <p className="text-zinc-500 mb-8 font-medium text-lg max-w-sm mx-auto leading-relaxed">Create your very first digital contact card using the big plus button below.</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 font-bold text-lg">No profiles match your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProfiles.map(profile => {
              const ageInfo = getComputedAge(profile);
              return (
                <div key={profile.id} className={`bg-white/90 backdrop-blur-md rounded-[2.5rem] overflow-hidden border shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 flex flex-col group ${profile.isActive === false ? 'border-red-200 opacity-70 grayscale-[50%]' : profile.isLost ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'border-zinc-200/80 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:border-brandDark/20'}`}>
                  <div className="relative h-56 shrink-0 overflow-hidden bg-zinc-100">
                    <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brandDark/90 via-brandDark/20 to-transparent pointer-events-none"></div>
                    
                    {profile.isActive === false && (
                      <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-md text-white text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg tracking-widest shadow-lg border border-white/20">Disabled</div>
                    )}
                    
                    <div className="absolute top-4 right-4 flex gap-2 z-30">
                       <button 
                         disabled={!profile.isLost || profile.kinAlertActive}
                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBroadcastModalProfile(profile); }}
                         className={`p-2.5 rounded-xl shadow-lg backdrop-blur-md transition-all active:scale-95 ${profile.kinAlertActive ? 'bg-emerald-500 text-white cursor-default' : profile.isLost ? 'bg-amber-500 text-white hover:scale-110 hover:bg-amber-400' : 'bg-white/50 text-zinc-500 cursor-not-allowed'}`}
                         title={profile.kinAlertActive ? "KinAlert Active" : "Broadcast KinAlert"}
                       >
                          <Megaphone size={18} />
                       </button>
                       <button 
                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); profile.isLost ? setFoundModalProfile(profile) : setLostModalProfile(profile); }}
                         className={`p-2.5 rounded-xl shadow-lg backdrop-blur-md transition-all active:scale-95 ${profile.isLost ? 'bg-red-600 text-white animate-pulse hover:bg-red-500' : 'bg-white/80 text-zinc-600 hover:text-red-600 hover:bg-white'}`}
                         title={profile.isLost ? "Mark as Found" : "Mark as Lost"}
                       >
                          <Siren size={18} />
                       </button>
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
                      <Link to={`/id/${profile.id}`} target="_blank" className="flex-1 flex items-center justify-center space-x-2 bg-zinc-50 border border-zinc-200 hover:bg-white hover:shadow-sm text-brandDark py-3 rounded-2xl font-bold text-sm transition-all active:scale-95" title="View Public Card">
                        <Eye size={16} />
                        <span>View</span>
                      </Link>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleProfileStatus(profile.id, profile.isActive); }} className={`flex items-center justify-center p-3 rounded-2xl transition-all shadow-sm active:scale-95 ${profile.isActive === false ? 'bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 border border-red-100 text-red-600 hover:bg-red-100'}`} title={profile.isActive === false ? 'Enable Profile' : 'Disable Profile'}>
                        {profile.isActive === false ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQrModalProfile(profile); }} className="bg-amber-50 border border-amber-100 hover:bg-amber-100 text-amber-600 p-3 rounded-2xl transition-all shadow-sm active:scale-95" title="Mobile ID & QR">
                        <Smartphone size={18} />
                      </button>
                      <Link to={`/edit/${profile.id}`} className="bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-600 p-3 rounded-2xl transition-all shadow-sm active:scale-95" title="Edit Profile">
                        <Edit size={18} />
                      </Link>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setProfileToDelete({ id: profile.id, imageUrl: profile.imageUrl }); }} className="bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-500 p-3 rounded-2xl transition-all shadow-sm active:scale-95" title="Delete Profile">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#fafafa] via-[#fafafa]/80 to-transparent pointer-events-none z-40"></div>
      <Link to="/create" className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-brandDark text-white p-5 rounded-full shadow-[0_10px_40px_rgba(24,24,27,0.4)] hover:bg-brandAccent transition-all hover:scale-105 active:scale-95 z-50 pointer-events-auto border-4 border-white group">
        <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
      </Link>

      {/* --- MODALS --- */}

      {/* QR Modal (WITH WALLET BUTTON) */}
      {qrModalProfile && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-xl overflow-y-auto flex p-4 md:p-8 animate-in fade-in duration-200">
          <button onClick={() => setQrModalProfile(null)} className="absolute top-6 right-6 md:fixed md:top-8 md:right-8 z-[110] text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition shadow-xl border border-white/10"><X size={24} /></button>
          <div className="max-w-sm w-full relative m-auto pt-20 pb-8 md:py-8 animate-in zoom-in-95 duration-300">
            
            {/* Modal Header with Dual Buttons */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="text-center sm:text-left">
                 <h2 className="text-3xl font-extrabold text-white tracking-tight leading-none mb-1">Mobile ID</h2>
                 <p className="text-white/60 text-xs font-bold leading-snug">Download or add to your wallet.</p>
              </div>
              
              <div className="flex flex-row items-center gap-3 w-full">

                <button 
  onClick={() => handleAddToWallet(qrModalProfile)} 
  disabled={generatingWallet} 
  className="flex-1 relative flex items-center justify-center space-x-2 h-[46px] px-4 rounded-full border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 transition-all shadow-md disabled:opacity-50 active:scale-95 text-white font-bold text-sm"
>
  {generatingWallet ? (
    <Loader2 className="animate-spin text-white" size={20} />
  ) : (
    <>
      <GoogleWalletIcon />
      <span>Add to Google Wallet</span>
    </>
  )}
</button>
                
                <button onClick={() => downloadFullPass(qrModalProfile)} disabled={downloading} className="flex-1 flex items-center justify-center space-x-2 bg-brandGold text-brandDark h-[46px] rounded-full font-bold shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all disabled:opacity-50 text-sm active:scale-95">
                  {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                  <span className="inline">{downloading ? 'Wait...' : 'Image'}</span>
                </button>
              </div>
            </div>

            <div className="bg-brandDark rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 w-full aspect-[9/16] flex flex-col relative mx-auto group">
              <div className="h-[45%] w-full relative shrink-0">
                <img src={qrModalProfile.imageUrl} alt="Profile" className="w-full h-full object-cover opacity-90" crossOrigin="anonymous" />
                <div className="absolute inset-0 bg-gradient-to-t from-brandDark via-brandDark/20 to-transparent"></div>
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
                  <QRCodeCanvas id="qr-canvas-modal" value={`${window.location.origin}/#/id/${qrModalProfile.id}`} size={1024} style={{ width: '160px', height: '160px' }} level="H" includeMargin={false} fgColor={activeStyle.fg} bgColor={activeStyle.bg} imageSettings={{ src: "/kintag-logo.png", height: 224, width: 224, excavate: true }} />
                </div>
                <div className="mt-6 text-center px-4">
                  <p className="text-white font-extrabold text-xl tracking-tight mb-1">Scan (if lost) for</p>
                  <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold leading-relaxed">Emergency Contact, Medical and Location<br/>Info</p>
                </div>
                <div className="absolute bottom-6 text-white/20 text-[10px] font-mono tracking-widest font-bold">ID: {qrModalProfile.id.slice(0,8).toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Center */}
      {showNotifCenter && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-zinc-950/40 backdrop-blur-sm overflow-hidden">
          <div className="bg-white w-full max-w-md h-full shadow-[auto_0_40px_rgba(0,0,0,0.2)] flex flex-col animate-in slide-in-from-right duration-300 relative border-l border-zinc-200/50">
            <div className="p-6 md:p-8 pb-4 border-b border-zinc-100 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-3xl font-extrabold text-brandDark tracking-tight">Updates</h2>
              <button onClick={() => setShowNotifCenter(false)} className="p-2.5 bg-zinc-50 rounded-full text-zinc-500 hover:text-brandDark hover:bg-zinc-100 transition-colors border border-zinc-200 shadow-sm"><X size={20}/></button>
            </div>
            <div className="flex border-b border-zinc-200 shrink-0 px-4 pt-2 bg-white">
              <button onClick={() => setNotifTab('personal')} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 flex items-center justify-center gap-2 ${notifTab === 'personal' ? 'border-brandDark text-brandDark' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}>
                Personal {unreadPersonalCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{unreadPersonalCount}</span>}
              </button>
              <button onClick={() => setNotifTab('system')} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 flex items-center justify-center gap-2 ${notifTab === 'system' ? 'border-brandDark text-brandDark' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}>
                System {unreadSystemCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{unreadSystemCount}</span>}
              </button>
            </div>
            
            {/* BULK DELETE UI */}
            {notifTab === 'personal' && scans.length > 0 && (
              <div className="bg-white px-6 py-4 border-b border-zinc-100 flex justify-between items-center shrink-0">
                <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-brandDark select-none">
                  <input 
                    type="checkbox" 
                    checked={selectedScans.length === scans.length && scans.length > 0} 
                    onChange={handleSelectAll} 
                    className="w-5 h-5 rounded border-zinc-300 text-brandDark focus:ring-brandDark cursor-pointer transition-all" 
                  />
                  Select All
                </label>
                {selectedScans.length > 0 && (
                  <button 
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
                  >
                    <Trash2 size={14} /> Delete ({selectedScans.length})
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-zinc-50">
              {pendingInvite && (
                <div className="bg-brandGold/5 p-6 rounded-[2rem] border border-brandGold/20 mb-6 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brandGold/10 rounded-full blur-2xl pointer-events-none group-hover:bg-brandGold/20 transition-colors"></div>
                  <h3 className="font-extrabold text-brandDark flex items-center gap-2 mb-3 text-lg"><Users size={20} className="text-brandGold"/> Co-Guardian Invite</h3>
                  <p className="text-sm text-zinc-600 font-medium mb-6 leading-relaxed relative z-10"><strong className="text-brandDark">{pendingInvite.invitedBy}</strong> invited you to accept this request to become their kid/pet's co-guardian.</p>
                  <div className="flex gap-3 relative z-10">
                    <button onClick={handleAcceptInvite} className="bg-brandDark hover:bg-brandAccent text-white py-3.5 rounded-full font-bold flex-1 transition-all shadow-md active:scale-95">Accept</button>
                    <button onClick={handleDeclineInvite} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 py-3.5 rounded-full font-bold flex-1 transition-colors shadow-sm">Decline</button>
                  </div>
                </div>
              )}
              {notifTab === 'personal' && (
                groupedScans.length === 0 ? ( 
                  <div className="text-center mt-20">
                     <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400"><Bell size={24}/></div>
                     <p className="text-zinc-500 font-medium text-lg tracking-tight">No scans recorded yet.</p>
                  </div> 
                ) : (
                  groupedScans.map(group => (
                    <div key={group.date} className="mb-8 last:mb-2">
                      <div className="flex items-center mb-5">
                        <div className="h-px bg-zinc-200 flex-1"></div><span className="px-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest bg-zinc-50">{group.date}</span><div className="h-px bg-zinc-200 flex-1"></div>
                      </div>
                      <div className="space-y-4">
                        {group.items.map(scan => {
                          if (scan.type === 'kinAlert') {
                             return (
                               <div key={scan.id} className="bg-red-50 p-4 sm:p-5 rounded-[2rem] border border-red-200 shadow-sm relative group overflow-hidden flex items-start gap-3">
                                 <input 
                                   type="checkbox" 
                                   checked={selectedScans.includes(scan.id)} 
                                   onChange={() => toggleScanSelection(scan.id)} 
                                   className="w-5 h-5 mt-1 rounded border-zinc-300 text-brandDark focus:ring-brandDark cursor-pointer shrink-0 z-20" 
                                 />
                                 <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none z-0"></div>
                                 <button onClick={() => setScanToDelete(scan.id)} className="absolute top-4 right-4 p-2 text-red-300 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors z-10"><Trash2 size={16} /></button>
                                 <div className="flex-1 min-w-0 relative z-10">
                                   <div className="flex items-center justify-between mb-3 pr-10"><span className="font-extrabold text-red-800 text-lg flex items-center gap-2"><Siren size={18}/> KinAlert</span><span className="text-[10px] text-red-400 font-bold uppercase shrink-0 bg-red-100 px-2 py-1 rounded-md">{new Date(getTime(scan.timestamp)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                                   <p className="text-sm text-red-900 font-bold mb-4 leading-relaxed">{scan.message}</p>
                                   {scan.publicLink && <a href={scan.publicLink} target="_blank" rel="noopener noreferrer" className="bg-red-600 text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-700 w-full shadow-md transition-all active:scale-95"><Eye size={18}/> View Profile</a>}
                                 </div>
                               </div>
                             );
                          } else if (scan.type === 'kinAlert_found') {
                             return (
                               <div key={scan.id} className="bg-emerald-50 p-4 sm:p-5 rounded-[2rem] border border-emerald-200 shadow-sm relative group overflow-hidden flex items-start gap-3">
                                 <input 
                                   type="checkbox" 
                                   checked={selectedScans.includes(scan.id)} 
                                   onChange={() => toggleScanSelection(scan.id)} 
                                   className="w-5 h-5 mt-1 rounded border-zinc-300 text-brandDark focus:ring-brandDark cursor-pointer shrink-0 z-20" 
                                 />
                                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none z-0"></div>
                                 <button onClick={() => setScanToDelete(scan.id)} className="absolute top-4 right-4 p-2 text-emerald-300 hover:text-emerald-600 hover:bg-emerald-100 rounded-full transition-colors z-10"><Trash2 size={16} /></button>
                                 <div className="flex-1 min-w-0 relative z-10">
                                   <div className="flex items-center justify-between mb-3 pr-10"><span className="font-extrabold text-emerald-800 text-lg flex items-center gap-2"><CheckCircle2 size={18}/> Found Alert</span><span className="text-[10px] text-emerald-400 font-bold uppercase shrink-0 bg-emerald-100 px-2 py-1 rounded-md">{new Date(getTime(scan.timestamp)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                                   <p className="text-sm text-emerald-900 font-bold leading-relaxed">{scan.message}</p>
                                 </div>
                               </div>
                             );
                          }
                          return (
                            <div key={scan.id} className="bg-white p-4 sm:p-5 rounded-[2rem] shadow-sm border border-zinc-200 relative group transition-shadow hover:shadow-md flex items-start gap-3">
                              <input 
                                type="checkbox" 
                                checked={selectedScans.includes(scan.id)} 
                                onChange={() => toggleScanSelection(scan.id)} 
                                className="w-5 h-5 mt-1 rounded border-zinc-300 text-brandDark focus:ring-brandDark cursor-pointer shrink-0 z-20" 
                              />
                              <button onClick={() => setScanToDelete(scan.id)} className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"><Trash2 size={16} /></button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-3 pr-8">
                                  <span className="font-extrabold text-brandDark text-lg tracking-tight truncate">{scan.profileName} {scan.type === 'invite_response' ? 'Update' : 'Scanned'}</span>
                                  <span className="text-[10px] text-zinc-400 font-bold uppercase shrink-0 bg-zinc-50 border border-zinc-100 px-2 py-1 rounded-md">{new Date(getTime(scan.timestamp)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                {scan.type === 'active' ? (
                                  <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 mt-2">
                                    <p className="text-xs text-red-800 font-bold mb-4 flex items-center gap-2"><MapPin size={16} className="text-red-500 shrink-0"/> A Good Samaritan pinpointed their exact location!</p>
                                    <a href={scan.googleMapsLink} target="_blank" rel="noopener noreferrer" className="bg-red-600 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-700 w-full shadow-md active:scale-95 transition-all">Open in Google Maps</a>
                                  </div>
                                ) : scan.type === 'invite_response' ? ( 
                                  <p className="text-sm text-emerald-700 font-bold flex items-start gap-2 mt-2 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 leading-relaxed">
                                    <Users size={16} className="shrink-0 mt-0.5 text-emerald-500"/> {scan.message}
                                  </p>
                                ) : ( 
                                  <p className="text-sm text-zinc-500 font-medium flex items-center gap-2 mt-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                                    <Info size={16} className="shrink-0 text-brandGold"/> Passive scan near <strong className="text-brandDark font-bold">{scan.city}, {scan.region}</strong>
                                  </p> 
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )
              )}
              {notifTab === 'system' && (
                systemMessages.length === 0 ? ( 
                  <div className="text-center mt-20">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400"><BellRing size={24}/></div>
                    <p className="text-zinc-500 font-medium text-lg tracking-tight">No system updates yet.</p>
                  </div> 
                ) : (
                  <div className="space-y-4">
                    {systemMessages.map(msg => (
                      <div key={msg.id} className="bg-brandDark text-white p-6 rounded-[2rem] shadow-xl border border-zinc-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-brandGold/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-brandGold/20 transition-colors"></div>
                        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4 relative z-10">
                          <span className="font-extrabold flex items-center gap-2 text-lg tracking-tight"><BellRing size={20} className="text-brandGold"/> {msg.title}</span>
                          <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md border border-white/5">{new Date(getTime(msg.timestamp)).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm text-white/80 font-medium leading-relaxed relative z-10">{renderFormattedTextDark(msg.body)}</div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mark as Found Modal */}
      {foundModalProfile && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
             <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
                <CheckCircle2 size={36} />
             </div>
             <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Mark as Found?</h2>
             <p className="text-zinc-500 mb-8 text-base font-medium leading-relaxed">This will immediately deactivate the distress signal and notify your local community that {foundModalProfile.name} is safe and sound.</p>
             <div className="flex flex-col gap-3">
               <button onClick={() => { handleDeactivateLost(foundModalProfile); setFoundModalProfile(null); }} className="w-full bg-emerald-500 text-white py-4 rounded-full font-bold shadow-lg hover:bg-emerald-600 hover:-translate-y-0.5 active:scale-95 transition-all">Yes, Safe & Sound</button>
               <button onClick={() => setFoundModalProfile(null)} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold hover:bg-zinc-200 transition-colors">Cancel</button>
             </div>
          </div>
        </div>
      )}

      {/* Profile Lost Confirmation Modal */}
      {lostModalProfile && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
             <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
                <Siren size={36} className="animate-pulse" />
             </div>
             <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Mark as Lost?</h2>
             <p className="text-zinc-500 mb-8 text-base font-medium leading-relaxed">This will instantly change {lostModalProfile.name}'s public ID into a high-alert distress signal with pulsing warnings.</p>
             <div className="flex flex-col gap-3">
               <button onClick={handleConfirmLost} className="w-full bg-red-600 text-white py-4 rounded-full font-bold shadow-lg hover:bg-red-700 hover:-translate-y-0.5 active:scale-95 transition-all">Yes, I'm Sure</button>
               <button onClick={() => setLostModalProfile(null)} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold hover:bg-zinc-200 transition-colors">Cancel</button>
             </div>
          </div>
        </div>
      )}

      {/* Broadcast Alert Modal */}
      {broadcastModalProfile && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
             <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-100">
                <Megaphone size={36} />
             </div>
             <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Broadcast Alert?</h2>
             <p className="text-zinc-500 mb-8 text-base font-medium leading-relaxed">Would you like to send a KinAlert? This will instantly notify all other KinTag users in your exact Pincode ({broadcastModalProfile.pincode}) to keep an eye out.</p>
             <div className="flex flex-col gap-3">
               <button onClick={handleConfirmBroadcast} className="w-full bg-amber-500 text-white py-4 rounded-full font-bold shadow-lg hover:bg-amber-600 hover:-translate-y-0.5 active:scale-95 transition-all">Yes, Broadcast</button>
               <button onClick={() => setBroadcastModalProfile(null)} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold hover:bg-zinc-200 transition-colors">Not Now</button>
             </div>
          </div>
        </div>
      )}

      {/* Local Community Alerts (Popup when someone else broadcasts) */}
      {activeAlertToDisplay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden border border-red-500/20">
             <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
                <Siren size={48} />
             </div>
             <h2 className="text-3xl font-extrabold text-red-600 mb-2 uppercase tracking-tight">Kinalert</h2>
             <p className="text-zinc-800 font-bold text-lg mb-4">{activeAlertToDisplay.name} is missing near you ({activeAlertToDisplay.pincode})!</p>
             <p className="text-zinc-500 mb-8 text-sm font-medium">Please keep an eye out and tap below for details.</p>
             <div className="flex flex-col gap-3">
               <Link to={`/id/${activeAlertToDisplay.id}`} target="_blank" onClick={() => setDismissedAlerts([...dismissedAlerts, activeAlertToDisplay.id])} className="w-full bg-red-600 text-white py-4 rounded-full font-bold shadow-lg hover:bg-red-700 active:scale-95 transition-all">View Details</Link>
               <button onClick={() => setDismissedAlerts([...dismissedAlerts, activeAlertToDisplay.id])} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold hover:bg-zinc-200 transition-colors">Dismiss</button>
             </div>
          </div>
        </div>
      )}

      {activeFoundPopupToDisplay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden border border-emerald-500/20">
             <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CheckCircle2 size={48} />
             </div>
             <h2 className="text-3xl font-extrabold text-emerald-600 mb-2 uppercase tracking-tight">Found!</h2>
             <p className="text-zinc-800 font-bold text-lg mb-4">{activeFoundPopupToDisplay.profileName} is safe.</p>
             <p className="text-zinc-500 mb-8 text-sm font-medium">{activeFoundPopupToDisplay.message}</p>
             <button onClick={() => setDismissedFoundAlerts([...dismissedFoundAlerts, activeFoundPopupToDisplay.id])} className="w-full bg-emerald-500 text-white py-4 rounded-full font-bold shadow-lg hover:bg-emerald-600 active:scale-95 transition-all">Wonderful News</button>
          </div>
        </div>
      )}

      {/* Delete Profile Modal */}
      {profileToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
              <AlertOctagon size={36} />
            </div>
            <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Delete Profile?</h2>
            <p className="text-zinc-500 mb-8 text-base font-medium leading-relaxed">This action cannot be undone. This profile and its associated QR code will be permanently deactivated.</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDelete} className="w-full bg-red-600 text-white py-4 rounded-full font-bold shadow-lg hover:bg-red-700 hover:-translate-y-0.5 active:scale-95 transition-all">Yes, Delete It</button>
              <button onClick={() => setProfileToDelete(null)} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold hover:bg-zinc-200 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Scan Modal */}
      {scanToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
              <Trash2 size={36} />
            </div>
            <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Delete Record?</h2>
            <p className="text-zinc-500 mb-8 text-base font-medium leading-relaxed">This action cannot be undone. This scan record will be permanently removed from your history.</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDeleteScan} className="w-full bg-red-600 text-white py-4 rounded-full font-bold shadow-lg hover:bg-red-700 hover:-translate-y-0.5 active:scale-95 transition-all">Yes, Delete</button>
              <button onClick={() => setScanToDelete(null)} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold hover:bg-zinc-200 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
              <Trash2 size={36} />
            </div>
            <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Delete {selectedScans.length} Records?</h2>
            <p className="text-zinc-500 mb-8 text-base font-medium leading-relaxed">This action cannot be undone. These scan records will be permanently removed from your history.</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmBulkDelete} className="w-full bg-red-600 text-white py-4 rounded-full font-bold shadow-lg hover:bg-red-700 hover:-translate-y-0.5 active:scale-95 transition-all">Yes, Delete All</button>
              <button onClick={() => setShowBulkDeleteModal(false)} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold hover:bg-zinc-200 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Soft Ask Notification Permission Modal */}
      {showSoftAskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-brandGold/10 text-brandGold rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-brandGold/20"><BellRing size={36} /></div>
            <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Enable Alerts?</h2>
            <p className="text-zinc-500 mb-8 text-base font-medium leading-relaxed">KinTag needs permission to send you emergency push notifications when your tag is scanned.</p>
            <div className="flex flex-col gap-3">
              <button onClick={processNotificationPermission} className="w-full bg-brandGold text-white py-4 rounded-full font-bold shadow-lg hover:bg-amber-500 hover:-translate-y-0.5 active:scale-95 transition-all">Proceed</button>
              <button onClick={() => setShowSoftAskModal(false)} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold hover:bg-zinc-200 transition-colors">Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border ${
              customAlert.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' :
              customAlert.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              customAlert.type === 'warning' ? 'bg-amber-50 text-amber-500 border-amber-100' :
              'bg-blue-50 text-blue-500 border-blue-100'
            }`}>
              {customAlert.type === 'error' ? <AlertOctagon size={36} /> :
               customAlert.type === 'success' ? <CheckCircle2 size={36} /> :
               customAlert.type === 'warning' ? <AlertTriangle size={36} /> :
               <Info size={36} />}
            </div>
            <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">{customAlert.title}</h2>
            <p className="text-zinc-500 mb-8 text-base font-medium leading-relaxed">{customAlert.message}</p>
            <button onClick={() => {
              if (customAlert.onClose) customAlert.onClose();
              setCustomAlert({ ...customAlert, isOpen: false });
            }} className="w-full bg-brandDark text-white py-4 rounded-full font-bold shadow-lg hover:bg-brandAccent active:scale-95 transition-all">
              Okay
            </button>
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
        <div className="h-[88px] bg-zinc-200 animate-pulse rounded-[2.5rem] w-full"></div>
        <div className="flex gap-4">
           <div className="h-[72px] bg-zinc-200 animate-pulse rounded-[2.5rem] w-1/2"></div>
           <div className="h-[72px] bg-zinc-200 animate-pulse rounded-[2.5rem] w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[360px] bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-zinc-200 flex flex-col">
              <div className="h-56 bg-zinc-200 animate-pulse w-full"></div>
              <div className="p-5 flex-1 flex items-end">
                <div className="h-12 bg-zinc-100 animate-pulse w-full rounded-2xl"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
