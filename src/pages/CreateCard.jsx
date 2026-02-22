import { useState } from 'react';
import { db, auth } from '../firebase'; 
import { collection, addDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

export default function CreateCard() {
  const navigate = useNavigate();
  const [type, setType] = useState('kid');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [error, setError] = useState('');

  const [contacts, setContacts] = useState([
    { id: Date.now().toString(), name: '', phone: '', tag: 'Mother', customTag: '' }
  ]);
  const [primaryContactId, setPrimaryContactId] = useState(contacts[0].id);

  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', height: '', weight: '', bloodGroup: '', typeSpecific: '', address: ''
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

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Create ID Card</h1>
        <p className="text-gray-500 mb-8">Fill in the details below to generate a secure digital contact card.</p>
        
        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

        {!generatedUrl ? (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Profile Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 outline-none">
                  <option value="kid">Kid</option>
                  <option value="pet">Pet</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-3 border rounded-xl bg-gray-50 outline-none">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Hero Image (Optional)</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="w-full p-2 border rounded-xl bg-gray-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:bg-safetyBlue file:text-white" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><label className="block text-sm font-semibold text-gray-700">Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full p-3 border rounded-xl outline-none" /></div>
              <div className="space-y-2"><label className="block text-sm font-semibold text-gray-700">Age</label><input type="text" name="age" value={formData.age} onChange={handleInputChange} required className="w-full p-3 border rounded-xl outline-none" /></div>
              <div className="space-y-2"><label className="block text-sm font-semibold text-gray-700">Height</label><input type="text" name="height" placeholder="e.g., 4'2" value={formData.height} onChange={handleInputChange} required className="w-full p-3 border rounded-xl outline-none" /></div>
              <div className="space-y-2"><label className="block text-sm font-semibold text-gray-700">Weight</label><input type="text" name="weight" placeholder="e.g., 60 lbs" value={formData.weight} onChange={handleInputChange} required className="w-full p-3 border rounded-xl outline-none" /></div>
              <div className="space-y-2"><label className="block text-sm font-semibold text-gray-700">Blood Group</label><input type="text" name="bloodGroup" placeholder="e.g., O+" value={formData.bloodGroup} onChange={handleInputChange} required className="w-full p-3 border rounded-xl outline-none" /></div>
              <div className="space-y-2"><label className="block text-sm font-semibold text-gray-700">{type === 'kid' ? "Ethnicity" : "Breed"}</label><input type="text" name="typeSpecific" value={formData.typeSpecific} onChange={handleInputChange} required className="w-full p-3 border rounded-xl outline-none" /></div>
            </div>

            <hr className="border-gray-200" />
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Guardian Contacts</h3>
              <button type="button" onClick={addContact} className="text-sm bg-blue-50 text-safetyBlue font-bold px-3 py-1.5 rounded-lg hover:bg-blue-100">+ Add Contact</button>
            </div>
            
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div key={contact.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative">
                  {contacts.length > 1 && (
                    <button type="button" onClick={() => removeContact(contact.id)} className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded-md text-xs font-bold">Remove</button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <input type="text" placeholder="Full Name" value={contact.name} onChange={(e) => handleContactChange(contact.id, 'name', e.target.value)} required className="w-full p-2.5 border rounded-lg outline-none" />
                    <input type="tel" placeholder="Phone Number" value={contact.phone} onChange={(e) => handleContactChange(contact.id, 'phone', e.target.value)} required className="w-full p-2.5 border rounded-lg outline-none" />
                    <select value={contact.tag} onChange={(e) => handleContactChange(contact.id, 'tag', e.target.value)} className="w-full p-2.5 border rounded-lg bg-white outline-none">
                      <option value="Mother">Mother</option><option value="Father">Father</option><option value="Uncle">Uncle</option>
                      <option value="Aunt">Aunt</option><option value="Brother">Brother</option><option value="Sister">Sister</option><option value="Other">Other (Custom)</option>
                    </select>
                    {contact.tag === 'Other' && (
                      <input type="text" placeholder="Specify Tag" value={contact.customTag} onChange={(e) => handleContactChange(contact.id, 'customTag', e.target.value)} required className="w-full p-2.5 border rounded-lg outline-none" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Primary Emergency Contact</label>
              <select value={primaryContactId} onChange={(e) => setPrimaryContactId(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 outline-none">
                {contacts.map((contact, index) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name || `Contact ${index + 1}`} ({contact.tag === 'Other' ? contact.customTag || 'Custom' : contact.tag})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Parents House / Safe Address</label>
              <textarea name="address" value={formData.address} onChange={handleInputChange} required rows="3" className="w-full p-3 border rounded-xl outline-none resize-none" />
            </div>

            <button type="submit" disabled={loading} className={`w-full text-white p-4 rounded-xl font-bold text-lg ${loading ? 'bg-blue-400' : 'bg-safetyBlue hover:bg-blue-600 shadow-md'}`}>
              {loading ? 'Saving Profile...' : 'Save & Generate QR'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-8 py-8">
            <h2 className="text-2xl font-bold text-gray-900">Profile Secured!</h2>
            <div className="flex justify-center"><QRCodeSVG value={generatedUrl} size={220} level="H" includeMargin={true} /></div>
            <div className="space-y-4 pt-4">
              <a href={generatedUrl} target="_blank" rel="noreferrer" className="block w-full bg-safetyBlue text-white p-4 rounded-xl font-bold shadow-md">View Live Card</a>
              <button onClick={() => navigate('/')} className="block w-full bg-gray-100 text-gray-700 p-4 rounded-xl font-bold">Return to Dashboard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
