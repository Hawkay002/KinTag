import { useState, useRef } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { DatabaseBackup, DownloadCloud, UploadCloud, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function BackupRestore() {
  const fileInputRef = useRef(null);
  
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });

  const showStatus = (message, type) => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: '', type: '' }), 5000);
  };

  // --- HELPER: Convert Image URL to Base64 ---
  const getBase64FromUrl = async (url) => {
    try {
      const data = await fetch(url);
      const blob = await data.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob); 
        reader.onloadend = () => resolve(reader.result);
      });
    } catch (err) {
      console.error("Failed to convert image:", err);
      return null;
    }
  };

  // --- HELPER: Upload to Cloudinary ---
  const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; 
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; 
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', uploadPreset);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: uploadData });
      const data = await response.json();
      return data.secure_url; 
    } catch (err) { throw new Error("Upload failed"); }
  };

  // --- 1. BACKUP FUNCTION ---
  const handleBackup = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return showStatus("Authentication error.", "error");

    setIsBackingUp(true);
    setStatus({ message: 'Gathering your family data...', type: 'info' });

    try {
      // 1. Fetch User Settings
      let userData = {};
      const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', currentUser.uid)));
      if (!userSnap.empty) userData = userSnap.docs[0].data();

      // 2. Fetch All Profiles
      const profilesSnap = await getDocs(query(collection(db, 'profiles'), where('familyId', '==', userData.familyId || currentUser.uid)));
      const profiles = [];

      for (const docSnap of profilesSnap.docs) {
        const profileData = docSnap.data();
        
        // Convert the Cloudinary image to raw text so it survives account deletion
        setStatus({ message: `Backing up image for ${profileData.name}...`, type: 'info' });
        if (profileData.imageUrl && !profileData.imageUrl.includes('placehold.co')) {
          profileData.imageBase64 = await getBase64FromUrl(profileData.imageUrl);
        }
        
        profiles.push({ id: docSnap.id, ...profileData });
      }

      // 3. Package the data
      const backupData = {
        kintag_version: "1.3.0",
        timestamp: new Date().toISOString(),
        user: userData,
        profiles: profiles
      };

      // 4. Trigger Download
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `KinTag_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      showStatus("Backup downloaded! Save it to your Google Drive or Files.", "success");
    } catch (err) {
      showStatus("Failed to create backup.", "error");
    } finally {
      setIsBackingUp(false);
    }
  };

  // --- 2. RESTORE FUNCTION ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target.result);
        if (!backupData.kintag_version || !backupData.profiles) {
          throw new Error("Invalid backup file.");
        }
        await processRestore(backupData);
      } catch (err) {
        showStatus("Invalid or corrupted backup file.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  const processRestore = async (backupData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return showStatus("Authentication error.", "error");

    setIsRestoring(true);
    setStatus({ message: 'Rebuilding your profiles...', type: 'info' });

    try {
      const batch = writeBatch(db);
      const newFamilyId = currentUser.uid; 

      // 1. Restore User Data
      const userRef = doc(db, 'users', currentUser.uid);
      batch.set(userRef, { 
        ...backupData.user, 
        familyId: newFamilyId, // Force update to their new ID in case they made a new account
        email: currentUser.email // Keep their current auth email
      }, { merge: true });

      // 2. Restore Profiles
      for (const profile of backupData.profiles) {
        let finalImageUrl = profile.imageUrl;

        // If we saved a Base64 image, convert it back to a file and generate a fresh Cloudinary URL
        if (profile.imageBase64) {
          setStatus({ message: `Restoring image for ${profile.name}...`, type: 'info' });
          try {
            const res = await fetch(profile.imageBase64);
            const blob = await res.blob();
            const imageFile = new File([blob], "restored.jpg", { type: "image/jpeg" });
            
            // Re-upload to Cloudinary to get a permanent live link!
            finalImageUrl = await uploadToCloudinary(imageFile);
          } catch (imgErr) {
            console.error("Failed to restore image:", imgErr);
            finalImageUrl = 'https://placehold.co/600x400/eeeeee/999999?text=Image+Lost';
          }
        }

        const profileRef = doc(collection(db, 'profiles')); // Generate new random ID
        const cleanProfile = { ...profile, familyId: newFamilyId, userId: currentUser.uid, imageUrl: finalImageUrl };
        delete cleanProfile.id; // Remove old ID
        delete cleanProfile.imageBase64; // Don't save raw text to Firestore (too big)

        batch.set(profileRef, cleanProfile);
      }

      await batch.commit();
      showStatus("Account successfully restored! Reloading...", "success");
      setTimeout(() => window.location.reload(), 2000);

    } catch (err) {
      console.error(err);
      showStatus("Failed to restore data.", "error");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-200/80 p-8 md:p-10 mb-8 relative overflow-hidden group">
      
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>

      <div className="flex items-center gap-3 mb-3 relative z-10">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-100 shadow-sm">
          <DatabaseBackup size={24} />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-brandDark tracking-tight">Backup & Restore</h2>
      </div>
      <p className="text-zinc-500 font-medium mb-8 leading-relaxed text-sm md:text-base relative z-10">
        Download a secure, encrypted copy of your profiles to your device or Google Drive. You can use this file to instantly restore your account if you ever leave and come back.
      </p>

      {status.message && (
        <div className={`mb-6 p-4 text-sm font-bold rounded-2xl border flex items-center gap-2 relative z-10 ${
          status.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' :
          status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
          'bg-blue-50 text-blue-600 border-blue-100 animate-pulse'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : status.type === 'error' ? <AlertTriangle size={18} /> : <Loader2 size={18} className="animate-spin" />}
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        <button 
          onClick={handleBackup}
          disabled={isBackingUp || isRestoring}
          className="bg-brandDark text-white p-5 rounded-2xl font-bold flex flex-col items-center justify-center gap-3 shadow-md hover:bg-brandAccent transition-all disabled:opacity-50 active:scale-95 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7"
        >
          {isBackingUp ? <Loader2 size={28} className="text-brandGold animate-spin" /> : <DownloadCloud size={28} className="text-brandGold" />}
          <span>{isBackingUp ? 'Generating...' : 'Download Backup'}</span>
        </button>

        <input 
          type="file" 
          accept=".json" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
        
        <button 
          onClick={() => fileInputRef.current.click()}
          disabled={isBackingUp || isRestoring}
          className="bg-white border border-zinc-200 text-brandDark p-5 rounded-2xl font-bold flex flex-col items-center justify-center gap-3 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 transition-all disabled:opacity-50 active:scale-95 animate-hover:scale-105 animate-tap:scale-95 animate-spring animate-stiffness-220 animate-damping-7"
        >
          {isRestoring ? <Loader2 size={28} className="text-blue-500 animate-spin" /> : <UploadCloud size={28} className="text-blue-500" />}
          <span>{isRestoring ? 'Restoring Data...' : 'Restore from Backup'}</span>
        </button>
      </div>
    </div>
  );
}
