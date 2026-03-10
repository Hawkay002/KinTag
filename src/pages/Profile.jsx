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

  // 🌟 UPDATED: Listen for Install Prompt and check window variable
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.pwaDeferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Grab it if it fired early
    if (window.pwaDeferredPrompt) {
      setDeferredPrompt(window.pwaDeferredPrompt);
    }

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
      setTimeout(() => { 
        setShowSupportModal(false); 
        setSupportMessage(''); 
      }, 3000);
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
      console.error(err);
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
    
    if (invitedCount >= 5) {
      return setInviteError("You have reached the maximum of 5 co-guardians.");
    }
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

  if (loading) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-bold text-zinc-500">Loading Profile...</div>;

  const currentFamilyId = userData?.familyId || auth.currentUser?.uid;
  const invitedGuardians = familyMembers.filter(m => m.id !== currentFamilyId);

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8 relative pb-20">
      <div className="max-w-2xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/')} className="flex items-center space-x-2 text-zinc-500 hover:text-brandDark font-bold transition-colors">
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-premium border border-zinc-100 p-8 mb-8 text-center relative overflow-hidden">
          
          <button 
            onClick={() => setShowShareModal(true)} 
            className="absolute top-6 left-6 flex items-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-3 rounded-full transition-all duration-300 shadow-sm group"
            title="Share KinTag"
          >
            <Share2 size={18} className="shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 font-bold text-sm">
              Share
            </span>
          </button>

          <button 
            onClick={handleLogout} 
            className="absolute top-6 right-6 flex items-center bg-red-50 text-red-600 hover:bg-red-100 p-3 rounded-full transition-all duration-300 shadow-sm group"
            title="Log Out Securely"
          >
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 group-hover:mr-2 transition-all duration-300 font-bold text-sm">
              Log Out
            </span>
            <LogOut size={18} className="shrink-0" />
          </button>

          <div className="w-24 h-24 bg-brandMuted text-brandDark rounded-full flex items-center justify-center mx-auto mb-4 relative mt-4 md:mt-0">
            <User size={40} />
            {!userData?.zipCode && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" title="Missing Zip Code"></span>}
          </div>

          <div className="flex flex-col items-center justify-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input type="text" defaultValue={userData?.name || ''} onChange={(e) => setEditNameValue(e.target.value)} className="px-3 py-1.5 border border-zinc-300 rounded-lg outline-none focus:border-brandDark text-lg font-bold text-center" autoFocus/>
                  <button onClick={handleSaveName} className="bg-brandDark text-white px-3 py-1.5 rounded-lg font-bold text-sm hover:bg-brandAccent transition">Save</button>
                  <button onClick={() => setIsEditingName(false)} className="text-zinc-400 hover:text-zinc-600 bg-zinc-100 p-1.5 rounded-lg transition"><X size={18}/></button>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-extrabold text-brandDark tracking-tight">{userData?.name || 'Guardian'}</h1>
                  <button onClick={() => { setEditNameValue(userData?.name || ''); setIsEditingName(true); }} className="text-zinc-400 hover:text-brandGold transition-colors" title="Edit Name"><Edit2 size={16} /></button>
                </>
              )}
            </div>
            <p className="text-zinc-500 font-medium">{auth.currentUser?.email}</p>
          </div>

          <div className="max-w-xs mx-auto bg-zinc-50 p-4 rounded-2xl border border-zinc-200 mt-6 relative">
            <div className="flex items-center justify-center gap-2 mb-2 text-brandDark font-bold">
              <MapPin size={16} className="text-brandGold" />
              <span>Broadcast Zip Code</span>
            </div>
            <p className="text-xs text-zinc-500 mb-3 px-2">Set your local Zip Code to receive community KinAlerts in your area.</p>
            
            {isEditingZip ? (
              <div className="flex items-center gap-2">
                <input type="text" placeholder="Enter Zip/Pincode" defaultValue={userData?.zipCode || ''} onChange={(e) => setEditZipValue(e.target.value)} className="w-full px-3 py-2 border border-zinc-300 rounded-xl outline-none focus:border-brandDark font-bold text-center" autoFocus/>
                <button onClick={handleSaveZipCode} className="bg-brandDark text-white px-3 py-2 rounded-xl font-bold text-sm hover:bg-brandAccent transition">Save</button>
                <button onClick={() => setIsEditingZip(false)} className="text-zinc-400 hover:text-zinc-600 bg-zinc-200 p-2 rounded-xl transition"><X size={18}/></button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button onClick={() => { setEditZipValue(userData?.zipCode || ''); setIsEditingZip(true); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all relative ${userData?.zipCode ? 'bg-white border border-zinc-200 text-brandDark shadow-sm hover:bg-zinc-100' : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'}`}>
                  {userData?.zipCode ? <span>{userData.zipCode}</span> : <span>Setup Zip Code Now</span>}
                  <Edit2 size={14} />
                  {!userData?.zipCode && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>}
                </button>
              </div>
            )}
          </div>
          {profileError && <div className="mt-6 mx-auto max-w-xs p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">{profileError}</div>}
          {profileSuccess && <div className="mt-6 mx-auto max-w-xs p-4 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl border border-emerald-100 flex items-center justify-center gap-2"><CheckCircle2 size={18} /> {profileSuccess}</div>}
        </div>

        {/* Co-Guardians Card */}
        <div className="bg-white rounded-3xl shadow-premium border border-zinc-100 p-8 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users size={24} className="text-brandGold" />
            <h2 className="text-2xl font-extrabold text-brandDark tracking-tight">Family Sharing</h2>
          </div>
          <p className="text-zinc-500 font-medium mb-6 leading-relaxed">
            Invite up to 5 family members to manage profiles and receive emergency scan notifications on their own phones.
          </p>

          {inviteError && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">{inviteError}</div>}
          {inviteSuccess && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl border border-emerald-100 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2"><CheckCircle2 size={18} /> {inviteSuccess}</span>
          </div>}

          {invitedGuardians.length < 5 && (
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 mb-8">
              <input type="email" placeholder="Enter guardian's email..." value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required className="flex-1 p-3.5 bg-brandMuted border-transparent rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all font-medium" />
              <button type="submit" disabled={inviteLoading} className="bg-brandDark text-white px-6 py-3.5 rounded-xl font-bold hover:bg-brandAccent transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 shrink-0">
                {inviteLoading ? <Loader2 size={18} className="animate-spin"/> : <Mail size={18} />}
                <span>Send Invite</span>
              </button>
            </form>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-zinc-400 uppercase tracking-widest mb-3">
              Active Co-Guardians ({invitedGuardians.length}/5)
            </h3>
            {familyMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-zinc-200 text-zinc-500 shadow-sm shrink-0">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-brandDark truncate">{member.name || 'Guardian'}</p>
                    <p className="text-xs text-zinc-500 font-medium truncate">{member.email}</p>
                  </div>
                </div>
                
                {member.id === currentFamilyId ? (
                  <span className="text-[10px] font-extrabold bg-brandGold/20 text-brandGold px-2 py-1 rounded-md uppercase tracking-widest shrink-0">Primary</span>
                ) : (
                  auth.currentUser?.uid === currentFamilyId ? (
                     <button onClick={() => setGuardianToRemove(member)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0" title="Remove Guardian">
                        <Trash2 size={16} />
                     </button>
                  ) : (
                     <span className="text-[10px] font-extrabold bg-zinc-200 text-zinc-500 px-2 py-1 rounded-md uppercase tracking-widest shrink-0">Co-Guardian</span>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Install App Dynamic Block */}
        {deferredPrompt && (
          <div className="bg-brandDark text-white rounded-3xl shadow-premium p-6 md:p-8 mb-8 flex flex-col sm:flex-row items-center justify-between transition-all hover:shadow-lg gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
               <div className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center shrink-0">
                  <Smartphone size={24} />
               </div>
               <div>
                 <h3 className="text-xl font-extrabold mb-1">Install KinTag App</h3>
                 <p className="text-sm text-white/70 font-medium max-w-sm">Add KinTag to your home screen for a seamless, full-screen native experience.</p>
               </div>
            </div>
            <button onClick={handleInstallApp} className="w-full sm:w-auto bg-brandGold text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:bg-amber-500 transition-colors shrink-0 flex items-center justify-center gap-2">
               <Download size={18} />
               Install Now
            </button>
          </div>
        )}

        {/* Support Block */}
        <div className="bg-white rounded-3xl shadow-premium border border-zinc-100 p-6 md:p-8 mb-8 flex flex-col sm:flex-row items-center justify-between transition-all hover:shadow-md gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
             <div className="w-14 h-14 bg-brandGold/10 text-brandGold rounded-full flex items-center justify-center shrink-0">
                <LifeBuoy size={24} />
             </div>
             <div>
               <h3 className="text-xl font-extrabold text-brandDark mb-1">Help & Support</h3>
               <p className="text-sm text-zinc-500 font-medium max-w-sm">Need help with your account or tags? Contact the developer directly via WhatsApp or Telegram.</p>
             </div>
          </div>
          <button 
            onClick={openSupport} 
            disabled={supportTickets.length > 0}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold shadow-md transition-colors shrink-0 ${
              supportTickets.length > 0 
                ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed' 
                : 'bg-brandDark text-white hover:bg-brandAccent'
            }`}
          >
             {supportTickets.length > 0 ? 'Ticket Active (1/1)' : 'Contact Support'}
          </button>
        </div>

        {/* Active Support Tickets UI */}
        {supportTickets.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 p-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-sm font-extrabold text-zinc-400 uppercase tracking-widest mb-4">
              Active Support Tickets ({supportTickets.length}/1)
            </h3>
            <div className="space-y-3">
              {supportTickets.map((ticket) => (
                <div key={ticket.id} className="bg-zinc-50 rounded-2xl border border-zinc-200 overflow-hidden transition-all duration-300">
                  
                  <button 
                    onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)} 
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                      <span className="font-mono font-bold text-brandDark tracking-wide">{ticket.supportId}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-500">
                      <span className="hidden sm:inline">View Details</span>
                      <ChevronDown size={18} className={`transition-transform duration-300 ${expandedTicketId === ticket.id ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedTicketId === ticket.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-5 pt-0 border-t border-zinc-200 mt-2">
                      <div className="flex items-center gap-2 mb-3 mt-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        <span>Submitted on:</span>
                        <span className="text-zinc-600">{new Date(ticket.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <p className="text-sm text-brandDark font-medium bg-white p-4 rounded-xl border border-zinc-200 mb-4 whitespace-pre-wrap leading-relaxed shadow-sm">
                        "{ticket.message}"
                      </p>
                      
                      <button 
                        onClick={() => handleResolveTicket(ticket)}
                        disabled={resolvingTicketId === ticket.id}
                        className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-sm hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
          <span className="absolute bg-zinc-50 px-4 text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            Danger Zone
          </span>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50/50 rounded-3xl border border-red-100 p-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertOctagon size={24} className="text-red-500" />
            <h2 className="text-2xl font-extrabold text-red-600 tracking-tight">Delete Account</h2>
          </div>
          <p className="text-red-800/70 font-medium mb-6 leading-relaxed">
            Permanently delete your account, all profiles, and all scan history. This action cannot be undone.
          </p>
          <button onClick={() => setShowDeleteZone(true)} className="bg-red-100 text-red-600 font-bold px-6 py-3 rounded-xl hover:bg-red-200 transition-colors shadow-sm">
            Delete Account
          </button>
        </div>

        {/* --- MODALS --- */}

        {/* Support Form Modal */}
        {showSupportModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-zinc-100 my-8 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold text-brandDark tracking-tight flex items-center gap-2">
                  <LifeBuoy size={24} className="text-brandGold"/> Support Ticket
                </h2>
                <button onClick={() => setShowSupportModal(false)} className="text-zinc-400 hover:bg-zinc-100 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              {supportMessage ? (
                 <div className="bg-emerald-50 text-emerald-600 p-6 rounded-2xl text-center font-bold border border-emerald-100 flex flex-col items-center justify-center gap-3">
                   <CheckCircle2 size={40} className="text-emerald-500" />
                   <p>{supportMessage}</p>
                 </div>
              ) : (
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                   {supportError && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">{supportError}</div>}

                   <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 flex justify-between items-center relative group transition-colors hover:border-zinc-300">
                     <div className="flex items-center gap-1.5">
                       <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Ticket ID</span>
                       <div className="relative flex items-center justify-center">
                          <Info size={14} className="text-brandGold cursor-help peer" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-brandDark text-white text-[10px] p-2 rounded-lg opacity-0 peer-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center shadow-xl">
                            Copy and save this ID for future reference.
                          </div>
                       </div>
                     </div>
                     <button type="button" onClick={() => copySupportId(supportForm.supportId)} className="flex items-center gap-2 text-brandDark hover:text-brandGold transition-colors" title="Copy ID">
                       <span className="font-mono font-bold tracking-wide">{supportForm.supportId}</span>
                       {copiedId ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}
                     </button>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <input type="text" placeholder="Your Name" required value={supportForm.name} onChange={e => setSupportForm({...supportForm, name: e.target.value})} className="p-3 bg-white border border-zinc-300 rounded-xl outline-none focus:border-brandDark focus:ring-1 focus:ring-brandDark font-medium" />
                     <input type="email" placeholder="Your Email" required value={supportForm.email} onChange={e => setSupportForm({...supportForm, email: e.target.value})} className="p-3 bg-white border border-zinc-300 rounded-xl outline-none focus:border-brandDark focus:ring-1 focus:ring-brandDark font-medium" />
                   </div>

                   <div className="flex bg-zinc-100 p-1 rounded-xl">
                      <button type="button" onClick={() => setSupportForm({...supportForm, platform: 'whatsapp', contactValue: ''})} className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${supportForm.platform === 'whatsapp' ? 'bg-white shadow-sm text-emerald-600' : 'text-zinc-500 hover:text-brandDark'}`}>
                        <MessageCircle size={16} /> WhatsApp
                      </button>
                      <button type="button" onClick={() => setSupportForm({...supportForm, platform: 'telegram', contactValue: ''})} className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${supportForm.platform === 'telegram' ? 'bg-white shadow-sm text-sky-500' : 'text-zinc-500 hover:text-brandDark'}`}>
                        <Send size={16} /> Telegram
                      </button>
                   </div>

                   {supportForm.platform === 'whatsapp' ? (
                     <div className="flex w-full border border-zinc-300 rounded-xl focus-within:border-brandDark focus-within:ring-1 focus-within:ring-brandDark bg-white overflow-hidden transition-all relative">
                        <div className="relative flex items-center bg-zinc-50 hover:bg-zinc-100 border-r border-zinc-200 px-3 cursor-pointer shrink-0 transition-colors">
                          <img src={`https://flagcdn.com/w20/${supportForm.countryIso || 'us'}.png`} alt="flag" className="w-5 h-auto rounded-sm shrink-0 shadow-[0_0_2px_rgba(0,0,0,0.2)]" />
                          <span className="ml-2 text-sm font-bold text-brandDark">{supportForm.countryCode || '+1'}</span>
                          <select value={`${supportForm.countryCode}|${supportForm.countryIso}`} onChange={(e) => { const [code, iso] = e.target.value.split('|'); setSupportForm({...supportForm, countryCode: code, countryIso: iso}); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                            {sortedCountryCodes.map((c, i) => <option key={`${c.iso}-${i}`} value={`${c.code}|${c.iso}`}>{c.country} ({c.code})</option>)}
                          </select>
                        </div>
                        <input type="tel" placeholder="WhatsApp Number" required value={supportForm.contactValue} onChange={e => setSupportForm({...supportForm, contactValue: e.target.value})} className="flex-1 p-3 outline-none w-full bg-transparent font-medium" />
                     </div>
                   ) : (
                     <div className="flex w-full border border-zinc-300 rounded-xl focus-within:border-brandDark focus-within:ring-1 focus-within:ring-brandDark bg-white overflow-hidden transition-all">
                        <div className="flex items-center bg-zinc-50 border-r border-zinc-200 px-4 text-zinc-500 font-bold shrink-0">
                          @
                        </div>
                        <input 
                          type="text" 
                          placeholder="username" 
                          required 
                          value={supportForm.contactValue} 
                          onChange={e => setSupportForm({...supportForm, contactValue: e.target.value.replace(/^@/, '')})} 
                          className="flex-1 p-3 outline-none w-full bg-transparent font-medium" 
                        />
                     </div>
                   )}

                   <textarea placeholder="How can we help you?" required rows="4" value={supportForm.message} onChange={e => setSupportForm({...supportForm, message: e.target.value})} className="w-full p-3 border border-zinc-300 rounded-xl outline-none focus:border-brandDark focus:ring-1 focus:ring-brandDark font-medium resize-none"></textarea>

                   <div className="bg-brandGold/10 p-3 rounded-xl border border-brandGold/20 mt-1">
                      <p className="text-xs text-brandDark font-medium leading-relaxed">
                        <strong>Note:</strong> After sending your request, you'll be contacted by <strong className="font-extrabold">{supportForm.platform === 'whatsapp' ? '+91 87778 45713' : '@X_o_x_o_002'}</strong> on {supportForm.platform === 'whatsapp' ? 'WhatsApp' : 'Telegram'} within 36 hours. Please be patient.
                      </p>
                   </div>

                   <button type="submit" disabled={supportLoading} className="w-full bg-brandDark text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-brandAccent transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                     {supportLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                     {supportLoading ? 'Sending...' : 'Send Request'}
                   </button>
                </form>
              )}
            </div>
          </div>
        )}

        {guardianToRemove && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
                <UserMinus size={32} />
              </div>
              <h2 className="text-2xl font-extrabold text-brandDark mb-2 tracking-tight">Remove Guardian?</h2>
              <p className="text-zinc-500 mb-8 text-sm font-medium leading-relaxed">
                Are you sure you want to remove <strong className="text-brandDark">{guardianToRemove.name || guardianToRemove.email}</strong>? They will instantly lose access to your family dashboard, profiles, and notifications.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setGuardianToRemove(null)} className="flex-1 bg-brandMuted text-brandDark py-3.5 rounded-xl font-bold hover:bg-zinc-200 transition-colors">Cancel</button>
                <button onClick={confirmRemoveGuardian} className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors">Yes, Remove</button>
              </div>
            </div>
          </div>
        )}

        {showShareModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200 relative">
              <button onClick={() => setShowShareModal(false)} className="absolute top-6 right-6 text-zinc-400 hover:bg-zinc-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 size={32} />
              </div>
              <h2 className="text-2xl font-extrabold text-brandDark mb-2 tracking-tight">Share KinTag</h2>
              <p className="text-zinc-500 mb-8 text-sm font-medium leading-relaxed">
                Enjoying KinTag? Help us build a safer community by sharing it with your friends and family.
              </p>
              <button onClick={handleShareApp} className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                <Share2 size={18} /> Share Now
              </button>
              {shareMessage && <p className="text-xs text-emerald-600 font-bold mt-4 animate-in fade-in duration-300">{shareMessage}</p>}
            </div>
          </div>
        )}

        {showDeleteZone && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200 relative">
              <button onClick={() => { setShowDeleteZone(false); setDeleteError(''); setDeleteInput(''); }} className="absolute top-6 right-6 text-zinc-400 hover:bg-zinc-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertOctagon size={32} />
              </div>
              <h2 className="text-2xl font-extrabold text-brandDark mb-2 tracking-tight">Delete Account?</h2>
              <p className="text-zinc-500 mb-6 text-sm font-medium leading-relaxed">
                This action cannot be undone. To proceed, type the following phrase exactly as shown below:
              </p>
              {deleteError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">{deleteError}</div>}
              <div className="bg-zinc-100 p-3 rounded-lg mb-4 text-sm text-zinc-600 font-mono select-all">
                {deleteConfirmationPhrase}
              </div>
              <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="Type the confirmation phrase here..." className="w-full p-3.5 bg-white border border-zinc-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-medium mb-6 text-center" />
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteZone(false); setDeleteError(''); setDeleteInput(''); }} className="flex-1 bg-zinc-100 text-zinc-600 font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-colors">Cancel</button>
                <button onClick={handleDeleteAccount} disabled={deleteInput !== deleteConfirmationPhrase || isDeleting} className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors disabled:opacity-50">
                  {isDeleting ? 'Deleting...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
