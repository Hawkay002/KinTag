// File: api/verify-recaptcha.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { token, action } = req.body;

  if (!token) {
    return res.status(400).json({ error: "reCAPTCHA token is missing." });
  }

  try {
    // Your exact GCP Project ID
    const projectId = "project-d4e68e38-39c4-4d48-a40"; 
    // This needs to be added to your Vercel Environment Variables!
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY; 

    const verifyUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;

    const payload = {
      event: {
        token: token,
        // Your exact Site Key
        siteKey: "6LdWVoQsAAAAAAFMRh7Nlf8-9dIBZ5ulY2K9KQYL", 
        expectedAction: action || "login"
      }
    };

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Google checks if the token is valid and hasn't been used before
    if (data.tokenProperties && data.tokenProperties.valid) {
      return res.status(200).json({ success: true, score: data.riskAnalysis?.score });
    } else {
      console.error("reCAPTCHA Invalid Reason:", data.tokenProperties?.invalidReason);
      return res.status(403).json({ error: "Failed human verification." });
    }
  } catch (error) {
    console.error("reCAPTCHA Error:", error);
    return res.status(500).json({ error: "Server error verifying captcha." });
  }
}
