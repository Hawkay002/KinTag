import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, updateDoc, addDoc } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ArrowLeft, Users, Mail, CheckCircle2, Loader2, Copy, Edit2, AlertOctagon, X, Trash2, UserMinus, MapPin, Share2, LifeBuoy, MessageCircle, Send, Info, ChevronDown, Check, Smartphone, Download } from 'lucide-react'; 
import { sortedCountryCodes } from '../data/countryCodes'; 

export default function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const [isEditingZip, setIsEditingZip] = useState(false);
  const [editZipValue, setEditZipValue] = useState("");

  const [guardianToRemove, setGuardianToRemove] = useState(null);

  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteConfirmationPhrase = auth.currentUser ? `I know this will delete all data related to this account, still I want to delete my account, ${auth.currentUser.email}` : '';

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  
  const [supportTickets, setSupportTickets] = useState([]);
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [resolvingTicketId, setResolvingTicketId] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportError, setSupportError] = useState('');
  const [supportForm, setSupportForm] = useState({
    supportId: '', name: '', email: '', platform: 'whatsapp', countryCode: '+1', countryIso: 'us', contactValue: '', message: ''
  });

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

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      window.pwaDeferredPrompt = null;
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        let activeFamilyId = auth.currentUser.uid; 

        if (userDoc.exists()) {
          const data = userDoc.data();
          activeFamilyId = data.familyId || auth.currentUser.uid;
          setUserData({ ...data, familyId: activeFamilyId });
        } else {
          setUserData({ name: '', zipCode: '', familyId: activeFamilyId });
        }
        
        const familyQuery = query(collection(db, "users"), where("familyId", "==", activeFamilyId));
        const familySnaps = await getDocs(familyQuery);
        setFamilyMembers(familySnaps.docs.map(d => ({ id: d.id, ...d.data() })));

        const ticketsQuery = query(collection(db, "support_tickets"), where("userId", "==", auth.currentUser.uid));
        const ticketsSnaps = await getDocs(ticketsQuery);
        const fetchedTickets = ticketsSnaps.docs.map(d => ({ id: d.id, ...d.data() }));
        setSupportTickets(fetchedTickets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
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

  const handleShareApp = async () => {
    const shareData = {
      title: 'KinTag - Digital Safety Net',
      text: "I use KinTag to secure my family with digital IDs and instant GPS alerts. It's 100% free! Check it out and create your own tags.",
      url: window.location.origin
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareMessage("Thanks for sharing KinTag!");
        setTimeout(() => setShareMessage(''), 3000);
      } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setShareMessage("Link copied to clipboard!");
        setTimeout(() => setShareMessage(''), 3000);
      } catch (err) {
        setShareMessage("Failed to copy link.");
      }
    }
  };

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
      const docRef = await addDoc(collection(db, "support_tickets"), ticketData);
      
      setSupportTickets([{ id: docRef.id, ...ticketData }, ...supportTickets]);
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
      setSupportTickets(prev => prev.filter(t => t.id !== ticket.id));
    } catch (err) {
      alert("Failed to resolve ticket. Please try again.");
    } finally {
      setResolvingTicketId(null);
    }
  };

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
      setFamilyMembers(prev => prev.filter(m => m.id !== guardianToRemove.id));
      setInviteSuccess(`${guardianToRemove.name || guardianToRemove.email} was removed successfully.`);
    } catch (err) {
      setInviteError("Failed to remove guardian.");
    } finally {
      setGuardianToRemove(null);
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

  if (loading) return <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-bold text-zinc-500">Loading Profile...</div>;

  const currentFamilyId = userData?.familyId || auth.currentUser?.uid;
  const invitedGuardians = familyMembers.filter(m => m.id !== currentFamilyId);

  return (
    <div className="min-h-screen bg-[#fafafa] p-4 md:p-8 relative pb-24 selection:bg-brandGold selection:text-white">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-brandGold/10 via-emerald-400/5 to-transparent rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="max-w-2xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4">
        
        <button onClick={() => navigate('/')} className="group flex items-center space-x-2 bg-white/60 backdrop-blur-md border border-zinc-200 text-zinc-600 px-5 py-2.5 rounded-full font-bold shadow-sm hover:shadow-md hover:bg-white transition-all mb-8">
          <ArrowLeft size={18} className="transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        {/* 🌟 Profile Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-200/80 p-8 md:p-10 mb-8 text-center relative overflow-hidden group">
          
          <button onClick={() => setShowShareModal(true)} className="absolute top-6 left-6 flex items-center bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 p-3 rounded-full transition-all duration-300 shadow-sm hover:shadow-md group/btn" title="Share KinTag">
            <Share2 size={18} className="shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover/btn:max-w-[100px] group-hover/btn:opacity-100 group-hover/btn:ml-2 transition-all duration-300 font-bold text-sm">Share</span>
          </button>

          <button onClick={handleLogout} className="absolute top-6 right-6 flex items-center bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 p-3 rounded-full transition-all duration-300 shadow-sm hover:shadow-md group/btn" title="Log Out Securely">
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover/btn:max-w-[100px] group-hover/btn:opacity-100 group-hover/btn:mr-2 transition-all duration-300 font-bold text-sm">Log Out</span>
            <LogOut size={18} className="shrink-0" />
          </button>

          <div className="w-28 h-28 bg-gradient-to-br from-zinc-50 to-zinc-100 border border-zinc-200 text-zinc-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative mt-8 md:mt-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
            <User size={48} />
            {!userData?.zipCode && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 border-[3px] border-white rounded-full animate-pulse" title="Missing Zip Code"></span>}
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
                <button onClick={() => { setEditZipValue(userData?.zipCode || ''); setIsEditingZip(true); }} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-sm hover:shadow-md relative ${userData?.zipCode ? 'bg-white border border-zinc-200 text-brandDark hover:-translate-y-0.5' : 'bg-red-50 border border-red-200 text-red-600 hover:-translate-y-0.5'}`}>
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

        {/* 🌟 Co-Guardians Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-200/80 p-8 md:p-10 mb-8">
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
              <button type="submit" disabled={inviteLoading} className="bg-brandDark text-white px-8 py-4 rounded-full font-bold hover:bg-brandAccent transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 active:scale-95">
                {inviteLoading ? <Loader2 size={18} className="animate-spin"/> : 'Send Invite'}
              </button>
            </form>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              Active Co-Guardians <span className="bg-zinc-100 px-2 py-0.5 rounded-md text-zinc-500">{invitedGuardians.length}/5</span>
            </h3>
            {familyMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-200 text-zinc-500 shadow-inner shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-brandDark truncate text-base">{member.name || 'Guardian'}</p>
                    <p className="text-xs text-zinc-500 font-medium truncate">{member.email}</p>
                  </div>
                </div>
                
                {member.id === currentFamilyId ? (
                  <span className="text-[10px] font-extrabold bg-brandGold/10 border border-brandGold/20 text-brandGold px-3 py-1.5 rounded-full uppercase tracking-widest shrink-0 shadow-sm">Primary</span>
                ) : (
                  auth.currentUser?.uid === currentFamilyId ? (
                     <button onClick={() => setGuardianToRemove(member)} className="text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 p-2.5 rounded-xl transition-all shadow-sm active:scale-95 shrink-0" title="Remove Guardian">
                        <Trash2 size={18} />
                     </button>
                  ) : (
                     <span className="text-[10px] font-extrabold bg-zinc-100 border border-zinc-200 text-zinc-500 px-3 py-1.5 rounded-full uppercase tracking-widest shrink-0 shadow-sm">Co-Guardian</span>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 🌟 Install App Dynamic Block */}
        {deferredPrompt && (
          <div className="bg-brandDark text-white rounded-[2.5rem] shadow-xl p-8 md:p-10 mb-8 flex flex-col sm:flex-row items-center justify-between transition-all hover:shadow-2xl gap-6 relative overflow-hidden group">
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
            <button onClick={handleInstallApp} className="w-full sm:w-auto bg-brandGold text-brandDark px-8 py-4 rounded-full font-bold shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all shrink-0 flex items-center justify-center gap-2 hover:-translate-y-1 active:scale-95 relative z-10">
               <Download size={18} />
               Install Now
            </button>
          </div>
        )}

        {/* 🌟 Support Block */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-200/80 p-8 md:p-10 mb-8 flex flex-col sm:flex-row items-center justify-between transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.1)] gap-6">
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
            className={`w-full sm:w-auto px-8 py-4 rounded-full font-bold shadow-md transition-all shrink-0 active:scale-95 ${
              supportTickets.length > 0 
                ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed' 
                : 'bg-white text-brandDark border border-zinc-200 hover:bg-zinc-50 hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
             {supportTickets.length > 0 ? 'Ticket Active (1/1)' : 'Contact Support'}
          </button>
        </div>

        {/* 🌟 Active Support Tickets UI */}
        {supportTickets.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-200/80 p-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              Active Support Tickets <span className="bg-zinc-100 px-2 py-0.5 rounded-md text-zinc-500">{supportTickets.length}/1</span>
            </h3>
            <div className="space-y-4">
              {supportTickets.map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-[1.5rem] border border-zinc-200 shadow-sm overflow-hidden transition-all duration-300">
                  
                  <button 
                    onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)} 
                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-zinc-50 transition-colors outline-none"
                  >
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
                      
                      <button 
                        onClick={() => handleResolveTicket(ticket)}
                        disabled={resolvingTicketId === ticket.id}
                        className="w-full bg-emerald-500 text-white py-4 rounded-full font-bold shadow-md hover:bg-emerald-600 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
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

        <div className="flex items-center justify-center mb-8 relative">
          <div className="w-full h-px bg-zinc-200"></div>
          <span className="absolute bg-[#fafafa] px-4 text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            Danger Zone
          </span>
        </div>

        {/* 🌟 Danger Zone */}
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
          <button onClick={() => setShowDeleteZone(true)} className="bg-white border border-red-200 text-red-600 font-bold px-8 py-4 rounded-full hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm hover:shadow-md active:scale-95 relative z-10">
            Delete Account
          </button>
        </div>

        {/* --- MODALS (Upgraded to Glassmorphism) --- */}

        {/* Support Form Modal */}
        {showSupportModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 max-w-md w-full shadow-2xl border border-white/20 my-8 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-extrabold text-brandDark tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 bg-brandGold/10 text-brandGold rounded-xl flex items-center justify-center border border-brandGold/20"><LifeBuoy size={20}/></div> Support
                </h2>
                <button onClick={() => setShowSupportModal(false)} className="text-zinc-400 hover:text-brandDark bg-zinc-50 hover:bg-zinc-100 p-2.5 rounded-full transition-colors border border-zinc-200 shadow-sm">
                  <X size={20} />
                </button>
              </div>

              {supportMessage ? (
                 <div className="bg-emerald-50 text-emerald-600 p-8 rounded-[2rem] text-center font-bold border border-emerald-100 flex flex-col items-center justify-center gap-4 shadow-inner">
                   <CheckCircle2 size={48} className="text-emerald-500" />
                   <p className="text-lg">{supportMessage}</p>
                 </div>
              ) : (
                <form onSubmit={handleSupportSubmit} className="space-y-5">
                   {supportError && <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 animate-in fade-in">{supportError}</div>}

                   <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 flex justify-between items-center relative group transition-colors hover:border-brandGold/30 shadow-inner">
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Ticket ID</span>
                       <div className="relative flex items-center justify-center">
                          <Info size={14} className="text-brandGold cursor-help peer" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-brandDark text-white text-[10px] p-2.5 rounded-xl opacity-0 peer-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center shadow-xl font-bold">
                            Copy and save this ID for future reference.
                          </div>
                       </div>
                     </div>
                     <button type="button" onClick={() => copySupportId(supportForm.supportId)} className="flex items-center gap-2 text-brandDark hover:text-brandGold transition-colors bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm" title="Copy ID">
                       <span className="font-mono font-bold tracking-wide">{supportForm.supportId}</span>
                       {copiedId ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}
                     </button>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <input type="text" placeholder="Your Name" required value={supportForm.name} onChange={e => setSupportForm({...supportForm, name: e.target.value})} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 font-medium transition-all" />
                     <input type="email" placeholder="Your Email" required value={supportForm.email} onChange={e => setSupportForm({...supportForm, email: e.target.value})} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 font-medium transition-all" />
                   </div>

                   <div className="flex bg-zinc-100 p-1.5 rounded-[1.25rem] border border-zinc-200">
                      <button type="button" onClick={() => setSupportForm({...supportForm, platform: 'whatsapp', contactValue: ''})} className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${supportForm.platform === 'whatsapp' ? 'bg-white shadow-sm text-emerald-600 border border-zinc-200/50' : 'text-zinc-500 hover:text-brandDark'}`}>
                        <MessageCircle size={18} /> WhatsApp
                      </button>
                      <button type="button" onClick={() => setSupportForm({...supportForm, platform: 'telegram', contactValue: ''})} className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${supportForm.platform === 'telegram' ? 'bg-white shadow-sm text-sky-500 border border-zinc-200/50' : 'text-zinc-500 hover:text-brandDark'}`}>
                        <Send size={18} /> Telegram
                      </button>
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
                        <div className="flex items-center bg-white border-r border-zinc-200 px-5 text-zinc-400 font-bold shrink-0 shadow-sm">
                          @
                        </div>
                        <input type="text" placeholder="username" required value={supportForm.contactValue} onChange={e => setSupportForm({...supportForm, contactValue: e.target.value.replace(/^@/, '')})} className="flex-1 p-4 outline-none w-full bg-transparent font-medium" />
                     </div>
                   )}

                   <textarea placeholder="How can we help you?" required rows="4" value={supportForm.message} onChange={e => setSupportForm({...supportForm, message: e.target.value})} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 font-medium resize-none transition-all"></textarea>

                   <div className="bg-brandGold/5 p-4 rounded-2xl border border-brandGold/20 mt-2 flex gap-3 items-start">
                      <Info size={18} className="text-brandGold shrink-0 mt-0.5" />
                      <p className="text-xs text-brandDark font-medium leading-relaxed">
                        After sending, you'll be contacted by <strong className="font-extrabold">{supportForm.platform === 'whatsapp' ? '+91 87778 45713' : '@X_o_x_o_002'}</strong> on {supportForm.platform === 'whatsapp' ? 'WhatsApp' : 'Telegram'} within 36 hours. Please be patient.
                      </p>
                   </div>

                   <button type="submit" disabled={supportLoading} className="w-full bg-brandDark text-white py-4 rounded-full font-bold shadow-lg hover:bg-brandAccent hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                     {supportLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                     {supportLoading ? 'Sending...' : 'Send Request'}
                   </button>
                </form>
              )}
            </div>
          </div>
        )}

        {guardianToRemove && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-red-50 border border-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <UserMinus size={36} />
              </div>
              <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Remove Guardian?</h2>
              <p className="text-zinc-500 mb-10 text-base font-medium leading-relaxed">
                Are you sure you want to remove <strong className="text-brandDark">{guardianToRemove.name || guardianToRemove.email}</strong>? They will instantly lose access to your family dashboard.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={confirmRemoveGuardian} className="w-full bg-red-600 text-white py-4 rounded-full font-bold shadow-lg hover:bg-red-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all">Yes, Remove Access</button>
                <button onClick={() => setGuardianToRemove(null)} className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold hover:bg-zinc-200 transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showShareModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300 relative">
              <button onClick={() => setShowShareModal(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-brandDark bg-zinc-50 hover:bg-zinc-100 p-2.5 rounded-full transition-colors border border-zinc-200 shadow-sm">
                <X size={20} />
              </button>
              <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Share2 size={36} />
              </div>
              <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Share KinTag</h2>
              <p className="text-zinc-500 mb-10 text-base font-medium leading-relaxed">
                Enjoying KinTag? Help us build a safer community by sharing it with your friends and family.
              </p>
              <button onClick={handleShareApp} className="w-full bg-emerald-500 text-white py-4 rounded-full font-bold shadow-lg hover:bg-emerald-600 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2">
                <Share2 size={18} /> Share Now
              </button>
              {shareMessage && <p className="text-sm text-emerald-600 font-bold mt-5 animate-in fade-in duration-300 bg-emerald-50 py-2 rounded-full border border-emerald-100">{shareMessage}</p>}
            </div>
          </div>
        )}

        {showDeleteZone && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300 relative">
              <button onClick={() => { setShowDeleteZone(false); setDeleteError(''); setDeleteInput(''); }} className="absolute top-6 right-6 text-zinc-400 hover:text-brandDark bg-zinc-50 hover:bg-zinc-100 p-2.5 rounded-full transition-colors border border-zinc-200 shadow-sm">
                <X size={20} />
              </button>
              <div className="w-20 h-20 bg-red-50 border border-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <AlertOctagon size={36} />
              </div>
              <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Final Warning</h2>
              <p className="text-zinc-500 mb-6 text-sm font-medium leading-relaxed">
                This action is permanent and cannot be reversed. To proceed, type the confirmation phrase exactly as shown below:
              </p>
              {deleteError && <div className="mb-5 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100">{deleteError}</div>}
              <div className="bg-zinc-100 p-4 rounded-2xl mb-5 text-sm text-zinc-600 font-mono select-all border border-zinc-200 shadow-inner">
                {deleteConfirmationPhrase}
              </div>
              <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="Type confirmation phrase..." className="w-full p-4 bg-white border border-zinc-200 rounded-2xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-medium mb-8 text-center shadow-sm" />
              <div className="flex flex-col gap-3">
                <button onClick={handleDeleteAccount} disabled={deleteInput !== deleteConfirmationPhrase || isDeleting} className="w-full bg-red-600 text-white py-4 rounded-full font-bold shadow-lg hover:bg-red-700 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100">
                  {isDeleting ? 'Deleting Account...' : 'Permanently Delete'}
                </button>
                <button onClick={() => { setShowDeleteZone(false); setDeleteError(''); setDeleteInput(''); }} className="w-full bg-zinc-100 text-zinc-600 font-bold py-4 rounded-full hover:bg-zinc-200 transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
