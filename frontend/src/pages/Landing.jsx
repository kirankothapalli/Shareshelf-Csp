import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import ListingCard from '../components/ListingCard.jsx';
import Loader from '../components/Loader.jsx';

export default function Landing() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/listings', { params: { sort: 'newest', limit: 6 } })
      .then((res) => setListings(res.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-block text-xs font-semibold tracking-wide uppercase text-amber-dark bg-amber/10 px-3 py-1 rounded-full mb-4">
            Hyperlocal · Verified · Free within 20km
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight text-ink">
            A textbook shouldn't be the reason someone falls behind.
          </h1>
          <p className="mt-5 text-lg text-ink/70 max-w-lg">
            ShareShelf connects students who need books and study material with seniors, schools, and neighbors nearby who have them to give — donated free or sold at a fraction of the price.
          </p>
          <div className="mt-8 flex gap-4">
            <Link to="/browse" className="bg-forest text-white font-medium px-6 py-3 rounded-full hover:bg-forest-dark transition">
              Browse nearby listings
            </Link>
            <Link to="/signup" className="border border-ink/20 font-medium px-6 py-3 rounded-full hover:bg-sage/50 transition">
              Donate or sell an item
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="bg-forest rounded-3xl p-8 text-white shadow-xl">
            <p className="font-display text-2xl leading-snug">
              "15 textbooks sat in my cupboard for two years. It took me ten minutes to list them here."
            </p>
            <p className="mt-4 text-sm text-white/70">— Rohan, final-year engineering student</p>
          </div>
          <div className="absolute -bottom-6 -left-6 bg-amber text-white rounded-2xl px-5 py-4 shadow-lg hidden sm:block">
            <p className="text-2xl font-display font-semibold">20km</p>
            <p className="text-xs">radius, in-person pickup only</p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold">Recently listed nearby</h2>
          <Link to="/browse" className="text-sm font-medium text-forest hover:underline">See all →</Link>
        </div>
        {loading ? (
          <Loader label="Loading listings…" />
        ) : listings.length === 0 ? (
          <p className="text-muted">No listings yet — be the first to donate something.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((l) => <ListingCard key={l._id} listing={l} />)}
          </div>
        )}
      </section>

      <section className="bg-sage/40 py-16">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-4 gap-8">
          {[
            ['1. Verify', 'Students verify with a college ID or fee receipt; public donors verify by phone OTP.'],
            ['2. List or request', 'Post an item to give away or sell low-cost, or post what you need on the wishlist board.'],
            ['3. Request to claim', 'Contact details and a safe public meetup point are only shared once a request is accepted.'],
            ['4. Meet & rate', 'Meet in person, hand over the item, then rate each other so trust builds over time.'],
          ].map(([title, desc]) => (
            <div key={title}>
              <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-ink/70">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
