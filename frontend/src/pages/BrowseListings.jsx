import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/axios.js';
import ListingCard from '../components/ListingCard.jsx';
import Loader from '../components/Loader.jsx';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [16.5449, 81.5212]; // Bhimavaram

export default function BrowseListings() {
  const [view, setView] = useState('list'); // 'list' | 'map'
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState(null);
  const [filters, setFilters] = useState({
    category: '', type: '', condition: '', search: '', sort: 'newest', radius: 20,
  });

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] })
    );
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl font-semibold">Browse listings</h1>
        <div className="flex gap-2 text-sm">
          <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-full font-medium ${view === 'list' ? 'bg-forest text-white' : 'bg-sage/50'}`}>List</button>
          <button onClick={() => setView('map')} className={`px-3 py-1.5 rounded-full font-medium ${view === 'map' ? 'bg-forest text-white' : 'bg-sage/50'}`}>Map</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        <input
          placeholder="Search title, subject…"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="md:col-span-2 border border-ink/20 rounded-lg px-3 py-2 bg-card text-sm"
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

      <div className="mb-6">
        <label className="text-sm text-muted">Search radius: {filters.radius}km</label>
        <input type="range" min="1" max="50" value={filters.radius} onChange={(e) => updateFilter('radius', e.target.value)} className="w-full max-w-xs block" />
      </div>

      {loading ? (
        <Loader label="Finding listings near you…" />
      ) : listings.length === 0 ? (
        <p className="text-muted">No listings match your filters right now.</p>
      ) : view === 'list' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((l) => <ListingCard key={l._id} listing={l} />)}
        </div>
      ) : (
        <div className="h-[500px] rounded-2xl overflow-hidden border border-ink/10">
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
