import jwt from 'jsonwebtoken';

// 🌟 FIX 1: Changed f_auto to f_jpg. Google Wallet strictly requires JPEGs or PNGs. 
// WebP will crash the pass instantly!
function optimizeImageForWallet(url) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/w_1032,h_336,c_fill,g_auto,q_auto,f_jpg/');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { profileId, petName, petImageUrl } = req.body;

  try {
    const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
    const CLASS_ID = `${ISSUER_ID}.kintag_id`; 
    
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

    // Creates a unique ID so Google is forced to fetch the newest photo
    const uniquePassId = `${ISSUER_ID}.${profileId}-${Math.floor(Date.now() / 1000)}`;

    const passObject = {
      id: uniquePassId,
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
      barcode: {
        type: "QR_CODE",
        value: `https://kintag.vercel.app/#/id/${profileId}`,
        alternateText: "Scan to view emergency profile"
      }
    };

    // 🌟 FIX 2: Only attach the heroImage if the petImageUrl actually exists.
    // This prevents Google from crashing due to a 404 placeholder image.
    if (petImageUrl) {
      passObject.heroImage = {
        sourceUri: { 
          uri: optimizeImageForWallet(petImageUrl)
        },
        contentDescription: {
          defaultValue: { language: "en", value: `${petName || 'Profile'} Picture` }
        }
      };
    }

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
    return res.status(500).json({ error: "Failed to generate pass." });
  }
}
