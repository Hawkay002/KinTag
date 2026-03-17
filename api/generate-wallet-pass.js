import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { profileId, petName, petImageUrl } = req.body;

  try {
    const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
    const CLASS_ID = `${ISSUER_ID}.kintag_id`; 
    
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

    // 🌟 CACHE BUSTER: Appending Date.now() forces Google to generate a brand NEW pass
    // instead of showing you the old, cached version without the picture!
    const uniquePassId = `${ISSUER_ID}.${profileId}-${Date.now()}`;

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
      // 🌟 ACCESSIBILITY FIX: Added contentDescription. 
      // Google silently deletes images that don't have alt-text for screen readers!
      heroImage: {
        sourceUri: { 
          uri: petImageUrl || "https://kintag.vercel.app/placeholder-hero.png" 
        },
        contentDescription: {
          defaultValue: { language: "en", value: `${petName}'s Profile Picture` }
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
    return res.status(500).json({ error: "Failed to generate pass." });
  }
}
