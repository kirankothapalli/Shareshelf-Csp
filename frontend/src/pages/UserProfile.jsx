import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';
import Loader from '../components/Loader.jsx';
import VerifiedBadge from '../components/VerifiedBadge.jsx';
import RatingStars from '../components/RatingStars.jsx';
import ListingCard from '../components/ListingCard.jsx';

export default function UserProfile() {
  const { id: paramId } = useParams();
  const { user: me } = useAuth();
  const id = paramId || me?._id;
  const [data, setData] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([api.get(`/users/${id}`), api.get(`/ratings/user/${id}`)])
      .then(([userRes, ratingsRes]) => {
        setData(userRes.data);
        setRatings(ratingsRes.data.ratings);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function submitReport() {
    try {
      await api.post(`/users/${id}/report`, { reason });
      setReportOpen(false);
      setMessage('Report submitted — thank you.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not submit report');
    }
  }

  if (!id) return <p className="text-center py-16 text-muted">Log in to view your profile.</p>;
  if (loading) return <Loader />;
  if (!data) return <p className="text-center py-16 text-muted">User not found.</p>;

  const { user, activeListings } = data;
  const isMe = me?._id === id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="font-display text-3xl font-semibold">{user.name}</h1>
          <p className="text-muted text-sm">{user.location?.areaLabel}</p>
        </div>
        <VerifiedBadge status={user.verification?.status} role={user.role} />
      </div>

      <div className="flex items-center gap-2 mb-8">
        <RatingStars value={Math.round(user.rating?.avg || 0)} readOnly size="text-lg" />
        <span className="text-sm text-muted">{(user.rating?.avg || 0).toFixed(1)} ({user.rating?.count || 0} ratings)</span>
      </div>

      {!isMe && (
        <>
          {message && <p className="text-sm text-forest bg-forest/10 rounded-lg px-3 py-2 mb-4">{message}</p>}
          {!reportOpen ? (
            <button onClick={() => setReportOpen(true)} className="text-xs text-muted hover:text-red-500 mb-8">Report / block this user</button>
          ) : (
            <div className="border border-ink/10 rounded-xl p-4 bg-card mb-8">
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason for reporting…" className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm mb-2" />
              <div className="flex gap-2">
                <button onClick={submitReport} className="bg-red-500 text-white text-sm px-4 py-1.5 rounded-full">Submit</button>
                <button onClick={() => setReportOpen(false)} className="text-sm px-4 py-1.5">Cancel</button>
              </div>
            </div>
          )}
        </>
      )}

      <h2 className="font-display text-xl font-semibold mb-4">Active listings</h2>
      {activeListings.length === 0 ? (
        <p className="text-muted mb-10">No active listings.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {activeListings.map((l) => <ListingCard key={l._id} listing={l} />)}
        </div>
      )}

      <h2 className="font-display text-xl font-semibold mb-4">Reviews</h2>
      <div className="space-y-3">
        {ratings.length === 0 && <p className="text-muted">No reviews yet.</p>}
        {ratings.map((r) => (
          <div key={r._id} className="border border-ink/10 rounded-xl p-4 bg-card">
            <div className="flex justify-between items-center">
              <p className="font-medium">{r.fromUser?.name}</p>
              <RatingStars value={r.stars} readOnly size="text-sm" />
            </div>
            {r.comment && <p className="text-sm text-ink/70 mt-1">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
