import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handlePasswordLogin(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { user } = await login(email, password);
      if (user.role === 'admin') navigate('/admin/stats');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  }



  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-semibold mb-2">Welcome back</h1>
      <p className="text-muted mb-8">Log in to browse, list, or track your requests.</p>

      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={handlePasswordLogin} className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
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

      <p className="text-sm text-muted mt-6">
        New here? <Link to="/signup" className="text-forest font-medium hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
