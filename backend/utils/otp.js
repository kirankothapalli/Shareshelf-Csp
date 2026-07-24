// Simple in-memory OTP store for demo purposes.
// In production this should live in Redis with TTL, not process memory.
const otpStore = new Map(); // phone -> { code, expiresAt }

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOTP(phone) {
  const code = generateCode();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(phone, { code, expiresAt });

  if (process.env.OTP_PROVIDER === 'twilio') {
    // Real Twilio integration would go here using TWILIO_ACCOUNT_SID / AUTH_TOKEN.
    // Kept as a stub so the app runs without real credentials in dev/demo.
    console.log(`[otp:twilio-stub] Would send OTP ${code} to ${phone}`);
  } else {
    console.log(`[otp:stub] OTP for ${phone} is ${code} (dev mode - not actually sent)`);
  }

  return true;
}

function verifyOTP(phone, code) {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  const valid = entry.code === String(code);
  if (valid) otpStore.delete(phone);
  return valid;
}

module.exports = { sendOTP, verifyOTP };
