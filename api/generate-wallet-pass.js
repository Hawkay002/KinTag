import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // Accept petImageUrl from the dashboard
  const { profileId, petName, petImageUrl } = req.body;

  try {
    const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
    const CLASS_ID = `${ISSUER_ID}.kintag_id`; 
    
    // Parse the JSON string from your environment variables
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

    // Build the specific pass for this user
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
      // 🌟 FIX: We explicitly include the heroImage module data here.
      // Once you enable the module in the console, this image will appear.
      heroImage: {
        sourceUri: { 
          // Use the real image URL if available, otherwise use a placeholder
          uri: petImageUrl || "https://kintag.vercel.app/placeholder-hero.png" 
        }
      },
      barcode: {
        type: "QR_CODE",
        value: `https://kintag.vercel.app/#/id/${profileId}`,
        alternateText: "Scan to view emergency profile"
      }
    };

    // The required Google payload structure
    const claims = {
      iss: credentials.client_email,
      aud: "google",
      origins: ["https://kintag.vercel.app"],
      typ: "savetowallet",
      payload: { genericObjects: [passObject] }
    };

    // Cryptographically sign the token using the private key
    const token = jwt.sign(claims, credentials.private_key, { algorithm: 'RS256' });

    // Send the token back to the frontend
    return res.status(200).json({ success: true, token });

  } catch (error) {
    console.error("Wallet Generation Error:", error);
    return res.status(500).json({ error: "Failed to generate pass. Check server logs." });
  }
}
