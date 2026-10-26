const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const admin = require('firebase-admin');

// Initialize Firebase Admin (using environment variables or default app)
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {
    console.warn("Firebase Admin initializeApp error:", e.message);
  }
}

const db = admin.firestore ? admin.firestore() : null;
const auth = admin.auth ? admin.auth() : null;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Helper to hash OTP code with SHA-256
function hashOtp(otp, email) {
  return crypto.createHash('sha256').update(`${email.toLowerCase()}:${otp}`).digest('hex');
}

/**
 * POST /request-otp
 * Request a 6-digit numeric OTP sent via email
 */
app.post('/request-otp', async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!db) {
      return res.status(500).json({ 
        success: false, 
        message: 'Server Firestore is not initialized. Please verify Firebase Admin credentials.' 
      });
    }

    const otpDocRef = db.collection('otp_verifications').doc(cleanEmail);
    const existingSnap = await otpDocRef.get();
    const now = Date.now();

    if (existingSnap.exists) {
      const data = existingSnap.data();
      // Check 60-second cooldown
      if (data.lastRequestedAt && (now - data.lastRequestedAt < 60000)) {
        const remainingSeconds = Math.ceil((60000 - (now - data.lastRequestedAt)) / 1000);
        return res.status(429).json({ 
          success: false, 
          message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.` 
        });
      }

      // Check hourly rate limit (max 5 requests per hour)
      if (data.hourlyRequests && data.windowStart && (now - data.windowStart < 3600000)) {
        if (data.hourlyRequests >= 5) {
          return res.status(429).json({
            success: false,
            message: 'Too many OTP requests for this email. Please try again after 1 hour.'
          });
        }
      }
    }

    // 1. Generate cryptographically secure 6-digit numeric OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpHash = hashOtp(otpCode, cleanEmail);
    const expiresAt = now + (5 * 60 * 1000); // 5 minutes expiration

    // 2. Dispatch real email via trusted provider (e.g. Resend / SendGrid / NodeMailer)
    const emailProviderKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY;
    if (!emailProviderKey) {
      console.warn("WARNING: Server email provider API key is not configured.");
      return res.status(503).json({
        success: false,
        message: 'Email service provider is not configured on the server. Please set RESEND_API_KEY or use Method A (Email + Password).'
      });
    }

    // Example with Resend
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'GO PLMR Verification <auth@go-plmr.com>',
        to: [cleanEmail],
        subject: `Your GO PLMR Driver Login Code: ${otpCode}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="background-color: #f59e0b; padding: 12px 20px; border-radius: 12px; margin-bottom: 20px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 20px;">GO PLMR Driver App</h2>
            </div>
            <p style="color: #334155; font-size: 15px;">Hello Partner,</p>
            <p style="color: #334155; font-size: 15px;">Use the following 6-digit verification code to log in to your GO PLMR Driver account:</p>
            <div style="background-color: #f1f5f9; padding: 18px; border-radius: 12px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${otpCode}</span>
            </div>
            <p style="color: #64748b; font-size: 13px;">This code expires in <strong>5 minutes</strong>. If you did not request this code, please ignore this email.</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">GO PLMR Partner Support • Palamaner, Andhra Pradesh</p>
          </div>
        `
      });
    }

    // 3. Save hashed OTP and attempt tracking in Firestore
    const existingData = existingSnap.exists ? existingSnap.data() : {};
    const windowStart = (existingData.windowStart && (now - existingData.windowStart < 3600000)) ? existingData.windowStart : now;
    const hourlyRequests = (windowStart === now) ? 1 : ((existingData.hourlyRequests || 0) + 1);

    await otpDocRef.set({
      email: cleanEmail,
      otpHash,
      expiresAt,
      attempts: 0,
      maxAttempts: 5,
      isUsed: false,
      lastRequestedAt: now,
      windowStart,
      hourlyRequests,
      role: role || 'driver'
    });

    return res.json({
      success: true,
      message: 'A 6-digit OTP has been sent to your email address.',
      cooldownSeconds: 60
    });
  } catch (error) {
    console.error("Error in /request-otp:", error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

/**
 * POST /verify-otp
 * Verify OTP securely on the server and generate Firebase Custom Token
 */
app.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const otpDocRef = db.collection('otp_verifications').doc(cleanEmail);
    const snap = await otpDocRef.get();

    if (!snap.exists) {
      return res.status(400).json({ success: false, message: 'No OTP request found for this email. Please request a new code.' });
    }

    const data = snap.data();
    const now = Date.now();

    // Check if already used
    if (data.isUsed) {
      return res.status(400).json({ success: false, message: 'This OTP has already been used. Please request a new code.' });
    }

    // Check expiration (5 minutes)
    if (now > data.expiresAt) {
      await otpDocRef.update({ isUsed: true });
      return res.status(400).json({ success: false, message: 'This OTP has expired. Please request a new code.' });
    }

    // Check maximum attempts
    if (data.attempts >= data.maxAttempts) {
      await otpDocRef.update({ isUsed: true });
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. This OTP has been invalidated.' });
    }

    // Compare SHA-256 hash
    const inputHash = hashOtp(cleanOtp, cleanEmail);
    if (inputHash !== data.otpHash) {
      const remainingAttempts = data.maxAttempts - (data.attempts + 1);
      await otpDocRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
      return res.status(400).json({ 
        success: false, 
        message: `Incorrect code. ${remainingAttempts} attempts remaining.` 
      });
    }

    // Invalidate OTP immediately upon successful verification
    await otpDocRef.update({ isUsed: true, verifiedAt: now });

    // Find or create Firebase Auth user for this email
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(cleanEmail);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: cleanEmail,
          emailVerified: true
        });
      } else {
        throw e;
      }
    }

    // Mark email as verified if not yet
    if (!userRecord.emailVerified) {
      await auth.updateUser(userRecord.uid, { emailVerified: true });
    }

    // Generate Firebase Custom Token
    const customToken = await auth.createCustomToken(userRecord.uid, {
      role: 'driver',
      authMethod: 'email_otp'
    });

    return res.json({
      success: true,
      message: 'OTP verified successfully.',
      customToken
    });
  } catch (error) {
    console.error("Error in /verify-otp:", error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

const PORT = process.env.PORT || 8080;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`GO PLMR OTP Server listening on port ${PORT}`);
  });
}

module.exports = app;
