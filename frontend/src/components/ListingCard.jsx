import { Link } from 'react-router-dom';
import { getImageUrl } from '../api/axios.js';
import VerifiedBadge from './VerifiedBadge.jsx';

export default function ListingCard({ listing }) {
  const photo = listing.photos?.[0];
  return (
    <Link
      to={`/listings/${listing._id}`}
      className="group block bg-card border border-ink/10 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition"
    >
      <div className="aspect-[4/3] bg-sage/40 overflow-hidden">
        {photo ? (
          <img src={getImageUrl(photo)} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📚</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-base leading-snug line-clamp-2">{listing.title}</h3>
          <span
            className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
              listing.type === 'Free' ? 'bg-forest text-white' : 'bg-amber text-white'
            }`}
          >
            {listing.type === 'Free' ? 'Free' : `₹${listing.price}`}
          </span>
        </div>
        <p className="text-sm text-muted mt-1">{listing.condition} · {listing.category}</p>
        {listing.owner?.name && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted">{listing.owner.name}</span>
            <VerifiedBadge status={listing.owner.verification?.status} role={listing.owner.role} />
          </div>
        )}
      </div>
    </Link>
  );
}
