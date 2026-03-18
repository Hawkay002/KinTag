import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // We no longer need petImageUrl since we are using a fixed pattern!
  const { profileId, petName } = req.body;

  try {
    const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
    const CLASS_ID = `${ISSUER_ID}.kintag_v2`; 
    
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

    // Forces a completely new pass generation every time
    const uniquePassId = `${ISSUER_ID}.${profileId}-${Date.now()}`;

    const passObject = {
      id: uniquePassId,
      classId: CLASS_ID,
      genericType: "GENERIC_TYPE_UNSPECIFIED",
      hexBackgroundColor: "#2596be", 
      logo: {
        sourceUri: { uri: "https://kintag.vercel.app/kintag-logo.png" },
        contentDescription: { defaultValue: { language: "en", value: "KinTag Logo" } }
      },
      // 🌟 Swapped to petName so it saves under their actual name in the Wallet!
      cardTitle: {
        defaultValue: { language: "en", value: petName || "Emergency Profile" }
      },
      subheader: {
        defaultValue: { language: "en", value: "KinTag Digital ID" }
      },
      header: {
        defaultValue: { language: "en", value: "Scan QR for Info" }
      },
      // 🌟 FIXED HERO IMAGE: Uses your beautiful pattern for every pass
      heroImage: {
        sourceUri: { uri: "https://kintag.vercel.app/patternnewo.png" },
        contentDescription: {
          defaultValue: { language: "en", value: "KinTag Brand Pattern" }
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
