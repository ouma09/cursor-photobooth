import { Resend } from 'resend';

// ============================================
// EMAIL CONFIGURATION - Easy to customize
// ============================================
const EMAIL_CONFIG = {
  from: 'UBC Startup Event <onboarding@resend.dev>',
  subject: 'Your UBC Startup Event Photo 📸',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #002145; text-align: center;">🎉 UBC Startup Event</h2>
      <p style="text-align: center; color: #666;">Here's your photo from the event!</p>
      <p style="text-align: center; color: #666; font-size: 14px;">
        Thanks for joining us! 🚀
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="text-align: center; color: #999; font-size: 12px;">
        Your photo is attached below.
      </p>
    </div>
  `,
  attachmentFilename: 'photobooth-photo.jpg',
};
// ============================================

export default async function handler(req, res) {
  try {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check for API key before creating Resend instance
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Email service is not configured'
      });
    }

    // Initialize Resend inside handler to catch initialization errors
    let resend;
    try {
      resend = new Resend(process.env.RESEND_API_KEY);
    } catch (initError) {
      console.error('Resend initialization error:', initError);
      return res.status(500).json({
        error: 'Initialization error',
        message: 'Email service initialization failed'
      });
    }

    const { email, photoData, caption } = req.body;

    // Validate input
    if (!email || !photoData) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'Email and photo data are required' 
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email', 
        message: 'Please provide a valid email address' 
      });
    }

    // Extract base64 data
    let base64Data = photoData;
    if (photoData.includes('base64,')) {
      base64Data = photoData.split('base64,')[1];
    }

    // Create buffer from base64
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: email,
      subject: EMAIL_CONFIG.subject,
      html: EMAIL_CONFIG.html,
      attachments: [
        {
          filename: EMAIL_CONFIG.attachmentFilename,
          content: imageBuffer,
          contentType: 'image/jpeg',
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ 
        error: 'Email send failed', 
        message: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully!',
      id: data.id 
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: 'Failed to send email. Please try again.' 
    });
  }
}
