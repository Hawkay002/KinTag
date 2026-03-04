import { useState, useEffect, useRef } from 'react';
import { db, auth, messaging } from '../firebase'; 
import { collection, query, where, getDocs, getDoc, doc, deleteDoc, setDoc, onSnapshot, updateDoc, addDoc } from 'firebase/firestore'; 
import { getToken } from 'firebase/messaging'; 
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { Plus, User, QrCode, PawPrint, Trash2, Edit, Download, X, Eye, Search, AlertOctagon, Smartphone, Loader2, BellRing, Bell, MapPin, Info, CheckCircle2, AlertTriangle, EyeOff, Users, Siren, Megaphone } from 'lucide-react';

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
  const [scanToDelete, setScanToDelete] = useState(null);
  
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [showSoftAskModal, setShowSoftAskModal] = useState(false);
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [notifTab, setNotifTab] = useState('personal'); 
  const [customAlert, setCustomAlert] = useState({ isOpen: false, title: '', message: '', type: 'info', onClose: null });
  const [lastViewedPersonal, setLastViewedPersonal] = useState(null);
  const [lastViewedSystem, setLastViewedSystem] = useState(null);

  const [userFamilyId, setUserFamilyId] = useState(null);
  const [userZipCode, setUserZipCode] = useState(''); 

  // State for Lost Mode and KinAlert
  const [lostModalProfile, setLostModalProfile] = useState(null);
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
      window.history.replaceState(null, '', '/#/'); 
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

        // 🌟 Global listener for any active KinAlerts in the database
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

  // 🌟 Extract "Found" popups from incoming scans real-time
  useEffect(() => {
    if (scans.length > 0) {
      // Show found popups that were triggered within the last 5 minutes
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

  // --- KINALERT & LOST MODE LOGIC ---
  const getFamiliesInPincode = async (pincode, excludeFamilyId) => {
    const pQuery = query(collection(db, "profiles"), where("pincode", "==", pincode));
    const snap = await getDocs(pQuery);
    const families = new Set();
    snap.forEach(d => {
        const fam = d.data().familyId;
        if (fam && fam !== excludeFamilyId) families.add(fam);
    });
    return Array.from(families);
  };

  const handleConfirmLost = async () => {
    if (!lostModalProfile) return;
    const profile = lostModalProfile;
    try {
      await updateDoc(doc(db, "profiles", profile.id), { isLost: true });
      setLostModalProfile(null);
      setBroadcastModalProfile(profile);
    } catch (e) {
      showMessage("Error", "Failed to activate Lost Mode.");
    }
  };

  const handleConfirmBroadcast = async () => {
    if (!broadcastModalProfile) return;
    const profile = broadcastModalProfile;
    setBroadcastModalProfile(null);
    try {
      // Uses a brand new timestamp every time so the instant popup is guaranteed to fire for community users
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
      showMessage("Error", "Failed to broadcast KinAlert.");
    }
  };

  const handleDeactivateLost = async (profile) => {
    try {
      await updateDoc(doc(db, "profiles", profile.id), { isLost: false, kinAlertActive: false });
      
      if (profile.kinAlertActive) {
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
      showMessage("Error", "Failed to deactivate Lost Mode.");
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
          link: `https://kintag.vercel.app/#/?view=notifications` 
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
          swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
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

  const toggleProfileStatus = async (profileId, currentStatus) => {
    try {
      await updateDoc(doc(db, "profiles", profileId), { isActive: !currentStatus });
    } catch (error) {
      showMessage("Error", "Failed to change profile status.", "error");
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
              <p className="text-sm text-zinc-500 font-medium truncate max-w-[200px] md:max-w-full">Family Dashboard</p>
            </div>
          </div>
          
          <button onClick={() => navigate('/profile')} className="relative flex items-center justify-center space-x-2 text-white bg-brandDark hover:bg-brandAccent p-3 md:px-5 md:py-2.5 rounded-xl transition-all font-bold text-sm shadow-sm">
            <User size={18} />
            <span className="hidden md:inline">Profile & Family</span>
            {!userZipCode && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse" title="Missing Zip Code"></span>}
          </button>
        </div>

        <div className="flex gap-3 mb-8">
          <button onClick={handleEnableAlertsClick} disabled={isEnablingPush} className="flex-1 flex items-center justify-center space-x-2 bg-brandGold text-white p-4 rounded-2xl hover:bg-amber-500 transition-all font-bold shadow-md disabled:opacity-50">
            {isEnablingPush ? <Loader2 size={18} className="animate-spin" /> : <BellRing size={18} />}
            <span>Enable Alerts</span>
          </button>
          
          <button onClick={() => setShowNotifCenter(true)} className="flex-1 flex items-center justify-center space-x-2 bg-white text-brandDark border border-zinc-200 p-4 rounded-2xl hover:bg-zinc-100 transition-all font-bold shadow-sm relative">
            <Bell size={18} />
            <span>Notifications</span>
            {hasAnyUnread && <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm animate-pulse border border-white"></span>}
          </button>
        </div>

        {/* 🌟 TRUE SEAMLESS MARQUEE FOR DASHBOARD */}
        {localAlerts.length > 0 && (
          <Link to={`/id/${localAlerts[0].id}`} target="_blank" className="block mb-8 overflow-hidden bg-red-600 text-white rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.4)] border-4 border-red-500 relative h-16 group cursor-pointer hover:border-red-400 transition-all">
            <style>{`
              @keyframes seamlessDash { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
              .animate-seamless-dash { display: flex; width: max-content; animation: seamlessDash 15s linear infinite; }
            `}</style>
            <div className="animate-seamless-dash flex items-center h-full group-hover:[animation-play-state:paused]">
               {/* Rendering multiple sets ensures it seamlessly loops forever without snapping */}
               {[...Array(4)].map((_, i) => (
                 <div key={i} className="flex items-center shrink-0">
                   {localAlerts.map(alert => (
                     <span key={`${i}-${alert.id}`} className="mx-6 font-black text-xl tracking-[0.1em] uppercase flex items-center gap-3 whitespace-nowrap hover:underline">
                       <AlertTriangle size={24} className="animate-pulse text-brandGold shrink-0" />
                       MISSING {alert.type}: {alert.name} IN YOUR AREA ({alert.pincode}) - TAP TO HELP!
                     </span>
                   ))}
                 </div>
               ))}
            </div>
          </Link>
        )}

        {profiles.length > 0 && (
          <div className="mb-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input type="text" placeholder="Search profiles by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all shadow-sm font-medium text-brandDark" />
          </div>
        )}

        {profiles.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-3xl border border-dashed border-zinc-300">
            <div className="w-16 h-16 bg-brandMuted text-brandDark rounded-full flex items-center justify-center mx-auto mb-4"><QrCode size={28} /></div>
            <h2 className="text-xl font-bold text-brandDark mb-2 tracking-tight">No Profiles Yet</h2>
            <p className="text-zinc-500 mb-6 font-medium">Create your first digital contact card using the button below.</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 font-medium">No profiles match your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map(profile => {
              const ageInfo = getComputedAge(profile);
              return (
                <div key={profile.id} className={`bg-white rounded-3xl overflow-hidden shadow-premium border transition-all flex flex-col ${profile.isActive === false ? 'border-red-200 opacity-80 grayscale-[30%]' : profile.isLost ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-zinc-100 hover:-translate-y-1'}`}>
                  <div className="relative h-48 shrink-0">
                    <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brandDark/80 via-transparent to-transparent"></div>
                    
                    {profile.isActive === false && (
                      <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur text-white text-[10px] font-extrabold uppercase px-2 py-1 rounded-md tracking-widest shadow-sm">Disabled</div>
                    )}
                    
                    <div className="absolute top-3 right-3 flex gap-2 z-30">
                       <button 
                         disabled={!profile.isLost}
                         onClick={() => { if(profile.isLost && !profile.kinAlertActive) setBroadcastModalProfile(profile); }}
                         className={`p-2 rounded-full shadow-lg backdrop-blur-md transition-all ${profile.kinAlertActive ? 'bg-emerald-500 text-white' : profile.isLost ? 'bg-amber-500 text-white hover:scale-110' : 'bg-white/50 text-zinc-400 cursor-not-allowed'}`}
                         title={profile.kinAlertActive ? "KinAlert Active" : "Broadcast KinAlert"}
                       >
                          <Megaphone size={16} />
                       </button>
                       <button 
                         onClick={() => profile.isLost ? handleDeactivateLost(profile) : setLostModalProfile(profile)}
                         className={`p-2 rounded-full shadow-lg backdrop-blur-md transition-all hover:scale-110 ${profile.isLost ? 'bg-red-600 text-white animate-pulse' : 'bg-white/80 text-zinc-500 hover:text-red-500'}`}
                         title={profile.isLost ? "Mark as Found" : "Mark as Lost"}
                       >
                          <Siren size={16} />
                       </button>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-xl font-extrabold tracking-tight">{profile.name}</h3>
                      <p className="text-sm text-zinc-200 font-medium capitalize flex items-center gap-1.5 mt-0.5">
                        {profile.type === 'kid' ? <User size={12} /> : <PawPrint size={12} />}
                        {profile.type} • {ageInfo.value} {ageInfo.label} • {profile.gender}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white flex-1 flex flex-col justify-end">
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/id/${profile.id}`} target="_blank" className="flex-1 flex items-center justify-center space-x-1.5 bg-brandMuted hover:bg-zinc-200 text-brandDark py-2.5 rounded-xl font-bold text-sm transition-colors" title="View Public Card">
                        <Eye size={16} />
                        <span>View</span>
                      </Link>
                      <button onClick={() => toggleProfileStatus(profile.id, profile.isActive)} className={`flex items-center justify-center p-2.5 rounded-xl transition-colors ${profile.isActive === false ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`} title={profile.isActive === false ? 'Enable Profile' : 'Disable Profile'}>
                        {profile.isActive === false ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
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
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-50 via-zinc-50/80 to-transparent pointer-events-none z-40"></div>
      <Link to="/create" className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-brandDark text-white p-5 rounded-full shadow-2xl hover:bg-brandAccent transition-transform hover:scale-105 z-50 pointer-events-auto border-4 border-white">
        <Plus size={32} strokeWidth={3} />
      </Link>

      {/* 🌟 100% RELIABLE INSTANT LOST POPUP */}
      {localAlerts.filter(a => !dismissedAlerts.includes(`${a.id}-${a.kinAlertTimestamp}`)).map(alert => (
        <div key={`popup-${alert.id}-${alert.kinAlertTimestamp}`} className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-red-600 text-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl border-4 border-red-400 animate-in zoom-in-95 duration-300">
             <Siren size={48} className="mx-auto mb-4 animate-pulse text-white" />
             <h2 className="text-3xl font-black uppercase tracking-widest mb-2">URGENT KINALERT</h2>
             <p className="text-lg font-bold mb-6 leading-snug">A {alert.type} named {alert.name} has gone missing in your exact area ({alert.pincode})!</p>
             <img src={alert.imageUrl} className="w-full h-48 object-cover rounded-xl mb-6 shadow-inner border border-white/20" />
             <div className="flex flex-col gap-3">
               <Link to={`/id/${alert.id}`} target="_blank" onClick={() => setDismissedAlerts(prev => [...prev, `${alert.id}-${alert.kinAlertTimestamp}`])} className="w-full bg-white text-red-600 py-4 rounded-xl font-black text-lg shadow-lg hover:scale-[1.02] transition-transform">VIEW PROFILE & HELP</Link>
               <button onClick={() => setDismissedAlerts(prev => [...prev, `${alert.id}-${alert.kinAlertTimestamp}`])} className="text-white/70 font-bold text-sm hover:text-white py-2 transition-colors">Close for now</button>
             </div>
          </div>
        </div>
      ))}

      {/* 🌟 INSTANT FOUND POPUP */}
      {foundPopups.filter(s => !dismissedFoundAlerts.includes(s.id)).slice(0, 1).map(scan => (
        <div key={`found-popup-${scan.id}`} className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-emerald-500 text-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl border-4 border-emerald-300 animate-in zoom-in-95 duration-300">
             <CheckCircle2 size={56} className="mx-auto mb-4 text-white drop-shadow-md" />
             <h2 className="text-3xl font-black uppercase tracking-widest mb-2">SAFE & SOUND!</h2>
             <p className="text-lg font-bold mb-8 leading-snug">{scan.message}</p>
             <button onClick={() => setDismissedFoundAlerts(prev => [...prev, scan.id])} className="w-full bg-white text-emerald-600 py-4 rounded-xl font-black text-lg shadow-lg hover:scale-[1.02] transition-transform">Dismiss Update</button>
          </div>
        </div>
      ))}

      {customAlert.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${customAlert.type === 'success' ? 'bg-emerald-50 text-emerald-500' : customAlert.type === 'error' ? 'bg-red-50 text-red-600' : customAlert.type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-brandMuted text-brandDark'}`}>
              {customAlert.type === 'success' && <CheckCircle2 size={32} />}
              {customAlert.type === 'error' && <AlertOctagon size={32} />}
              {customAlert.type === 'warning' && <AlertTriangle size={32} />}
              {customAlert.type === 'info' && <Info size={32} />}
            </div>
            <h2 className="text-2xl font-extrabold text-brandDark mb-2 tracking-tight">{customAlert.title}</h2>
            <p className="text-zinc-500 mb-8 text-sm font-medium leading-relaxed">{customAlert.message}</p>
            <button onClick={() => { if(customAlert.onClose) customAlert.onClose(); setCustomAlert({ ...customAlert, isOpen: false }); }} className="w-full bg-brandDark text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-brandAccent transition-colors">Okay</button>
          </div>
        </div>
      )}

      {lostModalProfile && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-brandDark/90 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
             <Siren size={40} className="mx-auto mb-4 text-red-600" />
             <h2 className="text-2xl font-black uppercase text-brandDark tracking-widest mb-2">Mark as Lost?</h2>
             <p className="text-zinc-500 font-medium mb-6 text-sm leading-relaxed">This will instantly change {lostModalProfile.name}'s public ID into a high-alert distress signal with pulsing warnings.</p>
             <div className="flex gap-3">
               <button onClick={() => setLostModalProfile(null)} className="flex-1 bg-brandMuted text-brandDark py-3.5 rounded-xl font-bold hover:bg-zinc-200 transition-colors">Cancel</button>
               <button onClick={handleConfirmLost} className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors animate-pulse">Yes, I'm Sure</button>
             </div>
          </div>
        </div>
      )}

      {broadcastModalProfile && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-brandDark/90 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
             <Megaphone size={40} className="mx-auto mb-4 text-amber-500" />
             <h2 className="text-2xl font-black uppercase text-brandDark tracking-widest mb-2">Broadcast Alert?</h2>
             <p className="text-zinc-500 font-medium mb-6 text-sm leading-relaxed">Would you like to send a KinAlert? This will instantly notify all other KinTag users in your exact Pincode ({broadcastModalProfile.pincode}) to keep an eye out.</p>
             <div className="flex gap-3">
               <button onClick={() => setBroadcastModalProfile(null)} className="flex-1 bg-brandMuted text-brandDark py-3.5 rounded-xl font-bold hover:bg-zinc-200 transition-colors">Not Now</button>
               <button onClick={handleConfirmBroadcast} className="flex-1 bg-amber-500 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-amber-600 transition-colors">Broadcast</button>
             </div>
          </div>
        </div>
      )}

      {showSoftAskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-brandGold/10 text-brandGold rounded-full flex items-center justify-center mx-auto mb-4"><BellRing size={32} /></div>
            <h2 className="text-2xl font-extrabold text-brandDark mb-2">Enable Alerts?</h2>
            <p className="text-zinc-500 mb-6 text-sm font-medium leading-relaxed">KinTag needs permission to send you emergency push notifications when your tag is scanned.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSoftAskModal(false)} className="flex-1 bg-brandMuted text-brandDark py-3.5 rounded-xl font-bold">Maybe Later</button>
              <button onClick={processNotificationPermission} className="flex-1 bg-brandGold text-white py-3.5 rounded-xl font-bold shadow-md">Proceed</button>
            </div>
          </div>
        </div>
      )}

      {showNotifCenter && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-brandDark/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 shrink-0">
              <h2 className="text-2xl font-extrabold text-brandDark tracking-tight">Notifications</h2>
              <button onClick={() => setShowNotifCenter(false)} className="p-2 bg-white rounded-full text-zinc-500 hover:text-brandDark shadow-sm"><X size={20}/></button>
            </div>
            <div className="flex border-b border-zinc-200 shrink-0">
              <button onClick={() => setNotifTab('personal')} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 flex items-center justify-center gap-1.5 ${notifTab === 'personal' ? 'border-brandDark text-brandDark' : 'border-transparent text-zinc-400'}`}>
                Personal Scans {unreadPersonalCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{unreadPersonalCount}</span>}
              </button>
              <button onClick={() => setNotifTab('system')} className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 flex items-center justify-center gap-1.5 ${notifTab === 'system' ? 'border-brandDark text-brandDark' : 'border-transparent text-zinc-400'}`}>
                System Updates {unreadSystemCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{unreadSystemCount}</span>}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50">
              {pendingInvite && (
                <div className="bg-brandGold/10 p-5 rounded-2xl border border-brandGold/30 mb-6 shadow-sm">
                  <h3 className="font-extrabold text-brandDark flex items-center gap-2 mb-2"><Users size={18} className="text-brandGold"/> Co-Guardian Invite</h3>
                  <p className="text-sm text-zinc-600 font-medium mb-4 leading-relaxed"><strong className="text-brandDark">{pendingInvite.invitedBy}</strong> invited you to accept this request to become their kid/pet's co-guardian.</p>
                  <div className="flex gap-2">
                    <button onClick={handleAcceptInvite} className="bg-brandDark hover:bg-brandAccent text-white px-4 py-2.5 rounded-xl font-bold flex-1 transition-colors">Accept</button>
                    <button onClick={handleDeclineInvite} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl font-bold flex-1 transition-colors">Decline</button>
                  </div>
                </div>
              )}
              {notifTab === 'personal' && (
                groupedScans.length === 0 ? ( <div className="text-center mt-10 text-zinc-400 font-medium">No scans recorded yet.</div> ) : (
                  groupedScans.map(group => (
                    <div key={group.date} className="mb-6 last:mb-2">
                      <div className="flex items-center mb-4">
                        <div className="h-px bg-zinc-200 flex-1"></div><span className="px-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">{group.date}</span><div className="h-px bg-zinc-200 flex-1"></div>
                      </div>
                      <div className="space-y-3">
                        {group.items.map(scan => {
                          if (scan.type === 'kinAlert') {
                             return (
                               <div key={scan.id} className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-sm relative group">
                                 <button onClick={() => setScanToDelete(scan.id)} className="absolute top-3 right-3 p-2 text-red-300 hover:text-red-600 hover:bg-red-100 rounded-xl transition-colors"><Trash2 size={16} /></button>
                                 <div className="flex items-center justify-between mb-2 pr-10"><span className="font-extrabold text-red-800 truncate">🚨 Local KinAlert</span><span className="text-[10px] text-red-400 font-bold uppercase shrink-0">{new Date(getTime(scan.timestamp)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                                 <p className="text-sm text-red-900 font-bold mb-3 leading-relaxed">{scan.message}</p>
                                 {scan.publicLink && <a href={scan.publicLink} target="_blank" rel="noopener noreferrer" className="bg-red-600 text-white px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-700 w-full shadow-sm transition-colors"><Eye size={16}/> View Missing Profile</a>}
                               </div>
                             );
                          } else if (scan.type === 'kinAlert_found') {
                             return (
                               <div key={scan.id} className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm relative group">
                                 <button onClick={() => setScanToDelete(scan.id)} className="absolute top-3 right-3 p-2 text-emerald-300 hover:text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors"><Trash2 size={16} /></button>
                                 <div className="flex items-center justify-between mb-2 pr-10"><span className="font-extrabold text-emerald-800 truncate">✅ Found Alert</span><span className="text-[10px] text-emerald-400 font-bold uppercase shrink-0">{new Date(getTime(scan.timestamp)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                                 <p className="text-sm text-emerald-900 font-bold leading-relaxed">{scan.message}</p>
                               </div>
                             );
                          }
                          return (
                            <div key={scan.id} className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 relative group">
                              <button onClick={() => setScanToDelete(scan.id)} className="absolute top-3 right-3 p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={16} /></button>
                              <div className="flex items-center justify-between mb-2 pr-10"><span className="font-extrabold text-brandDark truncate">{scan.profileName} {scan.type === 'invite_response' ? 'Update' : 'Scanned'}</span><span className="text-[10px] text-zinc-400 font-bold uppercase shrink-0">{new Date(getTime(scan.timestamp)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                              {scan.type === 'active' ? (
                                <div className="bg-red-50 p-3 rounded-xl border border-red-100 mt-2">
                                  <p className="text-xs text-red-800 font-bold mb-3">A Good Samaritan pinpointed their exact location!</p>
                                  <a href={scan.googleMapsLink} target="_blank" rel="noopener noreferrer" className="bg-red-600 text-white px-3 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-700 w-full shadow-sm"><MapPin size={16}/> Open in Google Maps</a>
                                </div>
                              ) : scan.type === 'invite_response' ? ( <p className="text-xs text-emerald-600 font-bold flex items-start gap-1.5 mt-2 bg-emerald-50 p-3 rounded-xl border border-emerald-100 leading-relaxed"><Users size={14} className="shrink-0 mt-0.5"/> {scan.message}</p>
                              ) : ( <p className="text-xs text-zinc-500 font-medium flex items-center gap-1.5 mt-2"><Info size={14} className="shrink-0 text-brandGold"/> Passive scan near {scan.city}, {scan.region}</p> )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )
              )}
              {notifTab === 'system' && (
                systemMessages.length === 0 ? ( <div className="text-center mt-10"><Bell size={32} className="mx-auto text-zinc-300 mb-3" /><p className="text-zinc-500 font-medium text-sm">System broadcast messages from KinTag Admin will appear here.</p></div> ) : (
                  <div className="space-y-3">
                    {systemMessages.map(msg => (
                      <div key={msg.id} className="bg-brandDark text-white p-5 rounded-2xl shadow-md border border-brandDark">
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3"><span className="font-extrabold flex items-center gap-2 text-lg"><BellRing size={18} className="text-brandGold"/> {msg.title}</span><span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">{new Date(getTime(msg.timestamp)).toLocaleDateString()}</span></div>
                        <div className="text-sm text-white/80 font-medium leading-relaxed">{renderFormattedTextDark(msg.body)}</div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {profileToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-100">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5"><AlertOctagon size={32} /></div>
            <h2 className="text-2xl font-extrabold text-brandDark mb-2 tracking-tight">Delete Profile?</h2>
            <p className="text-zinc-500 mb-8 text-sm font-medium">This action cannot be undone. This profile and its associated QR code will be permanently deactivated.</p>
            <div className="flex gap-3"><button onClick={() => setProfileToDelete(null)} className="flex-1 bg-brandMuted text-brandDark py-3.5 rounded-xl font-bold hover:bg-zinc-200 transition-colors">Cancel</button><button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors">Yes, Delete</button></div>
          </div>
        </div>
      )}

      {scanToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5"><AlertOctagon size={32} /></div>
            <h2 className="text-2xl font-extrabold text-brandDark mb-2 tracking-tight">Delete Notification?</h2>
            <p className="text-zinc-500 mb-8 text-sm font-medium leading-relaxed">This action cannot be undone. This scan record will be permanently removed from your history.</p>
            <div className="flex gap-3"><button onClick={() => setScanToDelete(null)} className="flex-1 bg-brandMuted text-brandDark py-3.5 rounded-xl font-bold hover:bg-zinc-200 transition-colors">Cancel</button><button onClick={confirmDeleteScan} className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors">Yes, Delete</button></div>
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
