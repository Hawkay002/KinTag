import { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, Plus, X, MapPin, Loader2, Check, CheckCircle2, Info, ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import { sortedCountryCodes } from '../data/countryCodes';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';

const QR_STYLES = {
  obsidian: { name: 'Classic Obsidian', fg: '#18181b', bg: '#ffffff', border: 'border-zinc-200', hexBorder: '#e4e4e7' },
  bubblegum: { name: 'Bubblegum Pink', fg: '#db2777', bg: '#fdf2f8', border: 'border-pink-200', hexBorder: '#fbcfe8' },
  ocean: { name: 'Ocean Blue', fg: '#0284c7', bg: '#f0f9ff', border: 'border-sky-200', hexBorder: '#bae6fd' },
  minty: { name: 'Minty Green', fg: '#0d9488', bg: '#f0fdfa', border: 'border-teal-200', hexBorder: '#99f6e4' },
  lavender: { name: 'Lavender Violet', fg: '#7c3aed', bg: '#f5f3ff', border: 'border-violet-200', hexBorder: '#ddd6fe' },
  sunshine: { name: 'Sunshine Orange', fg: '#d97706', bg: '#fffbeb', border: 'border-amber-200', hexBorder: '#fde68a' },
};

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => { resolve(blob); }, 'image/jpeg', 1);
  });
}

export default function EditCard() {
  const navigate = useNavigate();
  const { profileId } = useParams();
  
  const [currentStep, setCurrentStep] = useState(0);
  const stepTitles = ["Basic Info", "Health Details", "Location Info", "Emergency Contacts", "Vault & Style"];
  const totalSteps = stepTitles.length;

  const [type, setType] = useState('kid');
  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isFetchingLoc, setIsFetchingLoc] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [contacts, setContacts] = useState([]);
  const [primaryContactId, setPrimaryContactId] = useState('');
  const [documents, setDocuments] = useState([]);

  const [formData, setFormData] = useState({
    name: '', dob: '', gender: 'Male', heightUnit: 'ft', heightMain: '', heightSub: '', weightUnit: 'kg', weightMain: '', 
    bloodGroup: 'A+', typeSpecific: '', nationality: '', allergies: 'None Known', policeStation: '', pincode: '', address: '',
    qrStyle: 'obsidian', microchip: '', vaccinationStatus: 'Up to Date', temperament: 'Friendly', specialNeeds: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userDocRef = await getDoc(doc(db, "users", auth.currentUser.uid));
        const userFamilyId = userDocRef.exists() ? userDocRef.data().familyId : auth.currentUser.uid;
        const docRef = doc(db, "profiles", profileId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && (docSnap.data().familyId === userFamilyId || docSnap.data().userId === auth.currentUser.uid)) {
          const data = docSnap.data();
          setType(data.type);
          setCurrentImageUrl(data.imageUrl);
          setIsActive(data.isActive !== false); 
          setFormData({
            name: data.name || '', dob: data.dob || '', gender: data.gender || 'Male',
            heightUnit: data.heightUnit || 'ft', heightMain: data.heightMain || '', heightSub: data.heightSub || '',
            weightUnit: data.weightUnit || 'kg', weightMain: data.weightMain || '', 
            bloodGroup: data.bloodGroup || 'A+', typeSpecific: data.typeSpecific || '', 
            nationality: data.nationality || '', allergies: data.allergies || 'None Known',
            policeStation: data.policeStation || '', pincode: data.pincode || '', address: data.address || '',
            qrStyle: data.qrStyle || 'obsidian', microchip: data.microchip || '', vaccinationStatus: data.vaccinationStatus || 'Up to Date', 
            temperament: data.temperament || 'Friendly', specialNeeds: data.specialNeeds || ''
          });

          if (data.documents && Array.isArray(data.documents)) setDocuments(data.documents.map(d => ({ ...d, file: null, isEditingFile: false })));
          
          if (data.contacts && data.contacts.length > 0) {
            setContacts(data.contacts.map(c => ({ ...c, countryCode: c.countryCode || '+1', countryIso: c.countryIso || 'us' })));
            setPrimaryContactId(data.primaryContactId || data.contacts[0].id);
          } else {
            let legacyContacts = [];
            let p1Id = Date.now().toString();
            legacyContacts.push({ id: p1Id, name: data.parent1Name || '', phone: data.parent1Phone || '', countryCode: '+1', countryIso: 'us', tag: 'Mother', customTag: '' });
            if (data.parent2Name) legacyContacts.push({ id: (Date.now() + 1).toString(), name: data.parent2Name, phone: data.parent2Phone || '', countryCode: '+1', countryIso: 'us', tag: 'Father', customTag: '' });
            setContacts(legacyContacts); setPrimaryContactId(p1Id);
          }
        } else setError("Profile not found or unauthorized.");
      } catch (err) { setError("Failed to load profile details."); } 
      finally { setInitialFetchLoading(false); }
    };
    fetchProfile();
  }, [profileId]);

  const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleContactChange = (id, field, value) => setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  const addContact = () => setContacts([...contacts, { id: Date.now().toString(), name: '', phone: '', countryCode: '+1', countryIso: 'us', tag: 'Other', customTag: '' }]);
  const removeContact = (id) => {
    if (contacts.length === 1) return; 
    const updatedContacts = contacts.filter(c => c.id !== id);
    setContacts(updatedContacts);
    if (primaryContactId === id) setPrimaryContactId(updatedContacts[0].id);
  };
  const addDocument = () => setDocuments([...documents, { id: Date.now().toString(), name: '', file: null, url: '', isEditingFile: false }]);
  const removeDocument = async (id) => {
    const docToRemove = documents.find(d => d.id === id);
    if (docToRemove && docToRemove.url) await deleteOldImage(docToRemove.url);
    setDocuments(documents.filter(d => d.id !== id));
  };
  const handleDocumentChange = (id, field, value) => setDocuments(documents.map(d => d.id === id ? { ...d, [field]: value } : d));

  const fetchLocation = () => {
    if (!navigator.geolocation) return setError("Geolocation is not supported by your browser");
    setIsFetchingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
          const data = await res.json();
          setFormData(prev => ({ ...prev, address: data.display_name, pincode: data.address?.postcode || prev.pincode }));
        } catch (err) { setError("Failed to fetch address details automatically."); } 
        finally { setIsFetchingLoc(false); }
      },
      () => { setError("Location access denied. Please type address manually."); setIsFetchingLoc(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; 
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; 
    const uploadData = new FormData(); uploadData.append('file', file); uploadData.append('upload_preset', uploadPreset);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: uploadData });
    const data = await response.json(); return data.secure_url; 
  };

  const extractPublicId = (url) => {
    if (!url || url.includes('placehold.co')) return null;
    const match = url.match(/\/v\d+\/([^\.]+)/); return match ? match[1] : null;
  };

  const deleteOldImage = async (url) => {
    const publicId = extractPublicId(url);
    if (!publicId) return;
    try { await fetch('/api/delete-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicId }) }); } 
    catch (err) { console.error("Failed to delete old image", err); }
  };

  const handleImageSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => { 
        setImageSrc(reader.result); 
        setShowCropModal(true); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelCrop = () => {
    setShowCropModal(false); 
    setImageSrc(null);
    const fileInput = document.getElementById('image-upload-input');
    if (fileInput) fileInput.value = '';
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    setIsCompressing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1000, useWebWorker: true };
      const compressedFile = await imageCompression(croppedBlob, options);
      const finalFile = new File([compressedFile], "profile_pic.jpg", { type: "image/jpeg" });
      setImageFile(finalFile);
      setShowCropModal(false);
    } catch (e) { console.error(e); setError("Failed to crop and compress image."); setShowCropModal(false); } 
    finally { setIsCompressing(false); }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');
    
    if (currentStep === 3) {
      if (contacts.some(c => !c.name || !c.phone || (c.tag === 'Other' && !c.customTag))) {
        return setError("Please fill out all contact names, phone numbers, and custom tags before continuing.");
      }
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(c => c + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleUpdate();
    }
  };

  const handleUpdate = async () => {
    if (documents.some(d => !d.name.trim() || (!d.file && !d.url))) return setError("Please provide a name and upload a file for every document you added, or remove the empty ones.");

    setLoading(true);
    try {
      const processedDocs = [];
      for (const docItem of documents) {
        if (docItem.file) {
          const docUrl = await uploadToCloudinary(docItem.file);
          if (docItem.url) await deleteOldImage(docItem.url); 
          processedDocs.push({ id: docItem.id, name: docItem.name.trim(), url: docUrl });
        } else if (docItem.url) {
          processedDocs.push({ id: docItem.id, name: docItem.name.trim(), url: docItem.url });
        }
      }

      let imageUrl = currentImageUrl;
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
        await deleteOldImage(currentImageUrl); 
      }

      const formattedPincode = formData.pincode ? formData.pincode.replace(/\s+/g, '').toUpperCase() : '';

      await updateDoc(doc(db, "profiles", profileId), {
        ...formData, pincode: formattedPincode, type, imageUrl, contacts, primaryContactId, isActive, documents: processedDocs, updatedAt: new Date().toISOString()
      });
      navigate('/dashboard'); 
    } catch (err) { setError("Failed to update profile."); } 
    finally { setLoading(false); }
  };

  const getSafePreviewUrl = (url) => {
    if (!url) return '#';
    if (url.toLowerCase().includes('.pdf')) return url.replace(/\.pdf$/i, '.jpg');
    if (url.toLowerCase().includes('.doc') || url.toLowerCase().includes('.docx')) return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    return url;
  };

  const inputStyles = "w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 outline-none transition-all font-medium text-brandDark";
  const labelStyles = "block text-sm font-bold text-brandDark mb-2 ml-1";

  if (initialFetchLoading) return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-brandDark w-10 h-10" />
        <span className="font-bold text-zinc-500 tracking-wider uppercase text-sm">Loading details...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] p-4 md:p-8 py-12 relative overflow-hidden selection:bg-brandGold selection:text-white">
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-brandGold/20 via-emerald-400/10 to-transparent rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto w-full bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] p-6 md:p-10 border border-zinc-200/80 relative z-10">
        
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-brandDark tracking-tight mb-2">Update Identity</h1>
            <p className="text-zinc-500 font-medium">Modify details for this digital contact card.</p>
          </div>
          <button type="button" onClick={() => navigate('/dashboard')} className="p-2.5 bg-white text-zinc-400 hover:text-brandDark border border-zinc-200 hover:border-zinc-300 hover:shadow-sm rounded-full transition-all active:scale-95" title="Cancel & Go Back">
            <X size={20} />
          </button>
        </div>

        <div className="mb-10">
          <div className="flex justify-between items-center relative max-w-lg mx-auto">
            
            {/* --- FIXED PROGRESS LINE TRACK --- */}
            <div className="absolute left-4 right-4 top-1/2 h-1 -translate-y-1/2 -z-10">
              <div className="w-full h-full bg-zinc-200 rounded-full"></div>
              <div className="absolute top-0 left-0 h-full bg-brandDark rounded-full transition-all duration-500 ease-out" style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}></div>
            </div>
            {/* ------------------------------- */}

            {stepTitles.map((_, i) => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-500 ${i <= currentStep ? 'bg-brandDark border-brandDark text-white shadow-md scale-110' : 'bg-white border-zinc-300 text-zinc-400'}`}>
                {i < currentStep ? <Check size={14} strokeWidth={3} /> : i + 1}
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <h1 className="text-2xl font-extrabold text-brandDark tracking-tight mb-1">{stepTitles[currentStep]}</h1>
            <p className="text-sm font-medium text-zinc-500">Step {currentStep + 1} of {totalSteps}</p>
          </div>
        </div>

        {error && <div className="mb-8 p-4 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 text-sm animate-in fade-in">{error}</div>}

        <form onSubmit={handleNextStep} className="space-y-6">

            {currentStep === 0 && (
              <div className="animate-in slide-in-from-right-8 fade-in duration-500 space-y-6">
                
                <div className={`p-6 rounded-2xl border transition-all flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md ${isActive ? 'bg-emerald-50/80 border-emerald-200' : 'bg-red-50/80 border-red-200'}`} onClick={() => setIsActive(!isActive)}>
                  <div>
                    <h3 className={`font-extrabold text-lg tracking-tight mb-0.5 ${isActive ? 'text-emerald-700' : 'text-red-700'}`}>Profile Status: {isActive ? 'Active' : 'Disabled'}</h3>
                    <p className={`text-sm font-medium ${isActive ? 'text-emerald-600' : 'text-red-600'}`}>{isActive ? 'This profile is live and viewable when scanned.' : 'This profile is hidden. Scans will show a disabled message.'}</p>
                  </div>
                  <div className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`}>
                     <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelStyles}>Profile Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} className={inputStyles}>
                      <option value="kid">Kid / Family Member</option><option value="pet">Pet / Animal</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyles}>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className={inputStyles}>
                      <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelStyles}>Update Image (Leave blank to keep current)</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-zinc-50 p-2 pl-4 rounded-2xl border border-zinc-200">
                    <input id="image-upload-input" type="file" accept="image/*" onChange={handleImageSelect} className="w-full sm:flex-1 py-2 text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-brandDark file:text-white hover:file:bg-brandAccent transition-all cursor-pointer text-zinc-500 font-medium outline-none" />
                    {(imageFile || currentImageUrl) && (
                      <div className="w-16 h-16 rounded-[1rem] bg-zinc-200 overflow-hidden shrink-0 shadow-sm border border-zinc-300 ml-auto sm:ml-0 mr-2 sm:mr-2 mb-2 sm:mb-0">
                        <img src={imageFile ? URL.createObjectURL(imageFile) : currentImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className={labelStyles}>Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required className={inputStyles} placeholder="Full Name" /></div>
                  <div>
                    <label className={labelStyles}>Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required max={new Date().toISOString().split("T")[0]} className={inputStyles} />
                    {!formData.dob && <p className="text-[10px] text-amber-600 font-bold mt-1.5 uppercase tracking-wide ml-1">Please select DOB for automatic updates.</p>}
                  </div>
                  <div>
                    <label className={labelStyles}>Height</label>
                    <div className="flex space-x-2">
                      {formData.heightUnit === 'ft' ? (
                        <><input type="number" name="heightMain" placeholder="Ft" value={formData.heightMain} onChange={handleInputChange} required className={`${inputStyles} text-center`} /><input type="number" name="heightSub" placeholder="In" value={formData.heightSub} onChange={handleInputChange} required className={`${inputStyles} text-center`} /></>
                      ) : (
                        <input type="number" name="heightMain" placeholder="Cm" value={formData.heightMain} onChange={handleInputChange} required className={`${inputStyles} text-center`} />
                      )}
                      <select name="heightUnit" value={formData.heightUnit} onChange={handleInputChange} className="px-4 py-3 bg-zinc-100 rounded-xl outline-none font-bold border-transparent text-brandDark"><option value="ft">Ft/In</option><option value="cm">Cm</option></select>
                    </div>
                  </div>
                  <div>
                    <label className={labelStyles}>Weight</label>
                    <div className="flex space-x-2">
                      <input type="number" name="weightMain" placeholder={formData.weightUnit === 'kg' ? 'Kgs' : 'Lbs'} value={formData.weightMain} onChange={handleInputChange} required className={`${inputStyles} text-center`} />
                      <select name="weightUnit" value={formData.weightUnit} onChange={handleInputChange} className="px-4 py-3 bg-zinc-100 rounded-xl outline-none font-bold border-transparent text-brandDark"><option value="kg">Kgs</option><option value="lbs">Lbs</option></select>
                    </div>
                  </div>
                  {type === 'kid' && (
                    <div>
                      <label className={labelStyles}>Blood Group</label>
                      <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className={inputStyles}>
                        <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option>
                        <option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option><option value="Unknown">Unknown</option>
                      </select>
                    </div>
                  )}
                  <div><label className={labelStyles}>{type === 'kid' ? "Ethnicity" : "Breed"}</label><input type="text" name="typeSpecific" value={formData.typeSpecific} onChange={handleInputChange} required className={inputStyles} placeholder={type === 'kid' ? "e.g., Caucasian" : "e.g., Golden Retriever"} /></div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="animate-in slide-in-from-right-8 fade-in duration-500 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className={labelStyles}>Known Allergies / Medical Conditions</label>
                    <input type="text" name="allergies" placeholder="e.g., Peanuts, Penicillin (Leave 'None Known' if none)" value={formData.allergies} onChange={handleInputChange} required className={inputStyles} />
                  </div>
                  {type === 'kid' ? (
                    <>
                      <div><label className={labelStyles}>Nationality</label><input type="text" name="nationality" placeholder="e.g., American" value={formData.nationality} onChange={handleInputChange} className={inputStyles} /></div>
                      <div><label className={labelStyles}>Behavioral / Special Needs (Optional)</label><input type="text" name="specialNeeds" placeholder="e.g., Autism, Non-Verbal, ADHD" value={formData.specialNeeds} onChange={handleInputChange} className={inputStyles} /></div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className={labelStyles}>Temperament</label>
                        <select name="temperament" value={formData.temperament} onChange={handleInputChange} className={inputStyles}>
                          <option value="Friendly">Friendly</option><option value="Anxious">Anxious / Timid</option>
                          <option value="Needs Care">Needs Care / Special</option><option value="Do Not Pet">Aggressive / Do Not Pet</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelStyles}>Vaccination Status</label>
                        <select name="vaccinationStatus" value={formData.vaccinationStatus} onChange={handleInputChange} className={inputStyles}>
                          <option value="Up to Date">Up to Date</option><option value="Needs Update">Needs Update</option><option value="Unknown">Unknown</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStyles}>Microchip Number (Optional)</label>
                        <input type="text" name="microchip" placeholder="e.g., 98514100XXXXXXX" value={formData.microchip} onChange={handleInputChange} className={inputStyles} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="animate-in slide-in-from-right-8 fade-in duration-500 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className={labelStyles}>Local Police Station</label><input type="text" name="policeStation" placeholder="Nearest station name" value={formData.policeStation} onChange={handleInputChange} required className={inputStyles} /></div>
                  <div><label className={labelStyles}>Local Pincode / Zipcode</label><input type="text" name="pincode" placeholder="Zip / Postal / PIN Code" value={formData.pincode} onChange={handleInputChange} required className={inputStyles} /></div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-bold text-brandDark ml-1">Safe Address / Meeting Point</label>
                    <button type="button" onClick={fetchLocation} disabled={isFetchingLoc} className="text-xs bg-zinc-100 border border-zinc-200 text-brandDark font-bold px-3 py-2 rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-1.5 shadow-sm active:scale-95">
                      {isFetchingLoc ? <Loader2 size={14} className="animate-spin text-brandGold" /> : <MapPin size={14} className="text-brandGold" />} 
                      {isFetchingLoc ? 'Locating...' : 'Auto-Fill Address'}
                    </button>
                  </div>
                  <textarea name="address" placeholder="Tap 'Auto-Fill' or type manually..." value={formData.address} onChange={handleInputChange} required rows="3" className={`${inputStyles} resize-none`} />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="animate-in slide-in-from-right-8 fade-in duration-500 space-y-6">
                <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                  <p className="text-sm text-zinc-600 font-medium leading-relaxed">Add trusted people a finder can call in an emergency. The primary contact will be highlighted.</p>
                  <button type="button" onClick={addContact} className="flex items-center space-x-1 text-sm bg-brandDark text-white shadow-md font-bold px-4 py-2.5 rounded-xl hover:bg-brandAccent transition-all shrink-0 active:scale-95 ml-4">
                    <Plus size={16} /> <span className="hidden sm:inline">Add Contact</span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {contacts.map((contact, index) => (
                    <div key={contact.id} className="p-5 md:p-6 border border-zinc-200 rounded-2xl bg-white relative group transition-all shadow-sm">
                      {contacts.length > 1 && (
                        <button type="button" onClick={() => removeContact(contact.id)} className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 bg-zinc-50 border border-zinc-200 shadow-sm p-1.5 rounded-full transition-all active:scale-95">
                          <X size={14} />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pr-6 md:pr-0">
                        <input type="text" placeholder="Full Name" value={contact.name} onChange={(e) => handleContactChange(contact.id, 'name', e.target.value)} required className={inputStyles} />
                        <div className="flex w-full border border-zinc-200 rounded-xl focus-within:border-brandDark focus-within:ring-2 focus-within:ring-brandDark/10 bg-zinc-50 overflow-hidden transition-all relative">
                          <div className="relative flex items-center bg-white hover:bg-zinc-100 border-r border-zinc-200 px-3 cursor-pointer shrink-0 transition-colors">
                            <img src={`https://flagcdn.com/w20/${contact.countryIso || 'us'}.png`} alt="flag" className="w-5 h-auto rounded-sm shrink-0 shadow-[0_0_2px_rgba(0,0,0,0.2)]" />
                            <span className="ml-2 text-sm font-bold text-brandDark">{contact.countryCode || '+1'}</span>
                            <select value={`${contact.countryCode || '+1'}|${contact.countryIso || 'us'}`} onChange={(e) => { const [code, iso] = e.target.value.split('|'); setContacts(prevContacts => prevContacts.map(c => c.id === contact.id ? { ...c, countryCode: code, countryIso: iso } : c)); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                              {sortedCountryCodes.map((c, i) => <option key={`${c.iso}-${i}`} value={`${c.code}|${c.iso}`}>{c.country} ({c.code})</option>)}
                            </select>
                          </div>
                          <input type="tel" placeholder="Phone Number" value={contact.phone} onChange={(e) => handleContactChange(contact.id, 'phone', e.target.value)} required className="flex-1 p-4 outline-none w-full bg-transparent font-medium text-brandDark" />
                        </div>
                        <select value={contact.tag} onChange={(e) => handleContactChange(contact.id, 'tag', e.target.value)} className={inputStyles}>
                          <option value="Father">Father</option><option value="Mother">Mother</option><option value="Brother">Brother</option><option value="Sister">Sister</option>
                          <option value="Uncle">Uncle</option><option value="Aunt">Aunt</option><option value="Grandma - Father's Side">Grandma - Father's Side</option>
                          <option value="Grandma - Mother's Side">Grandma - Mother's Side</option><option value="Grandpa - Father's Side">Grandpa - Father's Side</option>
                          <option value="Grandpa - Mother's Side">Grandpa - Mother's Side</option><option value="Other">Other (Custom)</option>
                        </select>
                        {contact.tag === 'Other' && <input type="text" placeholder="Specify Custom Tag" value={contact.customTag} onChange={(e) => handleContactChange(contact.id, 'customTag', e.target.value)} required className={inputStyles} />}
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <label className={labelStyles}>Primary Emergency Contact</label>
                  <select value={primaryContactId} onChange={(e) => setPrimaryContactId(e.target.value)} className={inputStyles}>
                    {contacts.map((contact, index) => <option key={contact.id} value={contact.id}>{contact.name || `Contact ${index + 1}`} ({contact.tag === 'Other' ? contact.customTag || 'Custom' : contact.tag})</option>)}
                  </select>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="animate-in slide-in-from-right-8 fade-in duration-500 space-y-6">
                
                <div className="bg-brandGold/10 p-5 rounded-2xl border border-brandGold/20 flex gap-4">
                  <Info size={24} className="text-brandGold shrink-0 mt-0.5" />
                  <div>
                     <h3 className="text-brandDark font-extrabold text-lg mb-1">Document Vault</h3>
                     <p className="text-sm text-brandDark font-medium leading-relaxed">Add medical IDs, vaccination certs, or important documents. These stay <strong className="font-extrabold">locked</strong> on the public profile until a finder verifies their exact GPS location to unlock the vault.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-5 md:p-6 border border-zinc-200 rounded-2xl bg-zinc-50 relative group transition-all shadow-sm">
                      <button type="button" onClick={() => removeDocument(doc.id)} className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 bg-white border border-zinc-200 shadow-sm p-1.5 rounded-full transition-all active:scale-95"><X size={14} /></button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pr-6 md:pr-0">
                        <input type="text" placeholder="Document Name (e.g., Aadhar Card)" value={doc.name} onChange={(e) => handleDocumentChange(doc.id, 'name', e.target.value)} required className={inputStyles} />
                        <div className="relative flex items-center">
                          {doc.url && !doc.isEditingFile ? (
                            <div className="flex items-center justify-between w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                              <a href={getSafePreviewUrl(doc.url)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold text-emerald-700 hover:underline truncate mr-2"><CheckCircle2 size={16} className="shrink-0" /> <span className="truncate">View Uploaded</span></a>
                              <button type="button" onClick={() => handleDocumentChange(doc.id, 'isEditingFile', true)} className="shrink-0 text-xs bg-white border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100 transition-colors">Replace</button>
                            </div>
                          ) : (
                            <div className="w-full flex items-center gap-2">
                              <input type="file" accept="image/*,application/pdf,.doc,.docx" onChange={(e) => handleDocumentChange(doc.id, 'file', e.target.files[0])} required={!doc.url} className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-zinc-100 file:text-brandDark hover:file:bg-zinc-200 transition-all cursor-pointer text-zinc-600 font-medium shadow-sm" />
                              {doc.url && <button type="button" onClick={() => { handleDocumentChange(doc.id, 'isEditingFile', false); handleDocumentChange(doc.id, 'file', null); }} className="shrink-0 p-2.5 bg-zinc-200 text-zinc-600 hover:text-brandDark rounded-xl transition-colors"><X size={18} /></button>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addDocument} className="w-full py-4 border-2 border-dashed border-zinc-300 rounded-2xl text-zinc-500 font-bold hover:border-brandDark hover:text-brandDark transition-colors flex items-center justify-center gap-2 bg-zinc-50/50 hover:bg-zinc-50">
                    <Plus size={18} /> Add Private Document
                  </button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm mt-6">
                  <label className="block text-sm font-bold text-brandDark mb-4">Physical Tag Aesthetic (QR Style)</label>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(QR_STYLES).map(([key, style]) => (
                      <button key={key} type="button" onClick={() => setFormData(prev => ({ ...prev, qrStyle: key }))} className={`w-14 h-14 rounded-[1rem] border-2 flex items-center justify-center transition-all ${formData.qrStyle === key ? 'border-brandDark scale-110 shadow-md ring-2 ring-brandDark/10' : 'border-transparent hover:scale-105 shadow-sm hover:shadow-md'}`} style={{ backgroundColor: style.bg }} title={style.name}>
                        <div className="w-6 h-6 rounded-md flex items-center justify-center shadow-sm" style={{ backgroundColor: style.fg }}>
                          {formData.qrStyle === key && <Check size={14} strokeWidth={4} className="text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-4 pt-8 mt-8 border-t border-zinc-200/80">
              {currentStep === 0 ? (
                <button type="button" onClick={() => navigate('/dashboard')} className="w-full sm:w-1/3 bg-white border border-zinc-200 text-brandDark p-4 rounded-xl font-bold hover:bg-zinc-50 transition-colors text-center shadow-sm active:scale-95">Cancel</button>
              ) : (
                <button type="button" onClick={() => setCurrentStep(c => c - 1)} className="w-full sm:w-1/3 bg-white border border-zinc-200 text-brandDark p-4 rounded-xl font-bold hover:bg-zinc-50 transition-colors text-center shadow-sm active:scale-95 flex items-center justify-center gap-2">
                  <ChevronLeft size={20} /> Back
                </button>
              )}
              
              <button type="submit" disabled={loading} className={`w-full sm:w-2/3 text-white p-4 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${loading ? 'bg-zinc-400 cursor-not-allowed' : 'bg-brandDark hover:bg-brandAccent hover:-translate-y-0.5'}`}>
                {loading ? <Loader2 size={20} className="animate-spin" /> : currentStep === totalSteps - 1 ? <ShieldCheck size={20} /> : ''}
                {loading ? 'Updating Profile...' : currentStep === totalSteps - 1 ? 'Save Changes' : <span className="flex items-center gap-2">Continue <ChevronRight size={20} /></span>}
              </button>
            </div>
        </form>
      </div>

      {showCropModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-brandDark tracking-tight">Crop Photo</h3>
              <button onClick={handleCancelCrop} className="p-2 bg-zinc-50 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"><X size={20}/></button>
            </div>
            <div className="relative w-full h-[400px] bg-zinc-900">
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} cropShape="rect" showGrid={false} />
            </div>
            <div className="p-6">
              <input type="range" value={zoom} min={1} max={3} step={0.1} aria-labelledby="Zoom" onChange={(e) => setZoom(e.target.value)} className="w-full mb-6 accent-brandDark" />
              <button onClick={handleCropSave} disabled={isCompressing} className="w-full bg-brandDark text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-brandAccent active:scale-95 transition-all flex items-center justify-center gap-2">
                 {isCompressing ? <><Loader2 size={20} className="animate-spin" /> Compressing...</> : 'Apply & Compress'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
