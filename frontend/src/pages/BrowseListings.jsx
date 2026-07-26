import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import api from '../api/axios.js';
import ListingCard from '../components/ListingCard.jsx';
import Loader from '../components/Loader.jsx';
import useGeolocation from '../hooks/useGeolocation.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [16.5449, 81.5212]; // Bhimavaram

const SOURCE_LABELS = {
  gps: '📍 GPS location',
  wifi: '📶 Wi-Fi location',
  ip: '🌐 Approximate (IP-based)',
  default: '📌 Default area',
};

const STATUS_COLORS = {
  granted: 'bg-forest-50 text-forest border-forest-100',
  fallback_ip: 'bg-amber-50 text-amber-dark border-amber-100',
  fallback_default: 'bg-amber-50 text-amber-dark border-amber-100',
  denied: 'bg-red-50 text-red-600 border-red-200',
  detecting: 'bg-sage-50 text-muted border-sage',
  error: 'bg-red-50 text-red-600 border-red-200',
};

export default function BrowseListings() {
  const [view, setView] = useState('list'); // 'list' | 'map'
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '', type: '', condition: '', search: '', sort: 'newest', radius: 20,
  });
  const [requestCount, setRequestCount] = useState(0);

  const { coords, status, source, statusMessage, isLoading: geoLoading, isFallback, retry } = useGeolocation();

  // Fetch community requests count
  useEffect(() => {
    api.get('/requests').then((res) => setRequestCount(res.data.total || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    const params = { lat: coords.lat, lng: coords.lng, radius: filters.radius, limit: 50 };
    Object.entries(filters).forEach(([k, v]) => { if (v && k !== 'radius') params[k] = v; });
    api
      .get('/listings', { params })
      .then((res) => {
        setListings(res.data?.items || []);
        setTotal(res.data?.total || 0);
      }).finally(() => setLoading(false));
  }, [coords, filters]);

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  const colorClass = STATUS_COLORS[status] || 'bg-sage-50 text-muted border-sage';

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl font-semibold">Browse listings</h1>
        <div className="flex gap-2 text-sm">
          <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-full font-medium transition-all ${view === 'list' ? 'bg-forest text-white shadow-glow-forest' : 'bg-sage/50 hover:bg-sage'}`}>List</button>
          <button onClick={() => setView('map')} className={`px-3 py-1.5 rounded-full font-medium transition-all ${view === 'map' ? 'bg-forest text-white shadow-glow-forest' : 'bg-sage/50 hover:bg-sage'}`}>Map</button>
        </div>
      </div>

      {/* Community requests banner */}
      {requestCount > 0 && (
        <Link
          to="/community-requests"
          className="flex items-center justify-between gap-3 mb-4 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/80 text-sm text-amber-800 hover:bg-amber-100/80 transition-all group"
        >
          <span>
            🔔 <strong>{requestCount}</strong> {requestCount === 1 ? 'person is' : 'people are'} looking for items — can you help?
          </span>
          <span className="text-xs font-semibold text-amber-700 group-hover:underline shrink-0">
            View requests →
          </span>
        </Link>
      )}

      {/* Location status banner */}
      {statusMessage && (
        <div className={`flex items-center justify-between gap-3 mb-4 px-4 py-2.5 rounded-xl border text-sm ${colorClass} transition-all`}>
          <div className="flex items-center gap-2">
            <span>{source ? SOURCE_LABELS[source] : statusMessage}</span>
            {geoLoading && (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          {(isFallback || status === 'denied') && (
            <button
              onClick={retry}
              className="text-xs font-medium underline hover:no-underline shrink-0"
            >
              Retry location
            </button>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        <input
          placeholder="Search title, subject…"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="md:col-span-2 border border-ink/20 rounded-lg px-3 py-2 bg-card text-sm focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
        />
        <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} className="border border-ink/20 rounded-lg px-3 py-2 bg-card text-sm">
          <option value="">All categories</option>
          <option value="book">Book</option>
          <option value="stationery">Stationery</option>
          <option value="equipment">Equipment</option>
          <option value="other">Other</option>
        </select>
        <select value={filters.type} onChange={(e) => updateFilter('type', e.target.value)} className="border border-ink/20 rounded-lg px-3 py-2 bg-card text-sm">
          <option value="">Free or paid</option>
          <option value="Free">Free</option>
          <option value="Paid">Paid</option>
        </select>
        <select value={filters.condition} onChange={(e) => updateFilter('condition', e.target.value)} className="border border-ink/20 rounded-lg px-3 py-2 bg-card text-sm">
          <option value="">Any condition</option>
          <option value="New">New</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Poor">Poor</option>
        </select>
        <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)} className="border border-ink/20 rounded-lg px-3 py-2 bg-card text-sm">
          <option value="newest">Newest</option>
          <option value="price_low">Price: low to high</option>
        </select>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm text-muted">Search radius: <span className="font-medium text-ink">{filters.radius}km</span></label>
        <input type="range" min="1" max="50" value={filters.radius} onChange={(e) => updateFilter('radius', e.target.value)} className="w-full max-w-xs block accent-forest" />
      </div>

      {total > 0 && !loading && (
        <p className="text-xs text-muted mb-4">{total} listing{total !== 1 ? 's' : ''} found</p>
      )}

      {loading || geoLoading ? (
        <Loader label="Finding listings near you…" />
      ) : listings.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-muted font-medium">No listings match your filters right now.</p>
          <p className="text-xs text-muted mt-1">Try expanding the search radius or clearing filters.</p>
        </div>
      ) : view === 'list' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((l) => <ListingCard key={l._id} listing={l} />)}
        </div>
      ) : (
        <div className="h-[500px] rounded-2xl overflow-hidden border border-ink/10 shadow-elevated">
          <MapContainer center={coords ? [coords.lat, coords.lng] : DEFAULT_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            {coords && <Circle center={[coords.lat, coords.lng]} radius={filters.radius * 1000} pathOptions={{ color: '#2F5233', fillOpacity: 0.05 }} />}
            {listings.map((l) => (
              <Marker key={l._id} position={[l.location.coordinates[1], l.location.coordinates[0]]}>
                <Popup>
                  <p className="font-semibold">{l.title}</p>
                  <p className="text-xs">{l.location.areaLabel}</p>
                  <a href={`/listings/${l._id}`} className="text-forest text-xs underline">View listing</a>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
