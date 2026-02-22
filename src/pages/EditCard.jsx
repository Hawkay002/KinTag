import { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X } from 'lucide-react';

export default function EditCard() {
  const navigate = useNavigate();
  const { profileId } = useParams();
  
  const [type, setType] = useState('kid');
  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(true);
  const [error, setError] = useState('');

  const [contacts, setContacts] = useState([]);
  const [primaryContactId, setPrimaryContactId] = useState('');

  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', height: '', weight: '', bloodGroup: '', typeSpecific: '', address: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "profiles", profileId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().userId === auth.currentUser.uid) {
          const data = docSnap.data();
          setType(data.type);
          setCurrentImageUrl(data.imageUrl);
          setFormData({
            name: data.name || '', age: data.age || '', gender: data.gender || 'Male',
            height: data.height || '', weight: data.weight || '', bloodGroup: data.bloodGroup || '', 
            typeSpecific: data.typeSpecific || '', address: data.address || ''
          });

          if (data.contacts && data.contacts.length > 0) {
            setContacts(data.contacts);
            setPrimaryContactId(data.primaryContactId || data.contacts[0].id);
          } else {
            let legacyContacts = [];
            let p1Id = Date.now().toString();
            legacyContacts.push({ id: p1Id, name: data.parent1Name || '', phone: data.parent1Phone || '', tag: 'Mother', customTag: '' });
            if (data.parent2Name) {
              legacyContacts.push({ id: (Date.now() + 1).toString(), name: data.parent2Name, phone: data.parent2Phone || '', tag: 'Father', customTag: '' });
            }
            setContacts(legacyContacts);
            setPrimaryContactId(p1Id);
          }
        } else {
          setError("Profile not found or unauthorized.");
        }
      } catch (err) {
        setError("Failed to load profile details.");
      } finally {
        setInitialFetchLoading(false);
      }
    };
    fetchProfile();
  }, [profileId]);

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

  const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; 
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; 
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', uploadPreset);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: uploadData });
    const data = await response.json();
    return data.secure_url; 
  };

  const extractPublicId = (url) => {
    if (!url || url.includes('placehold.co')) return null;
    const regex = /\/v\d+\/([^\.]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const deleteOldImage = async (url) => {
    const publicId = extractPublicId(url);
    if (!publicId) return;
    try {
      await fetch('/api/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      });
    } catch (err) {
      console.error("Failed to delete old image backend hook", err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    
    if (contacts.some(c => !c.name || !c.phone || (c.tag === 'Other' && !c.customTag))) {
      return setError("Please fill out all contact names, phone numbers, and custom tags.");
    }

    setLoading(true);

    try {
      let imageUrl = currentImageUrl;
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
        await deleteOldImage(currentImageUrl); 
      }

      await updateDoc(doc(db, "profiles", profileId), {
        ...formData, type, imageUrl, contacts, primaryContactId, updatedAt: new Date().toISOString()
      });
      navigate('/'); 
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = "w-full p-3.5 bg-brandMuted border-transparent rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/20 outline-none transition-all font-medium";
  const labelStyles = "block text-sm font-bold text-brandDark mb-1.5";

  if (initialFetchLoading) return <div className="text-center p-10 font-bold text-zinc-500">Loading details...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-premium border border-zinc-100 p-6 md:p-10">
        <h1 className="text-3xl font-extrabold text-brandDark mb-2 tracking-tight">Update Identity</h1>
        <p className="text-zinc-500 font-medium mb-10">Modify details for this digital contact card.</p>
        
        {error && <div className="mb-8 p-4 bg-red-50 text-red-600 font-medium rounded-xl border border-red-100">{error}</div>}

        <form onSubmit={handleUpdate} className="space-y-8">
            <div className="grid grid-cols-2 gap-5">
              <div><label className={labelStyles}>Profile Type</label><select value={type} onChange={(e) => setType(e.target.value)} className={inputStyles}><option value="kid">Kid</option><option value="pet">Pet</option></select></div>
              <div><label className={labelStyles}>Gender</label><select name="gender" value={formData.gender} onChange={handleInputChange} className={inputStyles}><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
            </div>

            <div>
              <label className={labelStyles}>Update Image (Leave blank to keep current)</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="w-full p-2.5 bg-brandMuted rounded-xl text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-brandDark file:text-white hover:file:bg-brandAccent transition-all cursor-pointer text-zinc-600 font-medium" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className={labelStyles}>Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required className={inputStyles} /></div>
              <div><label className={labelStyles}>Age</label><input type="text" name="age" value={formData.age} onChange={handleInputChange} required className={inputStyles} /></div>
              <div><label className={labelStyles}>Height</label><input type="text" name="height" value={formData.height} onChange={handleInputChange} required className={inputStyles} /></div>
              <div><label className={labelStyles}>Weight</label><input type="text" name="weight" value={formData.weight} onChange={handleInputChange} required className={inputStyles} /></div>
              <div><label className={labelStyles}>Blood Group</label><input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} required className={inputStyles} /></div>
              <div><label className={labelStyles}>{type === 'kid' ? "Ethnicity" : "Breed"}</label><input type="text" name="typeSpecific" value={formData.typeSpecific} onChange={handleInputChange} required className={inputStyles} /></div>
            </div>

            <hr className="border-zinc-200" />
            
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-brandDark tracking-tight">Guardians</h3>
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
                      <option value="Mother">Mother</option><option value="Father">Father</option><option value="Uncle">Uncle</option>
                      <option value="Aunt">Aunt</option><option value="Brother">Brother</option><option value="Sister">Sister</option><option value="Other">Other (Custom)</option>
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

            <div>
              <label className={labelStyles}>Safe Address / Meeting Point</label>
              <textarea name="address" value={formData.address} onChange={handleInputChange} required rows="3" className={`${inputStyles} resize-none`} />
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => navigate('/')} className="w-1/3 bg-brandMuted text-brandDark p-4 rounded-xl font-bold hover:bg-zinc-200 transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className={`w-2/3 text-white p-4 rounded-xl font-bold transition-all shadow-md ${loading ? 'bg-zinc-400' : 'bg-brandDark hover:bg-brandAccent'}`}>
                {loading ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}
