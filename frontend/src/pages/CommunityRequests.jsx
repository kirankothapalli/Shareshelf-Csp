import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const URGENCY_STYLES = {
  high: {
    badge: 'bg-red-100 text-red-700 border border-red-200',
    dot: 'bg-red-500 animate-pulse',
    card: 'border-red-200 bg-gradient-to-br from-red-50/60 to-white',
    label: '🔴 Urgent',
  },
  medium: {
    badge: 'bg-amber-100 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
    card: 'border-amber-100 bg-card',
    label: '🟡 Medium',
  },
  low: {
    badge: 'bg-sage text-forest-dark border border-sage',
    dot: 'bg-forest',
    card: 'border-ink/10 bg-card',
    label: '🟢 Low',
  },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CommunityRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (urgencyFilter) params.urgency = urgencyFilter;
    api.get('/requests', { params })
      .then((res) => setRequests(res.data.requests || []))
      .finally(() => setLoading(false));
  }, [search, urgencyFilter]);

  function handleFulfill(title) {
    const params = new URLSearchParams({ prefill: title });
    navigate(`/create-listing?${params.toString()}`);
  }

  const highCount = requests.filter((r) => r.urgency === 'high').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-2">Community Requests</h1>
        <p className="text-muted">
          See what people need — if you have it, donate or list it!
        </p>
      </div>

      {/* Urgent alert banner */}
      {highCount > 0 && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span>
            <strong>{highCount}</strong> urgent {highCount === 1 ? 'request' : 'requests'} right now — someone really needs help!
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          placeholder="Search by title, subject, author…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-ink/20 rounded-lg px-3 py-2 bg-card text-sm focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
        />
        <select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
          className="border border-ink/20 rounded-lg px-3 py-2 bg-card text-sm min-w-[150px]"
        >
          <option value="">All urgencies</option>
          <option value="high">🔴 Urgent only</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
      </div>

      {/* My wishlist link */}
      {user && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-forest-50/50 border border-forest-100 rounded-xl px-4 py-3">
          <span className="text-sm text-forest font-medium">
            Need something? Post a request so others can find it for you.
          </span>
          <Link
            to="/wishlist"
            className="text-sm font-medium bg-forest text-white px-4 py-1.5 rounded-full hover:bg-forest-dark transition-all"
          >
            Post a request
          </Link>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <Loader label="Loading community requests…" />
      ) : requests.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-muted font-medium">No open requests right now.</p>
          <p className="text-xs text-muted mt-1">Check back later or post your own request!</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted mb-4">{requests.length} open {requests.length === 1 ? 'request' : 'requests'}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {requests.map((r) => {
              const style = URGENCY_STYLES[r.urgency] || URGENCY_STYLES.medium;
              return (
                <div
                  key={r._id}
                  className={`relative rounded-2xl border p-5 transition-all hover:shadow-elevated ${style.card}`}
                >
                  {/* Urgency badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>
                      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                      {style.label}
                    </span>
                    <span className="text-xs text-muted">{timeAgo(r.createdAt)}</span>
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-lg mb-1">{r.title}</h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted mb-3">
                    {r.author && <span>by {r.author}</span>}
                    {r.subject && <span>· {r.subject}</span>}
                  </div>

                  {/* Requester + Action */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-ink/5">
                    <span className="text-xs text-muted">
                      Requested by <strong className="text-ink/70">{r.requester?.name || 'Anonymous'}</strong>
                    </span>
                    {user ? (
                      <button
                        onClick={() => handleFulfill(r.title)}
                        className="text-xs font-semibold bg-forest text-white px-3.5 py-1.5 rounded-full hover:bg-forest-dark transition-all hover:shadow-glow-forest"
                      >
                        I have this!
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        className="text-xs font-medium text-forest underline hover:no-underline"
                      >
                        Log in to help
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
