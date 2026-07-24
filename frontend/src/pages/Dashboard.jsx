import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';
import VerifiedBadge from '../components/VerifiedBadge.jsx';
import RatingStars from '../components/RatingStars.jsx';

const TABS = ['Listings', 'Transactions', 'Ratings', 'Verification'];

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Listings');
  const [listings, setListings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [ratings, setRatings] = useState({ ratings: [], summary: { avg: 0, count: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/listings', { params: { search: undefined } }).catch(() => ({ data: { items: [] } })),
      api.get('/transactions/mine').catch(() => ({ data: { transactions: [] } })),
      api.get(`/ratings/user/${user._id}`).catch(() => ({ data: { ratings: [], summary: { avg: 0, count: 0 } } })),
    ]).then(([listingsRes, txnRes, ratingsRes]) => {
      setListings(listingsRes.data?.items?.filter((l) => l.owner?._id === user._id || l.owner === user._id) || []);
      setTransactions(txnRes.data?.transactions || []);
      setRatings(ratingsRes.data || { ratings: [], summary: { avg: 0, count: 0 } });
    }).finally(() => setLoading(false));
  }, [user._id]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl font-semibold">My dashboard</h1>
        <VerifiedBadge status={user.verification?.status} role={user.role} />
      </div>
      <p className="text-muted mb-8">Welcome back, {user.name}.</p>

      <div className="flex gap-2 mb-8 border-b border-ink/10">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-forest text-forest' : 'border-transparent text-muted'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : tab === 'Listings' ? (
        <div className="space-y-3">
          {listings.length === 0 && <p className="text-muted">You haven't listed anything yet. <Link to="/create-listing" className="text-forest underline">List an item →</Link></p>}
          {listings.map((l) => (
            <Link key={l._id} to={`/listings/${l._id}`} className="flex items-center gap-4 border border-ink/10 rounded-xl p-3 bg-card hover:shadow-sm">
              <div className="w-16 h-16 rounded-lg bg-sage/40 overflow-hidden shrink-0">
                {l.photos?.[0] && <img src={l.photos[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{l.title}</p>
                <p className="text-xs text-muted">{l.status} · {l.type === 'Free' ? 'Free' : `₹${l.price}`}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : tab === 'Transactions' ? (
        <div className="space-y-3">
          {transactions.length === 0 && <p className="text-muted">No transactions yet.</p>}
          {transactions.map((t) => (
            <Link key={t._id} to={`/transactions/${t._id}`} className="block border border-ink/10 rounded-xl p-4 bg-card hover:shadow-sm">
              <div className="flex justify-between">
                <p className="font-semibold">{t.listing?.title}</p>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-sage/50">{t.status}</span>
              </div>
              <p className="text-xs text-muted mt-1">
                {t.owner?._id === user._id ? `Requested by ${t.requester?.name}` : `From ${t.owner?.name}`}
              </p>
            </Link>
          ))}
        </div>
      ) : tab === 'Ratings' ? (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <RatingStars value={Math.round(ratings.summary.avg)} readOnly size="text-2xl" />
            <span className="text-muted text-sm">{ratings.summary.avg.toFixed(1)} average ({ratings.summary.count} ratings)</span>
          </div>
          <div className="space-y-3">
            {ratings.ratings.length === 0 && <p className="text-muted">No ratings yet.</p>}
            {ratings.ratings.map((r) => (
              <div key={r._id} className="border border-ink/10 rounded-xl p-4 bg-card">
                <div className="flex justify-between items-center">
                  <p className="font-medium">{r.fromUser?.name}</p>
                  <RatingStars value={r.stars} readOnly size="text-sm" />
                </div>
                {r.comment && <p className="text-sm text-ink/70 mt-1">{r.comment}</p>}
                {r.response && <p className="text-xs text-muted mt-2 italic">Your response: {r.response}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-muted">Manage your verification status and documents.</p>
          <Link to="/verify" className="inline-block bg-forest text-white font-medium px-5 py-2.5 rounded-full hover:bg-forest-dark transition">
            Go to verification page
          </Link>
        </div>
      )}
    </div>
  );
}
