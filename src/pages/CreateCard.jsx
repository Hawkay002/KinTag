import { useState } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { QRCodeSVG } from 'qrcode.react';

export default function CreateCard() {
  const [type, setType] = useState('kid');
  const [formData, setFormData] = useState({ name: '', age: '', address: '', parentPhone: '', typeSpecific: '' });
  const [imageFile, setImageFile] = useState(null);
  const [generatedUrl, setGeneratedUrl] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // 1. Upload Image to Firebase Storage
      const imageRef = ref(storage, `profiles/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(imageRef);

      // 2. Save Data to Firestore Database
      const docRef = await addDoc(collection(db, "profiles"), {
        ...formData,
        type,
        imageUrl,
        createdAt: new Date()
      });

      // 3. Generate Public URL for the QR Code
      const publicUrl = `${window.location.origin}/id/${docRef.id}`;
      setGeneratedUrl(publicUrl);

    } catch (error) {
      console.error("Error saving profile: ", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New ID Card</h1>
      
      {!generatedUrl ? (
        <form onSubmit={handleSave} className="space-y-4">
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="w-full p-3 border rounded-lg bg-white"
          >
            <option value="kid">Kid</option>
            <option value="pet">Pet</option>
          </select>

          <input type="file" onChange={(e) => setImageFile(e.target.files[0])} required className="w-full" />
          <input type="text" placeholder="Name" required onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="text" placeholder="Age" required onChange={(e) => setFormData({...formData, age: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="text" placeholder={type === 'kid' ? "Ethnicity" : "Breed"} onChange={(e) => setFormData({...formData, typeSpecific: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="text" placeholder="Safe Address / Meeting Point" required onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input type="tel" placeholder="Emergency Contact Phone" required onChange={(e) => setFormData({...formData, parentPhone: e.target.value})} className="w-full p-3 border rounded-lg" />

          <button type="submit" className="w-full bg-safetyBlue text-white p-4 rounded-lg font-bold">Save & Generate QR</button>
        </form>
      ) : (
        <div className="text-center space-y-6">
          <h2 className="text-xl font-bold text-reassuringGreen">Profile Saved!</h2>
          <div className="bg-white p-6 rounded-xl shadow-sm inline-block">
            <QRCodeSVG value={generatedUrl} size={200} />
          </div>
          <p className="text-sm text-gray-500">Scan to view public card</p>
          <a href={generatedUrl} className="block w-full bg-gray-200 text-gray-800 p-4 rounded-lg font-bold text-center">Preview Card</a>
        </div>
      )}
    </div>
  );
}
