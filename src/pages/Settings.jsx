import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, updateDoc, addDoc, onSnapshot } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft, Users, Mail, CheckCircle2, Loader2, Copy, AlertOctagon, X, Trash2, UserMinus, Share2, LifeBuoy, Info, ChevronDown, Check, Smartphone, Download, Send, User, Clock, History, Link as LinkIcon, Timer, CalendarDays, CheckSquare, Square, ShieldAlert, Plus, Phone, ScanFace, Lock, Unlock, FingerprintPattern } from 'lucide-react'; 
import { HugeiconsIcon } from "@hugeicons/react";
import { WhatsappIcon, TelegramIcon } from "@hugeicons/core-free-icons";
import { sortedCountryCodes } from '../data/countryCodes'; 
import { avatars } from '../components/ui/avatar-picker'; 

export default function Settings() {
  const navigate = useNavigate();
  
  // --- Core User & Family State ---
  const [userData, setUserData] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [profiles, setProfiles] = useState([]); 
  const [inviteEmail, setInviteEmail] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  
  const [guardianToRemove, setGuardianToRemove] = useState(null);

  // --- Caretaker (Babysitter) CRM State ---
  const [careSessions, setCareSessions] = useState([]);
  const [careTab, setCareTab] = useState('active'); 
  const [showCareModal, setShowCareModal] = useState(false);
  const [careForm, setCareForm] = useState({
    name: '', countryCode: '+1', countryIso: 'us', phone: '',
    selectedProfiles: [], days: 0, hours: 0, minutes: 0
  });
  const [careLoading, setCareLoading] = useState(false);
  const [generatedCareLink, setGeneratedCareLink] = useState('');
  const [historySelection, setHistorySelection] = useState([]);
  const [now, setNow] = useState(new Date().getTime());

  // --- Support & System State ---
  const [supportTickets, setSupportTickets] = useState([]);
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [resolvingTicketId, setResolvingTicketId] = useState(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportError, setSupportError] = useState('');
  const [supportForm, setSupportForm] = useState({ 
    supportId: '', name: '', email: '', platform: 'whatsapp', countryCode: '+1', countryIso: 'us', contactValue: '', message: '' 
  });
  const [copiedId, setCopiedId] = useState(false);

  // --- Utility State ---
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const deleteConfirmationPhrase = auth.currentUser ? `I know this will delete all data related to this account, still I want to delete my account, ${auth.currentUser.email}` : '';

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // --- App Lock State ---
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isLockEnabled, setIsLockEnabled] = useState(localStorage.getItem('kintag_app_lock_enabled') === 'true');

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date().getTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.pwaDeferredPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    if (window.pwaDeferredPrompt) setDeferredPrompt(window.pwaDeferredPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Check for Face ID / Biometric support on load
  useEffect(() => {
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setIsBiometricSupported(available));
    }
  }, []);

  // Live Firebase Listeners
  useEffect(() => {
    if (!auth.currentUser) return;

    let unsubFamily, unsubProfiles, unsubCare, unsubTickets;
    let activeFamilyId = auth.currentUser.uid;

    const setupListeners = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

        if (userDoc.exists()) {
          const data = userDoc.data();
          activeFamilyId = data.familyId || auth.currentUser.uid;
          setUserData({ ...data, familyId: activeFamilyId });
        } else {
          setUserData({ name: '', familyId: activeFamilyId });
        }
        
        // 1. Live Family Members Listener
        const familyQuery = query(collection(db, "users"), where("familyId", "==", activeFamilyId));
        unsubFamily = onSnapshot(familyQuery, (snap) => {
          setFamilyMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.error("Family fetch error", err));

        // 2. Live Profiles Listener
        const profilesQuery = query(collection(db, "profiles"), where("familyId", "==", activeFamilyId));
        unsubProfiles = onSnapshot(profilesQuery, async (snap) => {
          let fetchedProfiles = snap.docs.map(d => ({ id: d.id, ...d.data() }));

          if (fetchedProfiles.length === 0) {
            const legacyQuery = query(collection(db, "profiles"), where("userId", "==", auth.currentUser.uid));
            const legacySnaps = await getDocs(legacyQuery);
            fetchedProfiles = legacySnaps.docs.map(d => ({ id: d.id, ...d.data() }));
          }

          setProfiles(fetchedProfiles.filter(p => p.isActive !== false));
        }, (err) => console.error("Profiles fetch error", err));

        // 3. Live Care Sessions Listener
        const careQuery = query(collection(db, "care_sessions"), where("familyId", "==", activeFamilyId));
        unsubCare = onSnapshot(careQuery, (snap) => {
          setCareSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.error("Care sessions fetch error", err));

        // 4. Live Support Tickets Listener
        const ticketsQuery = query(collection(db, "support_tickets"), where("userId", "==", auth.currentUser.uid));
        unsubTickets = onSnapshot(ticketsQuery, (snap) => {
          setSupportTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        }, (err) => console.error("Tickets fetch error", err));

        setLoading(false);
      } catch (err) {
        console.error("Main settings fetch error:", err);
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      if (unsubFamily) unsubFamily();
      if (unsubProfiles) unsubProfiles();
      if (unsubCare) unsubCare();
      if (unsubTickets) unsubTickets();
    };
  }, []);

  // --- App Lock Toggle Logic ---
  const toggleAppLock = async () => {
    if (isLockEnabled) {
      localStorage.removeItem('kintag_app_lock_enabled');
      localStorage.removeItem('kintag_credential_id');
      setIsLockEnabled(false);
      return;
    }

    try {
      const publicKeyCredentialCreationOptions = {
        challenge: window.crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "KinTag", id: window.location.hostname },
        user: {
          id: window.crypto.getRandomValues(new Uint8Array(16)),
          name: "kintag_user",
          displayName: "KinTag User"
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required"
        },
        timeout: 60000
      };

      const credential = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });
      const rawId = Array.from(new Uint8Array(credential.rawId)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      localStorage.setItem('kintag_credential_id', rawId);
      localStorage.setItem('kintag_app_lock_enabled', 'true');
      setIsLockEnabled(true);
    } catch (err) {
      console.error(err);
      alert("Failed to enable App Lock. Your device might not support it, or you canceled the Fingerprint prompt.");
    }
  };

  // --- Caretaker (Babysitter) Logic ---
  const toggleProfileSelection = (profileId) => {
    setCareForm(prev => {
      const isSelected = prev.selectedProfiles.includes(profileId);
      return { ...prev, selectedProfiles: isSelected ? prev.selectedProfiles.filter(id => id !== profileId) : [...prev.selectedProfiles, profileId] };
    });
  };

  const handleCreateCareSession = async (e) => {
    e.preventDefault();
    if (careForm.selectedProfiles.length === 0) return alert("Please select at least one profile.");
    if (careForm.days === 0 && careForm.hours === 0 && careForm.minutes === 0) return alert("Please set a valid duration.");

    setCareLoading(true);
    try {
      const durationMs = (careForm.days * 86400000) + (careForm.hours * 3600000) + (careForm.minutes * 60000);
      const expiresAt = new Date(Date.now() + durationMs).toISOString();

      const sessionData = {
        name: careForm.name.trim(),
        phone: careForm.phone,
        countryCode: careForm.countryCode,
        countryIso: careForm.countryIso,
        selectedProfiles: careForm.selectedProfiles,
        familyId: userData.familyId,
        createdAt: new Date().toISOString(),
        expiresAt,
        status: 'active'
      };

      const docRef = await addDoc(collection(db, "care_sessions"), sessionData);
      
      const link = `${window.location.origin}/#/care/${docRef.id}`;
      setGeneratedCareLink(link);
      setCareTab('active');
    } catch (err) {
      alert("Failed to create temporary access. Please try again.");
    } finally {
      setCareLoading(false);
    }
  };

  const handleEndCareSession = async (session) => {
    try {
      await updateDoc(doc(db, "care_sessions", session.id), { status: 'history', endedAt: new Date().toISOString() });
    } catch (err) {
      alert("Failed to end session.");
    }
  };

  const addTimeToSession = async (sessionId, additionalMs) => {
    try {
      const sessionToUpdate = careSessions.find(s => s.id === sessionId);
      if (!sessionToUpdate) return;
      const currentExpires = new Date(sessionToUpdate.expiresAt).getTime();
      const newExpiresAt = new Date(currentExpires + additionalMs).toISOString();
      
      await updateDoc(doc(db, "care_sessions", sessionId), { expiresAt: newExpiresAt });
    } catch(err) {
      alert("Failed to add time.");
    }
  };

  const toggleHistorySelection = (id) => {
    setHistorySelection(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const deleteSelectedHistory = async () => {
    if (historySelection.length === 0) return;
    try {
      for (const id of historySelection) await deleteDoc(doc(db, "care_sessions", id));
      setHistorySelection([]);
    } catch (err) { alert("Failed to delete history."); }
  };

  const deleteAllHistory = async () => {
    const historyIds = careSessions.filter(s => s.status === 'history' || new Date(s.expiresAt).getTime() < now).map(s => s.id);
    if (historyIds.length === 0) return;
    try {
      for (const id of historyIds) await deleteDoc(doc(db, "care_sessions", id));
      setHistorySelection([]);
    } catch (err) { alert("Failed to clear history."); }
  };

  // --- Family & Invite Logic ---
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    
    const currentFamilyId = userData?.familyId || auth.currentUser.uid;
    const invitedCount = familyMembers.filter(m => m.id !== currentFamilyId).length;
    
    if (invitedCount >= 5) return setInviteError("You have reached the maximum of 5 co-guardians.");
    if (!inviteEmail) return;

    setInviteLoading(true);
    try {
      await setDoc(doc(db, "invites", inviteEmail.toLowerCase()), {
        familyId: currentFamilyId,
        invitedBy: userData?.name || auth.currentUser.email,
        inviteEmail: inviteEmail.toLowerCase(),
        inviterUid: auth.currentUser.uid,
        status: 'pending',
        invitedAt: new Date().toISOString()
      });

      const link = `${window.location.origin}/#/signup?email=${encodeURIComponent(inviteEmail.toLowerCase())}`;
      let sharedNative = false;
      
      if (navigator.share) {
        try {
          await navigator.share({ title: 'KinTag Co-Guardian Invite', text: `${userData?.name || 'A family member'} invited you to co-manage their KinTag profiles.`, url: link });
          sharedNative = true;
          setInviteSuccess("Invite sent successfully!");
        } catch (shareErr) {}
      } 
      
      if (!sharedNative) {
        try {
          await navigator.clipboard.writeText(link);
          setInviteSuccess("Invite link copied to clipboard!");
        } catch (clipErr) {
          setInviteSuccess("Invite saved! Ask them to sign up with that exact email.");
        }
      }
      setInviteEmail('');
    } catch (err) {
      if (err.message.includes("Missing or insufficient permissions") || err.code === "permission-denied") {
        setInviteError("Firebase Error: You need to update your Firestore Security Rules to allow writing to the 'invites' collection.");
      } else {
        setInviteError(err.message || "Failed to send invite. Please try again.");
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const confirmRemoveGuardian = async () => {
    if (!guardianToRemove) return;
    setInviteError(''); setInviteSuccess('');
    try {
      await updateDoc(doc(db, "users", guardianToRemove.id), { familyId: guardianToRemove.id });
      await deleteDoc(doc(db, "invites", guardianToRemove.email.toLowerCase()));
      await addDoc(collection(db, "scans"), {
        familyId: userData?.familyId || auth.currentUser.uid,
        type: 'invite_response',
        profileName: 'Family Update',
        message: `${guardianToRemove.name || guardianToRemove.email} was securely removed from your family dashboard.`,
        timestamp: new Date().toISOString()
      });
      setInviteSuccess(`${guardianToRemove.name || guardianToRemove.email} was removed successfully.`);
    } catch (err) {
      setInviteError("Failed to remove guardian.");
    } finally {
      setGuardianToRemove(null);
    }
  };

  // --- Support Tickets Logic ---
  const openSupport = () => {
    if (supportTickets.length > 0) return;
    const sId = 'SUP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setSupportForm({
      supportId: sId,
      name: userData?.name || '',
      email: auth.currentUser?.email || '',
      platform: 'whatsapp',
      countryCode: '+1',
      countryIso: 'us',
      contactValue: '',
      message: ''
    });
    setSupportMessage('');
    setSupportError('');
    setShowSupportModal(true);
  };

  const copySupportId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setSupportLoading(true);
    setSupportError('');
    setSupportMessage('');

    if (!supportForm.contactValue || !supportForm.message) {
      setSupportError("Please fill out all fields.");
      setSupportLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supportForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send support request.");
      
      const ticketData = {
        supportId: supportForm.supportId,
        message: supportForm.message,
        platform: supportForm.platform,
        contactValue: supportForm.platform === 'whatsapp' ? `${supportForm.countryCode} ${supportForm.contactValue}` : `@${supportForm.contactValue.replace(/^@/, '')}`,
        userId: auth.currentUser.uid,
        email: supportForm.email,
        timestamp: new Date().toISOString()
      };
      await addDoc(collection(db, "support_tickets"), ticketData);
      
      setSupportMessage("Request sent successfully! Your ticket has been logged.");
      setTimeout(() => { setShowSupportModal(false); setSupportMessage(''); }, 3000);
    } catch(err) {
      setSupportError(err.message);
    } finally {
      setSupportLoading(false);
    }
  };

  const handleResolveTicket = async (ticket) => {
    setResolvingTicketId(ticket.id);
    try {
      const res = await fetch('/api/resolve-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supportId: ticket.supportId, email: ticket.email || auth.currentUser.email })
      });
      if (!res.ok) throw new Error("Failed to send resolution email.");

      await deleteDoc(doc(db, "support_tickets", ticket.id));
    } catch (err) {
      alert("Failed to resolve ticket. Please try again.");
    } finally {
      setResolvingTicketId(null);
    }
  };

  // --- General App Logic ---
  const handleLogout = async () => { 
    await signOut(auth); 
    navigate('/login'); 
  };
  
  const handleInstallApp = async () => { 
    if (!deferredPrompt) return; 
    deferredPrompt.prompt(); 
    const { outcome } = await deferredPrompt.userChoice; 
    if (outcome === 'accepted') { 
      setDeferredPrompt(null); 
      window.pwaDeferredPrompt = null; 
    } 
  };
  
  const handleShareApp = async () => {
    const shareData = { title: 'KinTag - Digital Safety Net', text: "I use KinTag to secure my family with digital IDs and instant GPS alerts. It's 100% free! Check it out and create your own tags.", url: window.location.origin };
    if (navigator.share) { 
      try { await navigator.share(shareData); setShareMessage("Thanks for sharing KinTag!"); setTimeout(() => setShareMessage(''), 3000); } catch (e) {} 
    } else { 
      try { await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`); setShareMessage("Link copied to clipboard!"); setTimeout(() => setShareMessage(''), 3000); } catch (err) { setShareMessage("Failed to copy link."); } 
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== deleteConfirmationPhrase) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      const qProfiles = query(collection(db, "profiles"), where("userId", "==", auth.currentUser.uid));
      const snaps = await getDocs(qProfiles);
      for (const d of snaps.docs) {
        await deleteDoc(d.ref);
      }
      await deleteDoc(doc(db, "users", auth.currentUser.uid));
      await auth.currentUser.delete();
      navigate('/login');
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setDeleteError("For your security, please log out and log back in before deleting your account.");
      } else {
        setDeleteError("Failed to delete account: " + err.message);
      }
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-bold text-zinc-500">Loading Settings...</div>;

  const currentFamilyId = userData?.familyId || auth.currentUser?.uid;
  const invitedGuardians = familyMembers.filter(m => m.id !== currentFamilyId);
  const activeCareSessions = careSessions.filter(s => s.status === 'active' && new Date(s.expiresAt).getTime() > now);
  const historyCareSessions = careSessions.filter(s => s.status === 'history' || new Date(s.expiresAt).getTime() <= now);

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] p-4 md:p-8 relative pb-24 selection:bg-brandGold selection:text-white">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-brandGold/10 via-emerald-400/5 to-transparent rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="max-w-2xl mx-auto relative z-10 pt-4">
        
        {/* ── SECTION 1: Header Actions ── delay-0 */}
        <div className="flex justify-between items-center mb-8 animate-initial:opacity-0 animate-initial:y-10 animate-enter:opacity-100 animate-enter:y-0 animate-spring animate-stiffness-220 animate-damping-7 animate-delay-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="group flex items-center space-x-2 bg-white/60 backdrop-blur-md border border-zinc-200 text-zinc-600 px-5 py-2.5 rounded-full font-bold shadow-sm hover:shadow-md hover:bg-white transition-all animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7"
          >
            <ArrowLeft size={18} className="transform group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 p-2.5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7"
              title="Share KinTag"
            >
              <Share2 size={18} className="shrink-0" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 p-2.5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7"
              title="Log Out Securely"
            >
              <LogOut size={18} className="shrink-0" />
            </button>
          </div>
        </div>

        {/* ── SECTION 2: Caretaker Mode ── delay-100 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-200/80 p-8 md:p-10 mb-8 animate-initial:opacity-0 animate-initial:y-16 animate-enter:opacity-100 animate-enter:y-0 animate-spring animate-stiffness-220 animate-damping-7 animate-delay-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-sm shrink-0">
                <ShieldAlert size={24} />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-brandDark tracking-tight">Caretaker Mode</h2>
            </div>
            <button
              onClick={() => { setCareForm({ name: '', countryCode: '+1', countryIso: 'us', phone: '', selectedProfiles: [], days: 0, hours: 0, minutes: 0 }); setShowCareModal(true); }}
              className="w-10 h-10 bg-brandDark text-white rounded-full flex items-center justify-center hover:bg-brandAccent transition-all shadow-md shrink-0 animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7"
            >
              <Plus size={20} />
            </button>
          </div>
          <p className="text-zinc-500 font-medium mb-6 leading-relaxed text-sm md:text-base">Temporary, view-only access bundles for babysitters.</p>

          <div className="flex bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 mb-6">
            <button
              onClick={() => setCareTab('active')}
              className={`flex-1 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7 ${careTab === 'active' ? 'bg-white shadow-sm text-brandDark border border-zinc-200/50' : 'text-zinc-500 hover:text-brandDark'}`}
            >
              <Clock size={16} /> Active ({activeCareSessions.length})
            </button>
            <button
              onClick={() => setCareTab('history')}
              className={`flex-1 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7 ${careTab === 'history' ? 'bg-white shadow-sm text-brandDark border border-zinc-200/50' : 'text-zinc-500 hover:text-brandDark'}`}
            >
              <History size={16} /> History ({historyCareSessions.length})
            </button>
          </div>

          {careTab === 'active' && (
            <div className="space-y-4">
              {activeCareSessions.length === 0 ? (
                <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-300">
                  <Timer size={32} className="text-zinc-300 mx-auto mb-2" />
                  <p className="text-zinc-500 font-bold text-sm">No active babysitters.</p>
                </div>
              ) : (
                activeCareSessions.map(session => {
                  const timeLeftMs = new Date(session.expiresAt).getTime() - now;
                  const hoursLeft = Math.floor(timeLeftMs / 3600000);
                  const minsLeft = Math.floor((timeLeftMs % 3600000) / 60000);
                  const sharedNames = profiles.filter(p => session.selectedProfiles.includes(p.id)).map(p => p.name).join(", ");

                  return (
                    <div key={session.id} className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                      <div className="flex-1 w-full md:w-auto pr-4">
                        <h3 className="font-extrabold text-brandDark flex items-center gap-2">{session.name} <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-widest border border-indigo-100">Watching</span></h3>
                        <p className="text-sm text-zinc-500 font-medium mb-1 truncate">Profiles: <strong className="text-brandDark">{sharedNames || 'None'}</strong></p>
                        <p className="text-xs text-amber-600 font-bold flex items-center gap-1"><Timer size={14}/> Expires in: {hoursLeft}h {minsLeft}m</p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
                        <button onClick={() => addTimeToSession(session.id, 3600000)} className="flex-1 md:flex-none px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 font-bold rounded-xl transition-colors shadow-sm text-xs flex justify-center items-center gap-1 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7" title="Add 1 Hour">
                          <Plus size={14}/> 1 Hr
                        </button>
                        <button onClick={() => { setGeneratedCareLink(`${window.location.origin}/#/care/${session.id}`); setShowCareModal(false); }} className="flex-1 md:flex-none px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 font-bold rounded-xl transition-colors shadow-sm text-xs flex justify-center items-center gap-1 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">
                          <Share2 size={14}/> Share
                        </button>
                        <button onClick={() => handleEndCareSession(session)} className="w-full md:w-auto px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold rounded-xl transition-colors shadow-sm text-xs text-center animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">
                          End Access
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {careTab === 'history' && (
            <div className="space-y-4">
              {historyCareSessions.length > 0 && (
                <div className="flex justify-between items-center mb-2 px-1">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{historySelection.length} Selected</p>
                  <div className="flex gap-2">
                    <button onClick={deleteSelectedHistory} disabled={historySelection.length === 0} className="text-xs font-bold text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Delete</button>
                    <span className="text-zinc-300">|</span>
                    <button onClick={deleteAllHistory} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Delete All</button>
                  </div>
                </div>
              )}
              {historyCareSessions.length === 0 ? (
                <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-300">
                  <History size={32} className="text-zinc-300 mx-auto mb-2" />
                  <p className="text-zinc-500 font-bold text-sm">No past sessions.</p>
                </div>
              ) : (
                historyCareSessions.map(session => {
                  const sharedNames = profiles.filter(p => session.selectedProfiles.includes(p.id)).map(p => p.name).join(", ");
                  const isSelected = historySelection.includes(session.id);
                  return (
                    <div key={session.id} className={`bg-white border p-4 rounded-2xl shadow-sm flex items-center gap-4 transition-colors cursor-pointer ${isSelected ? 'border-brandDark bg-zinc-50' : 'border-zinc-200'}`} onClick={() => toggleHistorySelection(session.id)}>
                      {isSelected ? <CheckSquare size={20} className="text-brandDark shrink-0"/> : <Square size={20} className="text-zinc-300 shrink-0"/>}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-zinc-700 flex items-center gap-2 truncate pr-2">
                            {session.name}
                          </h3>
                          <div className="flex gap-2 shrink-0">
                            <a href={`tel:${session.countryCode || ''}${session.phone}`} onClick={e => e.stopPropagation()} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7">
                              <Phone size={14} />
                            </a>
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setCareForm({ name: session.name, countryCode: session.countryCode || '+1', countryIso: session.countryIso || 'us', phone: session.phone, selectedProfiles: session.selectedProfiles || [], days: 0, hours: 0, minutes: 0 }); 
                              setShowCareModal(true); 
                            }} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1 text-xs font-bold animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7">
                              <History size={14} /> Re-book
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 font-medium mb-1.5">{session.countryCode} {session.phone}</p>
                        <p className="text-xs text-zinc-500 font-medium truncate">Watched: <strong className="text-zinc-700">{sharedNames || 'None'}</strong></p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1"><CalendarDays size={12}/> {new Date(session.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* ── SECTION 3: Family Sharing ── delay-200 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-200/80 p-8 md:p-10 mb-8 animate-initial:opacity-0 animate-initial:y-16 animate-enter:opacity-100 animate-enter:y-0 animate-spring animate-stiffness-220 animate-damping-7 animate-delay-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-brandGold/10 rounded-2xl flex items-center justify-center text-brandGold border border-brandGold/20 shadow-sm">
              <Users size={24} />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-brandDark tracking-tight">Family Sharing</h2>
          </div>
          <p className="text-zinc-500 font-medium mb-8 leading-relaxed text-sm md:text-base">
            Invite up to 5 family members to manage profiles and receive emergency scan notifications simultaneously on their own phones.
          </p>

          {inviteError && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100">{inviteError}</div>}
          {inviteSuccess && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-2xl border border-emerald-100 flex items-center gap-2">
            <CheckCircle2 size={18} /> {inviteSuccess}
          </div>}

          {invitedGuardians.length < 5 && (
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 mb-10 p-2 bg-zinc-50 border border-zinc-200 rounded-[2rem] shadow-inner">
              <div className="flex-1 flex items-center pl-4 gap-2">
                <Mail size={18} className="text-zinc-400" />
                <input type="email" placeholder="Enter guardian's email..." value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required className="w-full py-3 bg-transparent outline-none font-medium text-brandDark placeholder:text-zinc-400" />
              </div>
              <button type="submit" disabled={inviteLoading} className="bg-brandDark text-white px-8 py-4 rounded-full font-bold hover:bg-brandAccent transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">
                {inviteLoading ? <Loader2 size={18} className="animate-spin"/> : 'Send Invite'}
              </button>
            </form>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              Active Co-Guardians <span className="bg-zinc-100 px-2 py-0.5 rounded-md text-zinc-500">{invitedGuardians.length}/5</span>
            </h3>
            
            {userData && (
              <div className="relative bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-200 text-zinc-400 shadow-inner shrink-0 overflow-hidden p-1">
                    {userData.avatarId ? (
                        avatars.find(a => a.id === userData.avatarId)?.svg || <User size={20} />
                    ) : (
                        <User size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-20">
                    <p className="font-bold text-brandDark truncate text-base leading-tight mb-1">{userData.name || 'Guardian'}</p>
                    <p className="text-xs text-zinc-500 font-medium truncate">{auth.currentUser?.email}</p>
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="text-[9px] sm:text-[10px] font-extrabold bg-brandGold/10 border border-brandGold/20 text-brandGold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full uppercase tracking-widest shadow-sm">Primary</span>
                </div>
              </div>
            )}

            {invitedGuardians.map((member) => (
              <div key={member.id} className="relative bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-200 text-zinc-400 shadow-inner shrink-0 overflow-hidden p-1">
                    {member.avatarId ? (
                        avatars.find(a => a.id === member.avatarId)?.svg || <User size={20} />
                    ) : (
                        <User size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-12 sm:pr-16">
                    <p className="font-bold text-brandDark truncate text-base leading-tight mb-1">{member.name || 'Guardian'}</p>
                    <p className="text-xs text-zinc-500 font-medium truncate">{member.email}</p>
                  </div>
                </div>
                
                <div className="absolute top-3 right-3 flex items-center">
                  {auth.currentUser?.uid === currentFamilyId ? (
                    <button onClick={() => setGuardianToRemove(member)} className="text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 p-2 sm:p-2.5 rounded-xl transition-all shadow-sm shrink-0 animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7" title="Remove Guardian">
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] font-extrabold bg-zinc-100 border border-zinc-200 text-zinc-500 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full uppercase tracking-widest shadow-sm">Co-Guardian</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 4: PWA Install ── delay-300 (conditional) */}
        {deferredPrompt && (
          <div className="bg-brandDark text-white rounded-[2.5rem] shadow-xl p-8 md:p-10 mb-8 flex flex-col sm:flex-row items-center justify-between transition-all hover:shadow-2xl gap-6 relative overflow-hidden group animate-initial:opacity-0 animate-initial:y-16 animate-enter:opacity-100 animate-enter:y-0 animate-spring animate-stiffness-220 animate-damping-7 animate-delay-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brandGold/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-brandGold/20 transition-colors"></div>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left relative z-10">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md text-brandGold rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner group-hover:scale-105 transition-transform">
                <Smartphone size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold mb-2 tracking-tight">Install KinTag App</h3>
                <p className="text-sm text-white/70 font-medium max-w-sm leading-relaxed">Add KinTag to your home screen for a seamless, full-screen native experience.</p>
              </div>
            </div>
            <button onClick={handleInstallApp} className="w-full sm:w-auto bg-brandGold text-brandDark px-8 py-4 rounded-full font-bold shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all shrink-0 flex items-center justify-center gap-2 hover:-translate-y-1 relative z-10 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">
              <Download size={18} />
              Install Now
            </button>
          </div>
        )}

        {/* ── SECTION 5: Help & Support ── delay-300 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-200/80 p-8 md:p-10 mb-8 flex flex-col sm:flex-row items-center justify-between transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.1)] gap-6 animate-initial:opacity-0 animate-initial:y-16 animate-enter:opacity-100 animate-enter:y-0 animate-spring animate-stiffness-220 animate-damping-7 animate-delay-300">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-16 h-16 bg-blue-50/80 border border-blue-100 text-blue-500 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <LifeBuoy size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-brandDark mb-2 tracking-tight">Help & Support</h3>
              <p className="text-sm text-zinc-500 font-medium max-w-sm leading-relaxed">Need help with your account or tags? Contact the developer directly via WhatsApp or Telegram.</p>
            </div>
          </div>
          <button 
            onClick={openSupport} 
            disabled={supportTickets.length > 0}
            className={`w-full sm:w-auto px-8 py-4 rounded-full font-bold shadow-md transition-all shrink-0 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7 ${
              supportTickets.length > 0 
                ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed' 
                : 'bg-white text-brandDark border border-zinc-200 hover:bg-zinc-50 hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {supportTickets.length > 0 ? 'Ticket Active (1/1)' : 'Contact Support'}
          </button>
        </div>

        {/* Active Support Tickets UI */}
        {supportTickets.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-200/80 p-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              Active Support Tickets <span className="bg-zinc-100 px-2 py-0.5 rounded-md text-zinc-500">{supportTickets.length}/1</span>
            </h3>
            <div className="space-y-4">
              {supportTickets.map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-[1.5rem] border border-zinc-200 shadow-sm overflow-hidden transition-all duration-300">
                  <button onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)} className="w-full px-6 py-5 flex items-center justify-between hover:bg-zinc-50 transition-colors outline-none animate-tap:scale-[0.98] animate-spring animate-stiffness-220 animate-damping-7">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                      <span className="font-mono font-bold text-brandDark tracking-wider">{ticket.supportId}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full">
                      <span className="hidden sm:inline">View Details</span>
                      <ChevronDown size={16} className={`transition-transform duration-300 ${expandedTicketId === ticket.id ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${expandedTicketId === ticket.id ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-6 pt-0 border-t border-zinc-100 bg-zinc-50/50 mt-2">
                      <div className="flex items-center gap-2 mb-4 mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        <span>Submitted on:</span>
                        <span className="text-zinc-600 bg-zinc-200/50 px-2 py-0.5 rounded-md">{new Date(ticket.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <p className="text-sm text-brandDark font-medium bg-white p-5 rounded-2xl border border-zinc-200 mb-6 whitespace-pre-wrap leading-relaxed shadow-sm max-h-48 overflow-y-auto">
                        "{ticket.message}"
                      </p>
                      <button onClick={() => handleResolveTicket(ticket)} disabled={resolvingTicketId === ticket.id} className="w-full bg-emerald-500 text-white py-4 rounded-full font-bold shadow-md hover:bg-emerald-600 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">
                        {resolvingTicketId === ticket.id ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18} />}
                        {resolvingTicketId === ticket.id ? 'Resolving...' : 'Mark as Resolved'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION 6: App Privacy Lock ── delay-400 (conditional) */}
        {isBiometricSupported && (
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-200/80 p-8 md:p-10 mb-8 flex flex-col sm:flex-row items-center justify-between transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.1)] gap-6 animate-initial:opacity-0 animate-initial:y-16 animate-enter:opacity-100 animate-enter:y-0 animate-spring animate-stiffness-220 animate-damping-7 animate-delay-400">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors ${isLockEnabled ? 'bg-brandGold/10 border border-brandGold/20 text-brandGold' : 'bg-zinc-100 border border-zinc-200 text-zinc-400'}`}>
                <FingerprintPattern size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-brandDark mb-2 tracking-tight">App Privacy Lock</h3>
                <p className="text-sm text-zinc-500 font-medium max-w-sm leading-relaxed">Require Touch ID, or your device passcode to open the KinTag app.</p>
              </div>
            </div>
            <button 
              onClick={toggleAppLock}
              className={`w-full sm:w-auto px-8 py-4 rounded-full font-bold shadow-md transition-all shrink-0 flex items-center justify-center gap-2 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7 ${
                isLockEnabled 
                  ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200' 
                  : 'bg-brandDark text-white hover:bg-brandAccent'
              }`}
            >
              {isLockEnabled ? <Unlock size={18}/> : <Lock size={18}/>}
              {isLockEnabled ? 'Disable Lock' : 'Enable Lock'}
            </button>
          </div>
        )}

        {/* ── SECTION 7: Danger Zone ── delay-500 */}
        <div className="animate-initial:opacity-0 animate-initial:y-16 animate-enter:opacity-100 animate-enter:y-0 animate-spring animate-stiffness-220 animate-damping-7 animate-delay-500">
          <div className="flex items-center justify-center mb-8 relative">
            <div className="w-full h-px bg-zinc-200"></div>
            <span className="absolute bg-[#fafafa] px-4 text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">Danger Zone</span>
          </div>

          <div className="bg-red-50/80 backdrop-blur-xl rounded-[2.5rem] border border-red-100 p-8 md:p-10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-red-500/10 transition-colors"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center border border-red-200 shadow-sm">
                <AlertOctagon size={24} />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-red-600 tracking-tight">Delete Account</h2>
            </div>
            <p className="text-red-900/60 font-medium mb-8 leading-relaxed text-sm md:text-base relative z-10">
              Permanently delete your account, all profiles, and all scan history. This action is instantaneous and cannot be undone.
            </p>
            <button onClick={() => setShowDeleteZone(true)} className="bg-white border border-red-200 text-red-600 font-bold px-8 py-4 rounded-full hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm hover:shadow-md relative z-10 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">
              Delete Account
            </button>
          </div>
        </div>

        {/* ── MODALS ── */}

        {/* Caretaker Create Modal */}
        {showCareModal && !generatedCareLink && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 max-w-md w-full shadow-2xl border border-white/20 my-8 animate-initial:opacity-0 animate-initial:scale-90 animate-enter:opacity-100 animate-enter:scale-100 animate-spring animate-stiffness-220 animate-damping-7">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold text-brandDark tracking-tight flex items-center gap-2"><ShieldAlert size={24} className="text-brandGold" /> New Bundle</h2>
                <button onClick={() => setShowCareModal(false)} className="text-zinc-400 hover:text-brandDark bg-zinc-50 hover:bg-zinc-100 p-2.5 rounded-full transition-colors border border-zinc-200 animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7"><X size={20} /></button>
              </div>

              <form onSubmit={handleCreateCareSession} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-brandDark mb-2 ml-1">Babysitter Name</label>
                  <input type="text" placeholder="e.g., Sarah Johnson" required value={careForm.name} onChange={e => setCareForm({...careForm, name: e.target.value})} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:bg-white focus:border-brandDark focus:ring-2 font-medium transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-brandDark mb-2 ml-1">Contact Number</label>
                  <div className="flex w-full border border-zinc-200 rounded-2xl focus-within:border-brandDark focus-within:ring-2 bg-zinc-50 focus-within:bg-white overflow-hidden transition-all relative">
                    <div className="relative flex items-center bg-white border-r border-zinc-200 px-3 cursor-pointer shrink-0">
                      <span className="ml-2 text-sm font-bold text-brandDark">{careForm.countryCode}</span>
                      <select value={`${careForm.countryCode}|${careForm.countryIso}`} onChange={(e) => { const [code, iso] = e.target.value.split('|'); setCareForm({...careForm, countryCode: code, countryIso: iso}); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                        {sortedCountryCodes.map((c, i) => <option key={`${c.iso}-${i}`} value={`${c.code}|${c.iso}`}>{c.country} ({c.code})</option>)}
                      </select>
                    </div>
                    <input type="tel" placeholder="Phone Number" required value={careForm.phone} onChange={e => setCareForm({...careForm, phone: e.target.value})} className="flex-1 p-4 outline-none w-full bg-transparent font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-brandDark mb-3 ml-1">Who are they watching?</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {profiles.length === 0 ? (
                      <p className="text-sm text-zinc-500 italic bg-zinc-50 p-4 rounded-xl border border-zinc-200">No profiles found.</p>
                    ) : profiles.map(profile => (
                      <div key={profile.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${careForm.selectedProfiles.includes(profile.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-zinc-200 hover:bg-zinc-50'}`} onClick={() => toggleProfileSelection(profile.id)}>
                        {careForm.selectedProfiles.includes(profile.id) ? <CheckSquare size={20} className="text-indigo-600 shrink-0"/> : <Square size={20} className="text-zinc-300 shrink-0"/>}
                        <img src={profile.imageUrl} alt="Profile" className="w-8 h-8 rounded-lg object-cover bg-zinc-200 shrink-0" />
                        <span className="font-bold text-brandDark">{profile.name} <span className="text-xs text-zinc-400 font-normal capitalize">({profile.type})</span></span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-brandDark mb-2 ml-1">Access Duration</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-2 text-center">
                      <input type="number" min="0" max="30" value={careForm.days} onChange={e => setCareForm({...careForm, days: parseInt(e.target.value) || 0})} className="w-full bg-transparent outline-none font-bold text-xl text-center text-brandDark" />
                      <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Days</span>
                    </div>
                    <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-2 text-center">
                      <input type="number" min="0" max="23" value={careForm.hours} onChange={e => setCareForm({...careForm, hours: parseInt(e.target.value) || 0})} className="w-full bg-transparent outline-none font-bold text-xl text-center text-brandDark" />
                      <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Hours</span>
                    </div>
                    <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-2 text-center">
                      <input type="number" min="0" max="59" value={careForm.minutes} onChange={e => setCareForm({...careForm, minutes: parseInt(e.target.value) || 0})} className="w-full bg-transparent outline-none font-bold text-xl text-center text-brandDark" />
                      <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Mins</span>
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={careLoading} className="w-full bg-brandDark text-white py-4 rounded-full font-bold shadow-lg hover:bg-brandAccent transition-all disabled:opacity-50 flex items-center justify-center gap-2 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">
                  {careLoading ? <Loader2 size={18} className="animate-spin" /> : <LinkIcon size={18} />}
                  {careLoading ? 'Generating...' : 'Create Temporary Bundle'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Generated Care Link Modal */}
        {generatedCareLink && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 relative animate-initial:opacity-0 animate-initial:scale-90 animate-enter:opacity-100 animate-enter:scale-100 animate-spring animate-stiffness-220 animate-damping-7">
              <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 text-indigo-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner"><LinkIcon size={36} /></div>
              <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Access Granted</h2>
              <p className="text-zinc-500 mb-8 text-sm font-medium leading-relaxed">Send this secure, self-destructing link to the babysitter. It will automatically expire when the timer runs out.</p>
              
              <div className="flex items-center gap-2 bg-zinc-50 p-2 rounded-2xl border border-zinc-200 mb-8">
                <input type="text" readOnly value={generatedCareLink} className="flex-1 bg-transparent px-3 outline-none text-xs font-mono text-zinc-600 truncate" />
                <button onClick={() => { navigator.clipboard.writeText(generatedCareLink); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }} className="p-3 bg-white border border-zinc-200 rounded-xl text-brandDark hover:text-brandGold transition-colors shadow-sm shrink-0 animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7">
                  {copiedId ? <Check size={18} className="text-emerald-500"/> : <Copy size={18}/>}
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={async () => { if(navigator.share) { await navigator.share({title:'KinTag Caretaker Access', url: generatedCareLink}); } }} className="w-full bg-indigo-600 text-white py-4 rounded-full font-bold shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">
                  <Share2 size={18} /> Share via App
                </button>
                <button onClick={() => { setGeneratedCareLink(''); setShowCareModal(false); }} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold hover:bg-zinc-200 transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Done</button>
              </div>
            </div>
          </div>
        )}

        {/* Support Modal */}
        {showSupportModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 max-w-md w-full shadow-2xl border border-white/20 my-8 animate-initial:opacity-0 animate-initial:scale-90 animate-enter:opacity-100 animate-enter:scale-100 animate-spring animate-stiffness-220 animate-damping-7">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-extrabold text-brandDark tracking-tight flex items-center gap-3"><div className="w-10 h-10 bg-brandGold/10 text-brandGold rounded-xl flex items-center justify-center border border-brandGold/20"><LifeBuoy size={20}/></div> Support</h2>
                <button onClick={() => setShowSupportModal(false)} className="text-zinc-400 hover:text-brandDark bg-zinc-50 hover:bg-zinc-100 p-2.5 rounded-full transition-colors border border-zinc-200 shadow-sm animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7"><X size={20} /></button>
              </div>
              {supportMessage ? (
                <div className="bg-emerald-50 text-emerald-600 p-8 rounded-[2rem] text-center font-bold border border-emerald-100 flex flex-col items-center justify-center gap-4 shadow-inner"><CheckCircle2 size={48} className="text-emerald-500" /><p className="text-lg">{supportMessage}</p></div>
              ) : (
                <form onSubmit={handleSupportSubmit} className="space-y-5">
                  {supportError && <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 animate-in fade-in">{supportError}</div>}
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 flex justify-between items-center relative group transition-colors hover:border-brandGold/30 shadow-inner">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Ticket ID</span>
                      <div className="relative flex items-center justify-center"><Info size={14} className="text-brandGold cursor-help peer" /><div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-brandDark text-white text-[10px] p-2.5 rounded-xl opacity-0 peer-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center shadow-xl font-bold">Copy and save this ID for future reference.</div></div>
                    </div>
                    <button type="button" onClick={() => copySupportId(supportForm.supportId)} className="flex items-center gap-2 text-brandDark hover:text-brandGold transition-colors bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7"><span className="font-mono font-bold tracking-wide">{supportForm.supportId}</span>{copiedId ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Your Name" required value={supportForm.name} onChange={e => setSupportForm({...supportForm, name: e.target.value})} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 font-medium transition-all" />
                    <input type="email" placeholder="Your Email" required value={supportForm.email} onChange={e => setSupportForm({...supportForm, email: e.target.value})} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 font-medium transition-all" />
                  </div>
                  <div className="flex bg-zinc-100 p-1.5 rounded-[1.25rem] border border-zinc-200">
                    <button type="button" onClick={() => setSupportForm({...supportForm, platform: 'whatsapp', contactValue: ''})} className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7 ${supportForm.platform === 'whatsapp' ? 'bg-white shadow-sm text-emerald-600 border border-zinc-200/50' : 'text-zinc-500 hover:text-brandDark'}`}><HugeiconsIcon icon={WhatsappIcon} size={18} /> WhatsApp</button>
                    <button type="button" onClick={() => setSupportForm({...supportForm, platform: 'telegram', contactValue: ''})} className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7 ${supportForm.platform === 'telegram' ? 'bg-white shadow-sm text-sky-500 border border-zinc-200/50' : 'text-zinc-500 hover:text-brandDark'}`}><HugeiconsIcon icon={TelegramIcon} size={18} /> Telegram</button>
                  </div>
                  {supportForm.platform === 'whatsapp' ? (
                    <div className="flex w-full border border-zinc-200 rounded-2xl focus-within:border-brandDark focus-within:ring-2 focus-within:ring-brandDark/10 bg-zinc-50 focus-within:bg-white overflow-hidden transition-all relative">
                      <div className="relative flex items-center bg-white hover:bg-zinc-50 border-r border-zinc-200 px-4 cursor-pointer shrink-0 transition-colors shadow-sm">
                        <img src={`https://flagcdn.com/w20/${supportForm.countryIso || 'us'}.png`} alt="flag" className="w-6 h-auto rounded-sm shrink-0 shadow-sm" />
                        <span className="ml-2 text-sm font-bold text-brandDark">{supportForm.countryCode || '+1'}</span>
                        <select value={`${supportForm.countryCode}|${supportForm.countryIso}`} onChange={(e) => { const [code, iso] = e.target.value.split('|'); setSupportForm({...supportForm, countryCode: code, countryIso: iso}); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                          {sortedCountryCodes.map((c, i) => <option key={`${c.iso}-${i}`} value={`${c.code}|${c.iso}`}>{c.country} ({c.code})</option>)}
                        </select>
                      </div>
                      <input type="tel" placeholder="WhatsApp Number" required value={supportForm.contactValue} onChange={e => setSupportForm({...supportForm, contactValue: e.target.value})} className="flex-1 p-4 outline-none w-full bg-transparent font-medium" />
                    </div>
                  ) : (
                    <div className="flex w-full border border-zinc-200 rounded-2xl focus-within:border-brandDark focus-within:ring-2 focus-within:ring-brandDark/10 bg-zinc-50 focus-within:bg-white overflow-hidden transition-all">
                      <div className="flex items-center bg-white border-r border-zinc-200 px-5 text-zinc-400 font-bold shrink-0 shadow-sm">@</div>
                      <input type="text" placeholder="username" required value={supportForm.contactValue} onChange={e => setSupportForm({...supportForm, contactValue: e.target.value.replace(/^@/, '')})} className="flex-1 p-4 outline-none w-full bg-transparent font-medium" />
                    </div>
                  )}
                  <textarea placeholder="How can we help you?" required rows="4" value={supportForm.message} onChange={e => setSupportForm({...supportForm, message: e.target.value})} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 font-medium resize-none transition-all"></textarea>
                  <div className="bg-brandGold/5 p-4 rounded-2xl border border-brandGold/20 mt-2 flex gap-3 items-start">
                    <Info size={18} className="text-brandGold shrink-0 mt-0.5" />
                    <p className="text-xs text-brandDark font-medium leading-relaxed">After sending, you'll be contacted by <strong className="font-extrabold">{supportForm.platform === 'whatsapp' ? '+91 87778 45713' : '@X_o_x_o_002'}</strong> on {supportForm.platform === 'whatsapp' ? 'WhatsApp' : 'Telegram'} within 36 hours. Please be patient.</p>
                  </div>
                  <button type="submit" disabled={supportLoading} className="w-full bg-brandDark text-white py-4 rounded-full font-bold shadow-lg hover:bg-brandAccent hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">
                    {supportLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {supportLoading ? 'Sending...' : 'Send Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Remove Guardian Confirm Modal */}
        {guardianToRemove && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-initial:opacity-0 animate-initial:scale-90 animate-enter:opacity-100 animate-enter:scale-100 animate-spring animate-stiffness-220 animate-damping-7">
              <div className="w-20 h-20 bg-red-50 border border-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner"><UserMinus size={36} /></div>
              <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Remove Guardian?</h2>
              <p className="text-zinc-500 mb-10 text-base font-medium leading-relaxed">Are you sure you want to remove <strong className="text-brandDark">{guardianToRemove.name || guardianToRemove.email}</strong>? They will instantly lose access to your family dashboard.</p>
              <div className="flex flex-col gap-3">
                <button onClick={confirmRemoveGuardian} className="w-full bg-red-600 text-white py-4 rounded-full font-bold shadow-lg hover:bg-red-700 hover:shadow-xl hover:-translate-y-0.5 transition-all animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Yes, Remove Access</button>
                <button onClick={() => setGuardianToRemove(null)} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold hover:bg-zinc-200 transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 relative animate-initial:opacity-0 animate-initial:scale-90 animate-enter:opacity-100 animate-enter:scale-100 animate-spring animate-stiffness-220 animate-damping-7">
              <button onClick={() => setShowShareModal(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-brandDark bg-zinc-50 hover:bg-zinc-100 p-2.5 rounded-full transition-colors border border-zinc-200 shadow-sm animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7"><X size={20} /></button>
              <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner"><Share2 size={36} /></div>
              <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Share KinTag</h2>
              <p className="text-zinc-500 mb-10 text-base font-medium leading-relaxed">Enjoying KinTag? Help us build a safer community by sharing it with your friends and family.</p>
              <button onClick={handleShareApp} className="w-full bg-emerald-500 text-white py-4 rounded-full font-bold shadow-lg hover:bg-emerald-600 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7"><Share2 size={18} /> Share Now</button>
              {shareMessage && <p className="text-sm text-emerald-600 font-bold mt-5 animate-in fade-in duration-300 bg-emerald-50 py-2 rounded-full border border-emerald-100">{shareMessage}</p>}
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteZone && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl border border-white/20 relative animate-initial:opacity-0 animate-initial:scale-90 animate-enter:opacity-100 animate-enter:scale-100 animate-spring animate-stiffness-220 animate-damping-7">
              <button onClick={() => { setShowDeleteZone(false); setDeleteError(''); setDeleteInput(''); }} className="absolute top-6 right-6 text-zinc-400 hover:text-brandDark bg-zinc-50 hover:bg-zinc-100 p-2.5 rounded-full transition-colors border border-zinc-200 shadow-sm animate-hover:scale-110 animate-tap:scale-90 animate-spring animate-stiffness-220 animate-damping-7"><X size={20} /></button>
              <div className="w-20 h-20 bg-red-50 border border-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner"><AlertOctagon size={36} /></div>
              <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Final Warning</h2>
              <p className="text-zinc-500 mb-6 text-sm font-medium leading-relaxed">This action is permanent and cannot be reversed. To proceed, type the confirmation phrase exactly as shown below:</p>
              {deleteError && <div className="mb-5 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100">{deleteError}</div>}
              <div className="bg-zinc-100 p-4 rounded-2xl mb-5 text-sm text-zinc-600 font-mono select-all border border-zinc-200 shadow-inner">{deleteConfirmationPhrase}</div>
              <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="Type confirmation phrase..." className="w-full p-4 bg-white border border-zinc-200 rounded-2xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-medium mb-8 text-center shadow-sm" />
              <div className="flex flex-col gap-3">
                <button onClick={handleDeleteAccount} disabled={deleteInput !== deleteConfirmationPhrase || isDeleting} className="w-full bg-red-600 text-white py-4 rounded-full font-bold shadow-lg hover:bg-red-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">{isDeleting ? 'Deleting Account...' : 'Permanently Delete'}</button>
                <button onClick={() => { setShowDeleteZone(false); setDeleteError(''); setDeleteInput(''); }} className="w-full bg-zinc-100 text-zinc-600 font-bold py-4 rounded-full hover:bg-zinc-200 transition-colors animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7">Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
