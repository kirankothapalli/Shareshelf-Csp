import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';
import VerifiedBadge from '../components/VerifiedBadge.jsx';

export default function VerificationUpload() {
  const { user, updateStoredUser } = useAuth();
  const [docType, setDocType] = useState('id_card');
  const [docNumber, setDocNumber] = useState('');
  const [nameOnDoc, setNameOnDoc] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(user?.verification?.status || 'unverified');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/verify/status').then((res) => setStatus(res.data.verification.status)).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!file) return setError('Please attach your ID card or fee receipt.');

    const formData = new FormData();
    formData.append('docType', docType);
    formData.append('docNumber', docNumber);
    formData.append('nameOnDoc', nameOnDoc);
    formData.append('document', file);

    setBusy(true);
    try {
      const { data } = await api.post('/verify/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus(data.status);
      updateStoredUser({ verification: { status: data.status } });
      setMessage('Submitted! An admin will review it shortly.');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-semibold mb-2">Verify your account</h1>
      <p className="text-muted mb-4">
        Upload your college ID card or fee payment receipt. We only keep a hash of the document number for
        duplicate-account detection — the file itself is deleted automatically once an admin reviews it.
      </p>
      <div className="mb-6"><VerifiedBadge status={status} role={user?.role} /></div>

      {status === 'approved' && (
        <p className="text-sm bg-forest/10 text-forest rounded-lg px-3 py-2">You're verified — you can donate, sell, and claim items.</p>
      )}
      {status === 'pending' && (
        <p className="text-sm bg-amber/10 text-amber-dark rounded-lg px-3 py-2">Your verification is pending admin review.</p>
      )}
      {status === 'rejected' && (
        <p className="text-sm bg-red-50 text-red-600 rounded-lg px-3 py-2">
          Your previous submission was rejected: {user?.verification?.rejectionReason || 'see admin note'}. You can resubmit below.
        </p>
      )}

      {(status === 'unverified' || status === 'rejected') && (
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          {message && <p className="text-sm text-forest bg-forest/10 rounded-lg px-3 py-2">{message}</p>}

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
          <button disabled={busy} className="w-full bg-forest text-white font-medium py-2.5 rounded-full hover:bg-forest-dark transition disabled:opacity-60">
            {busy ? 'Submitting…' : 'Submit for review'}
          </button>
        </form>
      )}
    </div>
  );
}
