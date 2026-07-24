import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocketContext } from '../context/SocketContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, markAllRead } = useSocketContext();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-ink/10">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="font-display text-2xl font-semibold text-forest tracking-tight">
          ShareShelf
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/browse" className="hover:text-forest">Browse</Link>
          <Link to="/wishlist" className="hover:text-forest">Wishlist</Link>
          <Link to="/safety" className="hover:text-forest">Safety</Link>
          {user && <Link to="/dashboard" className="hover:text-forest">Dashboard</Link>}
          {user?.role === 'admin' && <Link to="/admin/stats" className="hover:text-forest">Admin</Link>}
        </nav>

        <div className="flex items-center gap-3">
          {user && (
            <Link to="/create-listing" className="hidden sm:inline-block bg-forest text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-forest-dark transition">
              + List an item
            </Link>
          )}

          {user && (
            <div className="relative">
              <button
                onClick={() => { setOpen((o) => !o); if (!open) markAllRead(); }}
                aria-label="Notifications"
                className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-sage transition"
              >
                🔔
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber rounded-full" />
                )}
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-card border border-ink/10 rounded-xl shadow-lg p-2">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted p-3">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="text-sm px-3 py-2 rounded-lg hover:bg-sage/50">
                        {n.message}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" className="text-sm font-medium hover:text-forest hidden sm:inline">{user.name}</Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="text-sm font-medium text-muted hover:text-ink border border-ink/15 rounded-full px-3 py-1.5"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm font-medium px-3 py-1.5">Log in</Link>
              <Link to="/signup" className="text-sm font-medium bg-forest text-white px-4 py-1.5 rounded-full hover:bg-forest-dark">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
