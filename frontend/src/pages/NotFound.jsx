import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <p className="text-6xl mb-4">📚</p>
      <h1 className="font-display text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-muted mb-6">The page you're looking for doesn't exist or may have moved.</p>
      <Link to="/" className="bg-forest text-white font-medium px-5 py-2.5 rounded-full hover:bg-forest-dark transition">
        Back to home
      </Link>
    </div>
  );
}
