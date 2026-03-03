import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, updateDoc, addDoc } from 'firebase/firestore'; // 🌟 Added addDoc
import { useNavigate } from 'react-router-dom';
// 🌟 Added Trash2 icon to remove users
import { User, LogOut, ArrowLeft, Users, Mail, Link as LinkIcon, CheckCircle2, Loader2, Copy, Edit2, AlertOctagon, X, Trash2 } from 'lucide-react'; 

export default function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  // Delete Account State
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteConfirmationPhrase = auth.currentUser ? `i know this will delete all data related to this account, still i want to delete my account, ${auth.currentUser.email}` : '';

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
          setUserData({ name: '', familyId: activeFamilyId });
        }
        
        const familyQuery = query(collection(db, "users"), where("familyId", "==", activeFamilyId));
        const familySnaps = await getDocs(familyQuery);
        setFamilyMembers(familySnaps.docs.map(d => ({ id: d.id, ...d.data() })));
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
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { name: editNameValue.trim() });
      setUserData(prev => ({ ...prev, name: editNameValue.trim() }));
      setIsEditingName(false);
    } catch (err) {
      setError("Failed to update name.");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const currentFamilyId = userData?.familyId || auth.currentUser.uid;
    const invitedCount = familyMembers.filter(m => m.id !== currentFamilyId).length;
    
    if (invitedCount >= 5) {
      return setError("You have reached the maximum of 5 co-guardians.");
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
          await navigator.share({
            title: 'KinTag Co-Guardian Invite',
            text: `${userData?.name || 'A family member'} invited you to co-manage their KinTag profiles.`,
            url: link
          });
          sharedNative = true;
          setSuccess("Invite sent successfully!");
        } catch (shareErr) {
          // If user cancels the share sheet, we ignore the error
        }
      } 
      
      if (!sharedNative) {
        try {
          await navigator.clipboard.writeText(link);
          setSuccess("Invite link copied to clipboard!");
        } catch (clipErr) {
          setSuccess("Invite saved! Ask them to sign up with that exact email.");
        }
      }
      
      setInviteEmail('');
    } catch (err) {
      console.error("Invite Error: ", err);
      if (err.message.includes("Missing or insufficient permissions") || err.code === "permission-denied") {
        setError("Firebase Error: You need to update your Firestore Security Rules to allow writing to the 'invites' collection.");
      } else {
        setError(err.message || "Failed to send invite. Please try again.");
      }
    } finally {
      setInviteLoading(false);
    }
  };

  // 🌟 NEW: Securely Remove a Co-Guardian
  const handleRemoveGuardian = async (member) => {
    if (!window.confirm(`Are you sure you want to remove ${member.name || member.email} as a Co-Guardian? They will lose access to all your profiles instantly.`)) return;
    
    try {
      // 1. Reset their database connection so they no longer fetch your cards
      await updateDoc(doc(db, "users", member.id), { familyId: member.id });

      // 2. Delete their original invite document to prevent weird looping bugs
      await deleteDoc(doc(db, "invites", member.email.toLowerCase()));

      // 3. Drop a notification for yourself so you have a record
      await addDoc(collection(db, "scans"), {
        familyId: userData?.familyId || auth.currentUser.uid,
        type: 'invite_response',
        profileName: 'Family Update',
        message: `${member.name || member.email} was securely removed from your family dashboard.`,
        timestamp: new Date().toISOString()
      });

      // 4. Update the screen visually!
      setFamilyMembers(prev => prev.filter(m => m.id !== member.id));
      setSuccess(`${member.name || member.email} was removed successfully.`);
    } catch (err) {
      setError("Failed to remove guardian: " + err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== deleteConfirmationPhrase) return;
    setIsDeleting(true);
    setError('');

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
        setError("For your security, please log out and log back in before deleting your account.");
      } else {
        setError("Failed to delete account: " + err.message);
      }
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-bold text-zinc-500">Loading Profile...</div>;

  const currentFamilyId = userData?.familyId || auth.currentUser?.uid;
  const invitedGuardians = familyMembers.filter(m => m.id !== currentFamilyId);

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8 relative">
      <div className="max-w-2xl mx-auto">
        
        <button onClick={() => navigate('/')} className="mb-6 flex items-center space-x-2 text-zinc-500 hover:text-brandDark font-bold transition-colors">
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-premium border border-zinc-100 p-8 mb-8 text-center relative">
          
          <button 
            onClick={handleLogout} 
            className="absolute top-6 right-6 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 p-3 rounded-full transition-colors shadow-sm"
            title="Log Out Securely"
          >
            <LogOut size={18} />
          </button>

          <div className="w-24 h-24 bg-brandMuted text-brandDark rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={40} />
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  defaultValue={userData?.name || ''} 
                  onChange={(e) => setEditNameValue(e.target.value)}
                  className="px-3 py-1.5 border border-zinc-300 rounded-lg outline-none focus:border-brandDark text-lg font-bold text-center"
                  autoFocus
                />
                <button onClick={handleSaveName} className="bg-brandDark text-white px-3 py-1.5 rounded-lg font-bold text-sm hover:bg-brandAccent transition">Save</button>
                <button onClick={() => setIsEditingName(false)} className="text-zinc-400 hover:text-zinc-600 bg-zinc-100 p-1.5 rounded-lg transition"><X size={18}/></button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-extrabold text-brandDark tracking-tight">{userData?.name || 'Guardian'}</h1>
                <button onClick={() => { setEditNameValue(userData?.name || ''); setIsEditingName(true); }} className="text-zinc-400 hover:text-brandGold transition-colors" title="Edit Name">
                  <Edit2 size={16} />
                </button>
              </>
            )}
          </div>
          
          <p className="text-zinc-500 font-medium">{auth.currentUser?.email}</p>
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

          {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">{error}</div>}
          {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl border border-emerald-100 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2"><CheckCircle2 size={18} /> {success}</span>
          </div>}

          {invitedGuardians.length < 5 && (
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 mb-8">
              <input 
                type="email" 
                placeholder="Enter guardian's email..." 
                value={inviteEmail} 
                onChange={(e) => setInviteEmail(e.target.value)} 
                required 
                className="flex-1 p-3.5 bg-brandMuted border-transparent rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all font-medium" 
              />
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
                     <button onClick={() => handleRemoveGuardian(member)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0" title="Remove Guardian">
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

        {/* Danger Zone for Account Deletion */}
        <div className="bg-red-50/50 rounded-3xl border border-red-100 p-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertOctagon size={24} className="text-red-500" />
            <h2 className="text-2xl font-extrabold text-red-600 tracking-tight">Danger Zone</h2>
          </div>
          <p className="text-red-800/70 font-medium mb-6 leading-relaxed">
            Permanently delete your account, all profiles, and all scan history. This action cannot be undone.
          </p>

          {!showDeleteZone ? (
            <button onClick={() => setShowDeleteZone(true)} className="bg-red-100 text-red-600 font-bold px-6 py-3 rounded-xl hover:bg-red-200 transition-colors">
              Delete Account
            </button>
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-2">
              <p className="text-sm font-bold text-brandDark mb-3">
                To proceed, type the following phrase exactly as shown below:
              </p>
              <div className="bg-zinc-100 p-3 rounded-lg mb-4 text-sm text-zinc-600 font-mono select-all">
                {deleteConfirmationPhrase}
              </div>
              
              <input 
                type="text" 
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Type the confirmation phrase here..."
                className="w-full p-3.5 bg-white border border-zinc-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-medium mb-4"
              />
              
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteZone(false)} className="flex-1 bg-zinc-100 text-zinc-600 font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-colors">Cancel</button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== deleteConfirmationPhrase || isDeleting} 
                  className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
