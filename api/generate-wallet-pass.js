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
    
    // 🌟 THE FIX: Changed to v3 to force Google to register the new layout!
    const CLASS_ID = `${ISSUER_ID}.kintag_v2`; 
    
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const uniquePassId = `${ISSUER_ID}.${profileId}`;

    const passColor = type === 'kid' ? '#e54000' : '#2596be'; 
    const heroImageUrl = type === 'kid' 
      ? "https://kintag.vercel.app/patternnewoo.png" 
      : "https://kintag.vercel.app/patternnewo.png";

    const displayType = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'N/A';

    // 🌟 This forces the Profile Type and Age into the front row
    const classObject = {
      id: CLASS_ID,
      classTemplateInfo: {
        cardTemplateOverride: {
          cardRowTemplateInfos: [
            {
              twoItems: {
                startItem: {
                  firstValue: { fields: [{ fieldPath: "object.textModulesData['profile_type']" }] }
                },
                endItem: {
                  firstValue: { fields: [{ fieldPath: "object.textModulesData['profile_age']" }] }
                }
              }
            }
          ]
        }
      }
    };

    const passObject = {
      id: uniquePassId,
      classId: CLASS_ID,
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
      textModulesData: [
        {
          id: "profile_type",
          header: "PROFILE TYPE",
          body: displayType
        },
        {
          id: "profile_age",
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

    const claims = {
      iss: credentials.client_email,
      aud: "google",
      origins: ["https://kintag.vercel.app"],
      typ: "savetowallet",
      payload: { 
        genericClasses: [classObject], 
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
