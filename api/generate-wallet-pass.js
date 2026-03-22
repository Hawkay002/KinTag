import jwt from 'jsonwebtoken';

// --- SECURITY UTILITIES ---
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; 
const MAX_REQUESTS_PER_WINDOW = 5; 

const sanitizeInput = (input, maxLength = 255) => {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[<>{}()$]/g, '').trim().substring(0, maxLength);
};
// --------------------------

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --- RATE LIMITER ---
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown-ip';
  const currentTime = Date.now();
  if (rateLimitMap.has(ip)) {
    const clientData = rateLimitMap.get(ip);
    if (currentTime < clientData.resetTime) {
      if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }
      clientData.count += 1;
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: currentTime + RATE_LIMIT_WINDOW_MS });
    }
  } else {
    rateLimitMap.set(ip, { count: 1, resetTime: currentTime + RATE_LIMIT_WINDOW_MS });
  }
  // --------------------
  
  const profileId = sanitizeInput(req.body.profileId, 50);
  const name = sanitizeInput(req.body.name || req.body.petName, 60); 
  const type = sanitizeInput(req.body.type, 20); 
  const age = sanitizeInput(req.body.age, 20); 

  if (!profileId) return res.status(400).json({ error: 'Invalid or missing Profile ID.' });

  try {
    const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
    
    // 🌟 Points to the v4 class you manually created in the Google Wallet Console
    const CLASS_ID = `${ISSUER_ID}.kintag_v4`; 
    
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    
    // Kept Date.now() for testing to bypass cache. Remove it once the design is perfect!
    const uniquePassId = `${ISSUER_ID}.${profileId}-${Date.now()}`;

    // Custom colors and image URLs
    const passColor = type === 'kid' ? '#e54000' : '#2596be'; 
    const heroImageUrl = type === 'kid' 
      ? "https://kintag.vercel.app/patternnewoo.png" 
      : "https://kintag.vercel.app/patternnewo.png";

    const displayType = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'N/A';

    // 🌟 We NO LONGER define classObject here because the Google Console handles the layout

    const passObject = {
      id: uniquePassId,
      classId: CLASS_ID,
      genericType: "GENERIC_TYPE_UNSPECIFIED",
      hexBackgroundColor: passColor, 
      logo: {
        sourceUri: { uri: "https://kintag.vercel.app/kintag-logo.png" },
        contentDescription: { defaultValue: { language: "en", value: "KinTag Logo" } }
      },
      cardTitle: {
        defaultValue: { language: "en", value: "Scan QR for Info" }
      },
      subheader: {
        defaultValue: { language: "en", value: "KinTag Digital ID" }
      },
      header: {
        defaultValue: { language: "en", value: name || "Emergency Profile" } 
      },
      // 🌟 ADDED EXPLICIT IDs: These must match object.textModulesData['profileType'] in your console setup
      textModulesData: [
        {
          id: "profileType",
          header: "PROFILE TYPE",
          body: displayType
        },
        {
          id: "profileAge",
          header: "AGE",
          body: age || "N/A"
        }
      ],
      heroImage: {
        sourceUri: { uri: heroImageUrl },
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

    // 🌟 ONLY send genericObjects in the payload (NO genericClasses)
    const claims = {
      iss: credentials.client_email,
      aud: "google",
      origins: ["https://kintag.vercel.app"],
      typ: "savetowallet",
      payload: { 
        genericObjects: [passObject] 
      }
    };

    const token = jwt.sign(claims, credentials.private_key, { algorithm: 'RS256' });

    return res.status(200).json({ success: true, token });

  } catch (error) {
    console.error("Wallet Generation Error:", error);
    return res.status(500).json({ error: "Failed to generate pass. Check server logs." });
  }
}
