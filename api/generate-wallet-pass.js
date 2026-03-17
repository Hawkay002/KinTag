import jwt from 'jsonwebtoken';

// 🌟 MAGIC FIX: Auto-compresses and crops the image precisely for Google Wallet
function optimizeImageForWallet(url) {
  if (!url || !url.includes('cloudinary.com')) return url;
  // Resizes to 1032x336, crops to focus on the subject's face (g_auto), and optimizes file size (q_auto)
  return url.replace('/upload/', '/upload/w_1032,h_336,c_fill,g_auto,q_auto,f_auto/');
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { profileId, petName, petImageUrl } = req.body;

  try {
    const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
    const CLASS_ID = `${ISSUER_ID}.kintag_id`; 
    
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

    const passObject = {
      id: `${ISSUER_ID}.${profileId}`,
      classId: CLASS_ID,
      genericType: "GENERIC_TYPE_UNSPECIFIED",
      hexBackgroundColor: "#18181b", 
      logo: {
        sourceUri: { uri: "https://kintag.vercel.app/kintag-logo.png" }
      },
      cardTitle: {
        defaultValue: { language: "en", value: "KinTag Digital ID" }
      },
      header: {
        defaultValue: { language: "en", value: petName || "Emergency Profile" }
      },
      heroImage: {
        sourceUri: { 
          // 🌟 We run the image through the optimizer before sending it to Google!
          uri: optimizeImageForWallet(petImageUrl) || "https://kintag.vercel.app/placeholder-hero.png" 
        }
      },
      barcode: {
        type: "QR_CODE",
        value: `https://kintag.vercel.app/#/id/${profileId}`,
        alternateText: "Scan to view emergency profile"
      }
    };

    const claims = {
      iss: credentials.client_email,
      aud: "google",
      origins: ["https://kintag.vercel.app"],
      typ: "savetowallet",
      payload: { genericObjects: [passObject] }
    };

    const token = jwt.sign(claims, credentials.private_key, { algorithm: 'RS256' });

    return res.status(200).json({ success: true, token });

  } catch (error) {
    console.error("Wallet Generation Error:", error);
    return res.status(500).json({ error: "Failed to generate pass. Check server logs." });
  }
}
