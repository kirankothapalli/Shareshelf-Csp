import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import Loader from '../components/Loader.jsx';
import { Link } from 'react-router-dom';

export default function WishlistBoard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', author: '', subject: '', urgency: 'medium' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    api.get('/requests/mine').then((res) => setRequests(res.data.requests)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/requests', form);
      setForm({ title: '', author: '', subject: '', urgency: 'medium' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not post request');
    } finally {
      setBusy(false);
    }
  }

  const urgencyColor = { low: 'bg-sage text-forest-dark', medium: 'bg-amber/20 text-amber-dark', high: 'bg-red-100 text-red-600' };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-semibold mb-2">Wishlist / request board</h1>
      <p className="text-muted mb-8">Post what you need — we'll notify you the moment a matching listing appears.</p>

      <form onSubmit={handleSubmit} className="bg-card border border-ink/10 rounded-2xl p-5 mb-10 space-y-3">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          <input required placeholder="Title (e.g. Data Structures)" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="border border-ink/20 rounded-lg px-3 py-2" />
          <input placeholder="Author / edition" value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} className="border border-ink/20 rounded-lg px-3 py-2" />
          <input placeholder="Subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className="border border-ink/20 rounded-lg px-3 py-2" />
          <select value={form.urgency} onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))} className="border border-ink/20 rounded-lg px-3 py-2">
            <option value="low">Low urgency</option>
            <option value="medium">Medium urgency</option>
            <option value="high">High urgency</option>
          </select>
        </div>
        <button disabled={busy} className="bg-forest text-white font-medium px-5 py-2 rounded-full hover:bg-forest-dark transition disabled:opacity-60">
          {busy ? 'Posting…' : 'Post request'}
        </button>
      </form>

      <h2 className="font-display text-xl font-semibold mb-4">Your requests</h2>
      {loading ? (
        <Loader />
      ) : requests.length === 0 ? (
        <p className="text-muted">You haven't posted any requests yet.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r._id} className="border border-ink/10 rounded-xl p-4 bg-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-sm text-muted">{r.subject} {r.author && `· ${r.author}`}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${urgencyColor[r.urgency]}`}>{r.urgency}</span>
              </div>
              <p className="text-xs text-muted mt-2">Status: {r.status}</p>
              {r.matchedListings?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.matchedListings.map((m) => (
                    <Link key={m._id} to={`/listings/${m._id}`} className="text-xs bg-forest/10 text-forest px-3 py-1 rounded-full hover:bg-forest/20">
                      Match: {m.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
