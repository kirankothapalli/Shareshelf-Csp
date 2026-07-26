import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = {
  title: '', category: 'book', subject: '', department: '', semester: '',
  condition: 'Good', description: '', type: 'Free', price: '', originalPriceDeclared: '', quantity: 1,
};

export default function CreateEditListing() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const prefillTitle = searchParams.get('prefill') || '';
  const [form, setForm] = useState({ ...emptyForm, title: prefillTitle });
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [photoPreviews, setPhotoPreviews] = useState([]);

  useEffect(() => {
    if (isEdit) {
      api.get(`/listings/${id}`).then((res) => {
        const l = res.data.listing;
        setForm({
          title: l.title, category: l.category, subject: l.subject, department: l.department,
          semester: l.semester, condition: l.condition, description: l.description,
          type: l.type, price: l.price, originalPriceDeclared: l.originalPriceDeclared, quantity: l.quantity,
        });
      });
    }
  }, [id, isEdit]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 6) {
      setError('Maximum 6 photos allowed.');
      return;
    }
    setError('');
    
    setPhotos(prev => [...prev, ...files]);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
  }

  function removePhoto(index) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (user?.role !== 'admin' && user?.verification?.status !== 'approved') {
      return setError('Your account must be verified before you can create a listing.');
    }

    if (!isEdit && photos.length < 1) {
      return setError('At least 1 live photo is required to ensure authenticity.');
    }

    setBusy(true);
    try {
      if (isEdit) {
        await api.patch(`/listings/${id}`, form);
        navigate(`/listings/${id}`);
      } else {
        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => formData.append(k, v));
        photos.forEach((p) => formData.append('photos', p));

        // Get geolocation with a proper Promise wrapper so we can await it
        const coords = await getGeolocation();
        if (coords) {
          formData.append('lat', coords.latitude);
          formData.append('lng', coords.longitude);
          
          try {
            const geocodeRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`);
            const geocodeData = await geocodeRes.json();
            if (geocodeData && geocodeData.address) {
              const area = geocodeData.address.suburb || geocodeData.address.neighbourhood || geocodeData.address.city_district || geocodeData.address.city || geocodeData.address.town || geocodeData.address.county || 'Approximate area';
              const city = geocodeData.address.city || geocodeData.address.town || geocodeData.address.county || '';
              const areaLabel = area !== city && city ? `${city} - ${area}` : area;
              formData.append('areaLabel', areaLabel);
            }
          } catch (e) {
            console.warn('Reverse geocoding failed', e);
          }
        }

        const { data } = await api.post('/listings', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        navigate(`/listings/${data.listing._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save listing');
    } finally {
      setBusy(false);
    }
  }

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = mediaStream;
      setIsCameraActive(true);
      setError('');
    } catch (err) {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        setIsCameraActive(true);
        setError('');
      } catch (fallbackErr) {
        setError('Could not access the camera. Please check permissions or try another browser.');
      }
    }
  }

  function getGeolocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        (err) => {
          console.warn('Geolocation error:', err);
          resolve(null);
        },
        { timeout: 15000, maximumAge: 60000 }
      );
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-semibold mb-2">{isEdit ? 'Edit listing' : 'List an item'}</h1>
      <p className="text-muted mb-8">Donate for free or sell below the original price ΓÇö the platform never handles payment.</p>

      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-medium block mb-1">Title</label>
          <input required value={form.title} onChange={(e) => update('title', e.target.value)} className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Category</label>
            <select value={form.category} onChange={(e) => update('category', e.target.value)} className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card">
              <option value="book">Book</option>
              <option value="stationery">Stationery</option>
              <option value="equipment">Equipment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Condition</label>
            <select value={form.condition} onChange={(e) => update('condition', e.target.value)} className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card">
              <option>New</option>
              <option>Good</option>
              <option>Fair</option>
              <option>Poor</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Subject</label>
            <input value={form.subject} onChange={(e) => update('subject', e.target.value)} className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Department</label>
            <input value={form.department} onChange={(e) => update('department', e.target.value)} className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Semester / class</label>
            <input value={form.semester} onChange={(e) => update('semester', e.target.value)} className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Description</label>
          <textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
        </div>

        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium">Type</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => update('type', 'Free')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${form.type === 'Free' ? 'bg-forest text-white' : 'bg-sage/50'}`}>Free</button>
            <button type="button" onClick={() => update('type', 'Paid')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${form.type === 'Paid' ? 'bg-amber text-white' : 'bg-sage/50'}`}>Paid</button>
          </div>
        </div>

        {form.type === 'Paid' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Original price (Γé╣)</label>
              <input type="number" min="1" value={form.originalPriceDeclared} onChange={(e) => update('originalPriceDeclared', e.target.value)} className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Your price (Γé╣) ΓÇö must be below original</label>
              <input type="number" min="0" value={form.price} onChange={(e) => update('price', e.target.value)} className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-card" />
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium block mb-1">Quantity</label>
          <input type="number" min="1" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} className="w-32 border border-ink/20 rounded-lg px-3 py-2 bg-card" />
        </div>

        {!isEdit && (
          <div>
            <label className="text-sm font-medium block mb-2">Live Photo Capture (Required)</label>
            <p className="text-xs text-muted mb-4">To ensure authenticity, please take live photos of the item (max 6).</p>
            
            {photos.length < 6 ? (
              <div className="mb-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFileChange}
                  className="block w-full text-sm text-ink/70
                    file:mr-4 file:py-2.5 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-forest/10 file:text-forest
                    hover:file:bg-forest/20 transition-colors
                    cursor-pointer"
                />
              </div>
            ) : (
               <div className="mb-4 p-4 text-center bg-sage/30 rounded-lg text-sm text-forest font-medium">
                 Maximum of 6 photos reached.
               </div>
            )}

            {/* Photo Previews */}
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photoPreviews.map((src, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-ink/10 aspect-square">
                    <img src={src} alt="Captured preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button disabled={busy} className="w-full bg-forest text-white font-medium py-3 rounded-full hover:bg-forest-dark transition disabled:opacity-60">
          {busy ? 'SavingΓÇª' : isEdit ? 'Save changes' : 'Publish listing'}
        </button>
      </form>
    </div>
  );
}
