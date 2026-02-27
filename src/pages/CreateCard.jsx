import { useState } from 'react';
import { db, auth } from '../firebase'; 
import { collection, addDoc } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, X, MapPin, Loader2, Check } from 'lucide-react';

const QR_STYLES = {
  obsidian: { name: 'Classic Obsidian', fg: '#18181b', bg: '#ffffff', border: 'border-zinc-200', hexBorder: '#e4e4e7' },
  bubblegum: { name: 'Bubblegum Pink', fg: '#db2777', bg: '#fdf2f8', border: 'border-pink-200', hexBorder: '#fbcfe8' },
  ocean: { name: 'Ocean Blue', fg: '#0284c7', bg: '#f0f9ff', border: 'border-sky-200', hexBorder: '#bae6fd' },
  minty: { name: 'Minty Green', fg: '#0d9488', bg: '#f0fdfa', border: 'border-teal-200', hexBorder: '#99f6e4' },
  lavender: { name: 'Lavender Violet', fg: '#7c3aed', bg: '#f5f3ff', border: 'border-violet-200', hexBorder: '#ddd6fe' },
  sunshine: { name: 'Sunshine Orange', fg: '#d97706', bg: '#fffbeb', border: 'border-amber-200', hexBorder: '#fde68a' },
};

export default function CreateCard() {
  const navigate = useNavigate();
  const [type, setType] = useState('kid');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFetchingLoc, setIsFetchingLoc] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [error, setError] = useState('');

  const [contacts, setContacts] = useState([
    { id: Date.now().toString(), name: '', phone: '', tag: 'Father', customTag: '' }
  ]);
  const [primaryContactId, setPrimaryContactId] = useState(contacts[0].id);

  const [formData, setFormData] = useState({
    // 🌟 NEW: Added ageUnit to default state
    name: '', age: 5, ageUnit: 'Years', gender: 'Male', 
    heightUnit: 'ft', heightMain: '', heightSub: '', 
    weightUnit: 'kg', weightMain: '', 
    bloodGroup: 'A+', typeSpecific: '', nationality: '', 
    allergies: 'None Known', policeStation: '', pincode: '', address: '',
    qrStyle: 'obsidian',
    microchip: '', vaccinationStatus: 'Up to Date', temperament: 'Friendly', specialNeeds: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (id, field, value) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addContact = () => {
    setContacts([...contacts, { id: Date.now().toString(), name: '', phone: '', tag: 'Other', customTag: '' }]);
  };

  const removeContact = (id) => {
    if (contacts.length === 1) return; 
    const updatedContacts = contacts.filter(c => c.id !== id);
    setContacts(updatedContacts);
    if (primaryContactId === id) setPrimaryContactId(updatedContacts[0].id);
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setIsFetchingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
          const data = await res.json();
          setFormData(prev => ({ 
            ...prev, 
            address: data.display_name,
            pincode: data.address?.postcode || prev.pincode
          }));
        } catch (err) {
          setError("Failed to fetch address details automatically.");
        } finally {
          setIsFetchingLoc(false);
        }
      },
      () => {
        setError("Location access denied. Please type address manually.");
        setIsFetchingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; 
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; 
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', uploadPreset);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: uploadData });
      const data = await response.json();
      return data.secure_url; 
    } catch (err) {
      throw new Error("Image upload failed");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!auth.currentUser) return setError("You must be logged in.");
    
    if (contacts.some(c => !c.name || !c.phone || (c.tag === 'Other' && !c.customTag))) {
      return setError("Please fill out all contact names, phone numbers, and custom tags.");
    }

    setLoading(true);

    try {
      let imageUrl = imageFile ? await uploadToCloudinary(imageFile) : 'https://placehold.co/600x400/eeeeee/999999?text=No+Photo+Provided';
      const docRef = await addDoc(collection(db, "profiles"), {
        ...formData, type, imageUrl, contacts, primaryContactId, userId: auth.currentUser.uid, createdAt: new Date().toISOString()
      });
      setGeneratedUrl(`${window.location.origin}/#/id/${docRef.id}`);
    } catch (err) {
      setError("Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById("qr-canvas-create");
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${formData.name}_KinTag_QR.png`;
    downloadLink.click();
  };

  const inputStyles = "w-full p-3.5 bg-brandMuted border-transparent rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all font-medium";
  const labelStyles = "block text-sm font-bold text-brandDark mb-1.5";
  
  const activeStyle = QR_STYLES[formData.qrStyle];

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8 relative">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-premium border border-zinc-100 p-6 md:p-10 relative">
        
        {!generatedUrl && (
          <button type="button" onClick={() => navigate('/')} className="absolute top-6 right-6 p-2 bg-brandMuted text-zinc-400 hover:text-brandDark hover:bg-zinc-200 rounded-full transition-colors" title="Cancel & Go Back">
            <X size={20} />
          </button>
        )}

        <h1 className="text-3xl font-extrabold text-brandDark mb-2 tracking-tight">Create Identity</h1>
        <p className="text-zinc-500 font-medium mb-10">Register a new digital contact card.</p>
        
        {error && <div className="mb-8 p-4 bg-red-50 text-red-600 font-medium rounded-xl border border-red-100">{error}</div>}

        {!generatedUrl ? (
          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelStyles}>Profile Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className={inputStyles}>
                  <option value="kid">Kid</option>
                  <option value="pet">Pet</option>
                </select>
              </div>
              <div>
                <label className={labelStyles}>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className={inputStyles}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelStyles}>Hero Image (Optional)</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="w-full p-2.5 bg-brandMuted rounded-xl text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-brandDark file:text-white hover:file:bg-brandAccent transition-all cursor-pointer text-zinc-600 font-medium" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className={labelStyles}>Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required className={inputStyles} /></div>
              
              {/* 🌟 NEW: Age UI with Unit Toggle for Pets */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-bold text-brandDark">Age</label>
                  <div className="flex items-center space-x-2">
                    {type === 'pet' && (
                      <select 
                        name="ageUnit" 
                        value={formData.ageUnit || 'Years'} 
                        onChange={(e) => {
                          const newUnit = e.target.value;
                          let newAge = formData.age;
                          if (newUnit === 'Months' && newAge > 12) newAge = 12;
                          setFormData(prev => ({ ...prev, ageUnit: newUnit, age: newAge }));
                        }} 
                        className="p-1 text-xs bg-brandMuted border border-zinc-200 rounded-md font-bold text-brandDark outline-none cursor-pointer"
                      >
                        <option value="Years">Years</option>
                        <option value="Months">Months</option>
                      </select>
                    )}
                    <span className="text-brandGold font-extrabold">
                      {formData.age} {type === 'pet' && formData.ageUnit === 'Months' ? (formData.age == 1 ? 'Month' : 'Months') : (formData.age == 1 ? 'Year' : 'Years')}
                    </span>
                  </div>
                </div>
                <input 
                  type="range" 
                  name="age" 
                  min="1" 
                  max={type === 'pet' && formData.ageUnit === 'Months' ? "12" : "50"} 
                  value={formData.age} 
                  onChange={handleInputChange} 
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brandDark mt-3" 
                />
              </div>

              <div>
                <label className={labelStyles}>Height</label>
                <div className="flex space-x-2">
                  {formData.heightUnit === 'ft' ? (
                    <>
                      <input type="number" name="heightMain" placeholder="Ft" value={formData.heightMain} onChange={handleInputChange} required className={inputStyles} />
                      <input type="number" name="heightSub" placeholder="In" value={formData.heightSub} onChange={handleInputChange} required className={inputStyles} />
                    </>
                  ) : (
                    <input type="number" name="heightMain" placeholder="Cm" value={formData.heightMain} onChange={handleInputChange} required className={inputStyles} />
                  )}
                  <select name="heightUnit" value={formData.heightUnit} onChange={handleInputChange} className="p-3 bg-brandMuted rounded-xl outline-none focus:ring-2 focus:ring-brandDark/20 font-bold border-transparent">
                    <option value="ft">Ft/In</option>
                    <option value="cm">Cm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelStyles}>Weight</label>
                <div className="flex space-x-2">
                  <input type="number" name="weightMain" placeholder={formData.weightUnit === 'kg' ? 'Kgs' : 'Lbs'} value={formData.weightMain} onChange={handleInputChange} required className={inputStyles} />
                  <select name="weightUnit" value={formData.weightUnit} onChange={handleInputChange} className="p-3 bg-brandMuted rounded-xl outline-none focus:ring-2 focus:ring-brandDark/20 font-bold border-transparent">
                    <option value="kg">Kgs</option>
                    <option value="lbs">Lbs</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC: Hide Blood Group for Pets */}
              {type === 'kid' && (
                <div>
                  <label className={labelStyles}>Blood Group</label>
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className={inputStyles}>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              )}
              
              <div><label className={labelStyles}>{type === 'kid' ? "Ethnicity" : "Breed"}</label><input type="text" name="typeSpecific" value={formData.typeSpecific} onChange={handleInputChange} required className={inputStyles} /></div>
              
            </div>

            <hr className="border-zinc-200" />
            <h3 className="text-xl font-extrabold text-brandDark tracking-tight mb-2">Health & Specifics</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                      <option value="Friendly">Friendly</option>
                      <option value="Anxious">Anxious / Timid</option>
                      <option value="Needs Care">Needs Care / Special</option>
                      <option value="Do Not Pet">Aggressive / Do Not Pet</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyles}>Vaccination Status</label>
                    <select name="vaccinationStatus" value={formData.vaccinationStatus} onChange={handleInputChange} className={inputStyles}>
                      <option value="Up to Date">Up to Date</option>
                      <option value="Needs Update">Needs Update</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelStyles}>Microchip Number (Optional)</label>
                    <input type="text" name="microchip" placeholder="e.g., 98514100XXXXXXX" value={formData.microchip} onChange={handleInputChange} className={inputStyles} />
                  </div>
                </>
              )}
            </div>

            <hr className="border-zinc-200" />

            <h3 className="text-xl font-extrabold text-brandDark tracking-tight mb-2">Location Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div><label className={labelStyles}>Local Police Station</label><input type="text" name="policeStation" placeholder="Nearest station name" value={formData.policeStation} onChange={handleInputChange} required className={inputStyles} /></div>
              <div><label className={labelStyles}>Local Pincode / Zipcode</label><input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} required className={inputStyles} /></div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-1.5">
                <label className="block text-sm font-bold text-brandDark">Safe Address / Meeting Point</label>
                <button type="button" onClick={fetchLocation} disabled={isFetchingLoc} className="text-xs bg-brandDark text-white font-bold px-3 py-1.5 rounded-lg hover:bg-brandAccent transition-colors flex items-center gap-1.5 shadow-sm">
                  {isFetchingLoc ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14}/>} 
                  {isFetchingLoc ? 'Locating...' : 'Auto-Fill Address'}
                </button>
              </div>
              <textarea name="address" placeholder="Tap 'Auto-Fill' or type manually..." value={formData.address} onChange={handleInputChange} required rows="3" className={`${inputStyles} resize-none`} />
            </div>

            <hr className="border-zinc-200" />
            
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-brandDark tracking-tight">Authorized Guardians</h3>
              <button type="button" onClick={addContact} className="flex items-center space-x-1 text-sm bg-brandMuted text-brandDark font-bold px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors">
                <Plus size={16} /> <span>Add</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div key={contact.id} className="p-5 border border-zinc-200 rounded-2xl bg-zinc-50 relative group transition-all">
                  {contacts.length > 1 && (
                    <button type="button" onClick={() => removeContact(contact.id)} className="absolute top-3 right-3 text-zinc-400 hover:text-red-500 bg-white shadow-sm p-1.5 rounded-full transition-all">
                      <X size={14} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <input type="text" placeholder="Full Name" value={contact.name} onChange={(e) => handleContactChange(contact.id, 'name', e.target.value)} required className="w-full p-3 border border-zinc-200 rounded-xl outline-none focus:border-brandDark focus:ring-1 focus:ring-brandDark" />
                    <input type="tel" placeholder="Phone Number" value={contact.phone} onChange={(e) => handleContactChange(contact.id, 'phone', e.target.value)} required className="w-full p-3 border border-zinc-200 rounded-xl outline-none focus:border-brandDark focus:ring-1 focus:ring-brandDark" />
                    <select value={contact.tag} onChange={(e) => handleContactChange(contact.id, 'tag', e.target.value)} className="w-full p-3 border border-zinc-200 rounded-xl bg-white outline-none focus:border-brandDark focus:ring-1 focus:ring-brandDark font-medium">
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Uncle">Uncle</option>
                      <option value="Aunt">Aunt</option>
                      <option value="Grandma - Father's Side">Grandma - Father's Side</option>
                      <option value="Grandma - Mother's Side">Grandma - Mother's Side</option>
                      <option value="Grandpa - Father's Side">Grandpa - Father's Side</option>
                      <option value="Grandpa - Mother's Side">Grandpa - Mother's Side</option>
                      <option value="Other">Other (Custom)</option>
                    </select>
                    {contact.tag === 'Other' && (
                      <input type="text" placeholder="Specify Tag" value={contact.customTag} onChange={(e) => handleContactChange(contact.id, 'customTag', e.target.value)} required className="w-full p-3 border border-zinc-200 rounded-xl outline-none focus:border-brandDark focus:ring-1 focus:ring-brandDark" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className={labelStyles}>Primary Emergency Contact</label>
              <select value={primaryContactId} onChange={(e) => setPrimaryContactId(e.target.value)} className={inputStyles}>
                {contacts.map((contact, index) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name || `Contact ${index + 1}`} ({contact.tag === 'Other' ? contact.customTag || 'Custom' : contact.tag})
                  </option>
                ))}
              </select>
            </div>

            <hr className="border-zinc-200" />

            <div className="bg-brandMuted p-5 rounded-2xl border border-zinc-200/60">
              <label className="block text-sm font-bold text-brandDark mb-3">QR Code Visual Style</label>
              <div className="flex flex-wrap gap-3">
                {Object.entries(QR_STYLES).map(([key, style]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, qrStyle: key }))}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${formData.qrStyle === key ? 'border-brandDark scale-110 shadow-md' : 'border-transparent hover:scale-105 shadow-sm'}`}
                    style={{ backgroundColor: style.bg }}
                    title={style.name}
                  >
                    <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: style.fg }}>
                      {formData.qrStyle === key && <Check size={12} strokeWidth={4} className="text-white" />}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-3 font-medium">Select a cute theme for your physical printed tag.</p>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => navigate('/')} className="w-1/3 bg-brandMuted text-brandDark p-4 rounded-xl font-bold hover:bg-zinc-200 transition-colors text-center">Cancel</button>
              <button type="submit" disabled={loading} className={`w-2/3 text-white p-4 rounded-xl font-bold text-lg transition-all shadow-md ${loading ? 'bg-zinc-400' : 'bg-brandDark hover:bg-brandAccent'}`}>
                {loading ? 'Securing Identity...' : 'Save & Generate ID'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center space-y-6 py-8">
            <h2 className="text-3xl font-extrabold text-brandDark tracking-tight">Identity Secured</h2>
            <p className="text-zinc-500 font-medium">Your new digital contact card is live.</p>
            
            <div className="flex justify-center">
              <div className={`bg-white p-6 rounded-3xl shadow-premium border ${activeStyle.border} inline-block`}>
                <QRCodeCanvas 
                  id="qr-canvas-create" 
                  value={generatedUrl} 
                  size={220} 
                  level="H" 
                  includeMargin={true} 
                  fgColor={activeStyle.fg} 
                  bgColor={activeStyle.bg} 
                  imageSettings={{
                    src: "/kintag-logo.png",
                    height: 45,
                    width: 45,
                    excavate: true,
                  }}
                />
              </div>
            </div>

            <div className="space-y-3 pt-6 max-w-sm mx-auto">
              <button onClick={downloadQR} className="w-full flex items-center justify-center space-x-2 bg-brandGold text-white p-4 rounded-xl font-bold shadow-md hover:bg-amber-500 transition-all">
                <Download size={18} />
                <span>Download QR Code</span>
              </button>
              
              <a href={generatedUrl} target="_blank" rel="noreferrer" className="block w-full bg-brandDark text-white p-4 rounded-xl font-bold shadow-md hover:bg-brandAccent transition-all">
                View Live Card
              </a>
              
              <button onClick={() => navigate('/')} className="block w-full bg-brandMuted text-brandDark p-4 rounded-xl font-bold hover:bg-zinc-200 transition-all">
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
