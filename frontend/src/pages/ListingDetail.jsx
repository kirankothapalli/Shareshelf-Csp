import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';
import Loader from '../components/Loader.jsx';
import VerifiedBadge from '../components/VerifiedBadge.jsx';
import RatingStars from '../components/RatingStars.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    api.get(`/listings/${id}`).then((res) => setListing(res.data.listing)).finally(() => setLoading(false));
  }, [id]);

  async function requestToClaim() {
    if (!user) return navigate('/login');
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/transactions', { listingId: id });
      setMessage('Request sent! The owner will be notified.');
      setTimeout(() => navigate(`/transactions/${data.transaction._id}`), 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send request');
    } finally {
      setBusy(false);
    }
  }

  async function submitReport() {
    try {
      await api.post(`/listings/${id}/report`, { reason: reportReason });
      setReportOpen(false);
      setReportReason('');
      setMessage('Thanks — our team will review this listing.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit report');
    }
  }

  if (loading) return <Loader label="Loading listing…" />;
  if (!listing) return <p className="text-center py-16 text-muted">Listing not found.</p>;

  const isOwner = user && listing.owner?._id === user._id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-[4/3] bg-sage/40 rounded-2xl overflow-hidden mb-3">
            {listing.photos?.[activePhoto] ? (
              <img src={listing.photos[activePhoto]} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">📚</div>
            )}
          </div>
          {listing.photos?.length > 1 && (
            <div className="flex gap-2">
              {listing.photos.map((p, i) => (
                <button key={p} onClick={() => setActivePhoto(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${i === activePhoto ? 'border-forest' : 'border-transparent'}`}>
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${listing.type === 'Free' ? 'bg-forest text-white' : 'bg-amber text-white'}`}>
            {listing.type === 'Free' ? 'Free' : `₹${listing.price} (was ₹${listing.originalPriceDeclared})`}
          </span>
          <h1 className="font-display text-3xl font-semibold mb-2">{listing.title}</h1>
          <p className="text-muted mb-4">{listing.condition} · {listing.category} {listing.subject && `· ${listing.subject}`} {listing.semester && `· Sem ${listing.semester}`}</p>
          <p className="mb-6 text-ink/80 whitespace-pre-line">{listing.description}</p>

          <div className="bg-card border border-ink/10 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <Link to={`/profile/${listing.owner?._id}`} className="font-medium hover:underline">{listing.owner?.name}</Link>
              <VerifiedBadge status={listing.owner?.verification?.status} role={listing.owner?.role} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <RatingStars value={Math.round(listing.owner?.rating?.avg || 0)} readOnly size="text-sm" />
              <span>({listing.owner?.rating?.count || 0} ratings)</span>
            </div>
            <p className="text-sm text-muted mt-2">📍 {listing.location?.areaLabel || 'Approximate area shown only'}</p>
            <p className="text-xs text-muted mt-1">Exact address is shared only after a request is accepted.</p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>}
          {message && <p className="text-sm text-forest bg-forest/10 rounded-lg px-3 py-2 mb-3">{message}</p>}

          {!isOwner && listing.status === 'active' && (
            <button onClick={requestToClaim} disabled={busy} className="w-full bg-forest text-white font-medium py-3 rounded-full hover:bg-forest-dark transition disabled:opacity-60">
              {busy ? 'Sending request…' : listing.type === 'Free' ? 'Request to claim' : 'Request to buy'}
            </button>
          )}
          {isOwner && (
            <Link to={`/listings/${id}/edit`} className="block text-center border border-ink/20 font-medium py-3 rounded-full hover:bg-sage/50 transition">
              Edit this listing
            </Link>
          )}
          {listing.status !== 'active' && !isOwner && (
            <p className="text-center text-sm text-muted border border-ink/10 rounded-full py-3">This item is currently {listing.status}.</p>
          )}

          {!isOwner && (
            <button onClick={() => setReportOpen(true)} className="w-full text-xs text-muted hover:text-red-500 mt-3">
              Report this listing
            </button>
          )}

          {reportOpen && (
            <div className="mt-3 border border-ink/10 rounded-xl p-4 bg-card">
              <label className="text-sm font-medium block mb-1">Why are you reporting this?</label>
              <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} rows={3} className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm mb-2" />
              <div className="flex gap-2">
                <button onClick={submitReport} className="bg-red-500 text-white text-sm px-4 py-1.5 rounded-full">Submit report</button>
                <button onClick={() => setReportOpen(false)} className="text-sm px-4 py-1.5">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
