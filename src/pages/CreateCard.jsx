import { useState } from 'react';
import { db, storage, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

export default function CreateCard() {
  const navigate = useNavigate();
  
  // Core State
  const [type, setType] = useState('kid');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [error, setError] = useState('');

  // Form Data State
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    heightWeight: '',
    bloodGroup: '',
    typeSpecific: '', 
    parent1Name: '',
    parent1Phone: '',
    parent2Name: '',
    parent2Phone: '',
    primaryEmergencyContact: 'parent1', 
    address: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!auth.currentUser) {
      setError("You must be logged in to create a card.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = '';

      // 1. Conditionally Upload Image (if provided)
      if (imageFile) {
        const imageRef = ref(storage, `profiles/${auth.currentUser.uid}_${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      } else {
        // Fallback placeholder image if they decide to add a real one later
        imageUrl = 'https://placehold.co/600x400/eeeeee/999999?text=No+Photo+Provided';
      }

      // 2. Save Data to Firestore Database
      const docRef = await addDoc(collection(db, "profiles"), {
        ...formData,
        type,
        imageUrl, // Will be either the real image URL or the placeholder
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });

      // 3. Generate Public URL for the QR Code (UPDATED WITH HASH ROUTING)
      const publicUrl = `${window.location.origin}/#/id/${docRef.id}`;
      setGeneratedUrl(publicUrl);

    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Create ID Card</h1>
        <p className="text-gray-500 mb-8">Fill in the details below to generate a secure digital contact card.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {!generatedUrl ? (
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Profile Type Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Profile Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-safetyBlue outline-none"
              >
                <option value="kid">Kid</option>
                <option value="pet">Pet</option>
              </select>
            </div>

            {/* Hero Image Upload - Optional */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Hero Image (Optional - can add later)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])} 
                className="w-full p-2 border border-gray-300 rounded-xl bg-gray-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-safetyBlue file:text-white hover:file:bg-blue-600 transition-all cursor-pointer" 
              />
            </div>

            {/* Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-safetyBlue outline-none" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Age</label>
                <input type="text" name="age" value={formData.age} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-safetyBlue outline-none" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Height & Weight</label>
                <input type="text" name="heightWeight" placeholder="e.g., 4'2, 60 lbs" value={formData.heightWeight} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-safetyBlue outline-none" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Blood Group</label>
                <input type="text" name="bloodGroup" placeholder="e.g., O+" value={formData.bloodGroup} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-safetyBlue outline-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">{type === 'kid' ? "Ethnicity" : "Breed"}</label>
              <input type="text" name="typeSpecific" value={formData.typeSpecific} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-safetyBlue outline-none" />
            </div>

            <hr className="border-gray-200" />

            {/* Parent / Contact Details */}
            <h3 className="text-lg font-bold text-gray-900">Contact Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Parent/Owner 1 Name</label>
                <input type="text" name="parent1Name" value={formData.parent1Name} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-safetyBlue outline-none" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Parent/Owner 1 Phone</label>
                <input type="tel" name="parent1Phone" value={formData.parent1Phone} onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-safetyBlue outline-none" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Parent/Owner 2 Name (Optional)</label>
                <input type="text" name="parent2Name" value={formData.parent2Name} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-safetyBlue outline-none" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Parent/Owner 2 Phone (Optional)</label>
                <input type="tel" name="parent2Phone" value={formData.parent2Phone} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-safetyBlue outline-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Primary Emergency Contact</label>
              <select 
                name="primaryEmergencyContact"
                value={formData.primaryEmergencyContact} 
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-safetyBlue outline-none"
              >
                <option value="parent1">Parent/Owner 1</option>
                <option value="parent2">Parent/Owner 2</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Safe Address / Meeting Point</label>
              <textarea 
                name="address" 
                value={formData.address} 
                onChange={handleInputChange} 
                required 
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-safetyBlue outline-none resize-none" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white p-4 rounded-xl font-bold text-lg transition-all ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-safetyBlue hover:bg-blue-600 shadow-md hover:shadow-lg'}`}
            >
              {loading ? 'Saving Profile...' : 'Save & Generate QR'}
            </button>
          </form>
        ) : (
          /* Success & Preview State */
          <div className="text-center space-y-8 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg className="w-8 h-8 text-reassuringGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Profile Secured!</h2>
              <p className="text-gray-500 mt-2">Your digital contact card is live. Save this QR code or print it on a physical tag.</p>
            </div>
            
            <div className="flex justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 inline-block">
                <QRCodeSVG value={generatedUrl} size={220} level="H" includeMargin={true} />
              </div>
            </div>
            
            <div className="space-y-4 pt-4">
              <a 
                href={generatedUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block w-full bg-safetyBlue text-white p-4 rounded-xl font-bold shadow-md hover:bg-blue-600 transition-all"
              >
                View Live Card Preview
              </a>
              <button 
                onClick={() => navigate('/')} 
                className="block w-full bg-gray-100 text-gray-700 p-4 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
