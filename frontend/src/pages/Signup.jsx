import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = [
  { value: 'student', label: 'Student', desc: 'Request, buy, donate, or sell — full access after ID verification.' },
  { value: 'school', label: 'School / Institution / NGO', desc: 'Bulk-list donated materials on behalf of your organization.' },
];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [docType, setDocType] = useState('id_card');
  const [docNumber, setDocNumber] = useState('');
  const [nameOnDoc, setNameOnDoc] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!file) {
      return setError('Please attach your ID card or fee receipt.');
    }

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('password', form.password);
      formData.append('role', role);
      formData.append('docType', docType);
      formData.append('docNumber', docNumber);
      formData.append('nameOnDoc', nameOnDoc);
      formData.append('document', file);

      await signup(formData);
      navigate('/dashboard');
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

        <div className="pt-4 border-t border-ink/10 mt-6">
          <h2 className="font-semibold mb-3">Verification Details</h2>
          <p className="text-sm text-muted mb-4">Required to prevent duplicate accounts and ensure safety.</p>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Document type</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card">
                <option value="id_card">College ID card</option>
                <option value="fee_receipt">Fee payment receipt</option>
                <option value="institution_doc">Institution registration document</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Name as it appears on the document</label>
              <input value={nameOnDoc} onChange={(e) => setNameOnDoc(e.target.value)} required
                className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">ID / receipt number</label>
              <input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} required
                className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
              <p className="text-xs text-muted mt-1">Used only to detect duplicate accounts, via a one-way hash.</p>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Upload document (image or PDF)</label>
              <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files[0])} required
                className="w-full text-sm" />
            </div>
          </div>
        </div>

        <button disabled={busy} className="w-full bg-forest text-white font-medium py-2.5 rounded-full hover:bg-forest-dark transition disabled:opacity-60 mt-6">
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-muted mt-6">
        Already have an account? <Link to="/login" className="text-forest font-medium hover:underline">Log in</Link>
      </p>
    </div>
  );
}
