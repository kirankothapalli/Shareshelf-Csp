import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handlePasswordLogin(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(emailOrPhone, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp() {
    setError('');
    setBusy(true);
    try {
      await api.post('/auth/otp/send', { phone: emailOrPhone });
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send OTP');
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setError('');
    setBusy(true);
    try {
      await api.post('/auth/otp/verify', { phone: emailOrPhone, code: otpCode });
      navigate('/browse');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-semibold mb-2">Welcome back</h1>
      <p className="text-muted mb-8">Log in to browse, list, or track your requests.</p>

      <div className="flex gap-2 mb-6 text-sm">
        <button onClick={() => setMode('password')} className={`px-3 py-1.5 rounded-full font-medium ${mode === 'password' ? 'bg-forest text-white' : 'bg-sage/50'}`}>
          Email &amp; password
        </button>
        <button onClick={() => setMode('otp')} className={`px-3 py-1.5 rounded-full font-medium ${mode === 'otp' ? 'bg-forest text-white' : 'bg-sage/50'}`}>
          Phone OTP (public donor)
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {mode === 'password' ? (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Email or phone</label>
            <input value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} required
              className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
          </div>
          <button disabled={busy} className="w-full bg-forest text-white font-medium py-2.5 rounded-full hover:bg-forest-dark transition disabled:opacity-60">
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Phone number</label>
            <input value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} placeholder="+91..."
              className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
          </div>
          {!otpSent ? (
            <button onClick={sendOtp} disabled={busy} className="w-full bg-forest text-white font-medium py-2.5 rounded-full hover:bg-forest-dark transition disabled:opacity-60">
              Send OTP
            </button>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium block mb-1">Enter 6-digit code</label>
                <input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} maxLength={6}
                  className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
              </div>
              <button onClick={verifyOtp} disabled={busy} className="w-full bg-forest text-white font-medium py-2.5 rounded-full hover:bg-forest-dark transition disabled:opacity-60">
                Verify &amp; continue
              </button>
            </>
          )}
        </div>
      )}

      <p className="text-sm text-muted mt-6">
        New here? <Link to="/signup" className="text-forest font-medium hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
