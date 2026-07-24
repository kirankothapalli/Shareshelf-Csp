import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = [
  { value: 'student', label: 'Student', desc: 'Request, buy, donate, or sell — full access after ID verification.' },
  { value: 'public', label: 'Public Donor', desc: 'Donate or sell items. Lighter phone OTP verification.' },
  { value: 'school', label: 'School / Institution', desc: 'Bulk-list donated materials on behalf of your institution.' },
];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signup({ ...form, role });
      if (role === 'student' || role === 'school') navigate('/verify');
      else navigate('/browse');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-semibold mb-2">Create your account</h1>
      <p className="text-muted mb-8">Choose the role that fits you — verification requirements differ by role.</p>

      <div className="grid gap-3 mb-8">
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            className={`text-left border rounded-xl px-4 py-3 transition ${
              role === r.value ? 'border-forest bg-forest/5' : 'border-ink/15 hover:border-ink/30'
            }`}
          >
            <p className="font-semibold">{r.label}</p>
            <p className="text-sm text-muted">{r.desc}</p>
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1">Full name</label>
          <input required value={form.name} onChange={(e) => update('name', e.target.value)}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
        </div>

        {(role === 'student' || role === 'school') && (
          <>
            <div>
              <label className="text-sm font-medium block mb-1">Email</label>
              <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Password</label>
              <input required type="password" value={form.password} onChange={(e) => update('password', e.target.value)}
                className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
            </div>
          </>
        )}

        {role === 'public' && (
          <div>
            <label className="text-sm font-medium block mb-1">Phone number</label>
            <input required value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91..."
              className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
            <p className="text-xs text-muted mt-1">You'll verify this via OTP after signing up.</p>
          </div>
        )}

        <button disabled={busy} className="w-full bg-forest text-white font-medium py-2.5 rounded-full hover:bg-forest-dark transition disabled:opacity-60">
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-muted mt-6">
        Already have an account? <Link to="/login" className="text-forest font-medium hover:underline">Log in</Link>
      </p>
    </div>
  );
}
