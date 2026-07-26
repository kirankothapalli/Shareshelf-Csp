import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocketContext } from '../context/SocketContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, markAllRead } = useSocketContext();
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.read).length;

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

  // Lock scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLinks = [
    { to: '/browse', label: 'Browse' },
    { to: '/community-requests', label: 'Requests' },
    { to: '/safety', label: 'Safety' },
    ...(user ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin/stats', label: 'Admin' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-md border-b border-ink/8">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="font-display text-2xl font-semibold text-forest tracking-tight hover:opacity-80 transition-opacity">
          ShareShelf
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'text-forest bg-forest-50' : 'text-ink/60 hover:text-forest hover:bg-forest-50/50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {user && (
            <Link
              to="/create-listing"
              className="hidden sm:inline-flex items-center gap-1.5 btn-primary bg-forest text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-forest-dark transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              List item
            </Link>
          )}

          {/* Notifications */}
          {user && (
            <div className="relative">
              <button
                onClick={() => { setNotifOpen((o) => !o); if (!notifOpen) markAllRead(); }}
                aria-label="Notifications"
                className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-sage/50 transition"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M13.5 6.75C13.5 5.55653 13.0259 4.41193 12.182 3.56802C11.3381 2.72411 10.1935 2.25 9 2.25C7.80653 2.25 6.66193 2.72411 5.81802 3.56802C4.97411 4.41193 4.5 5.55653 4.5 6.75C4.5 12 2.25 13.5 2.25 13.5H15.75C15.75 13.5 13.5 12 13.5 6.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.2975 15.75C10.1657 15.9773 9.9764 16.166 9.74868 16.2971C9.52097 16.4283 9.26277 16.4973 9.00001 16.4973C8.73726 16.4973 8.47906 16.4283 8.25134 16.2971C8.02363 16.166 7.83432 15.9773 7.70251 15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber rounded-full animate-pulse-soft ring-2 ring-paper" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-card border border-ink/10 rounded-2xl shadow-elevated-lg p-2 animate-fade-in-down">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide px-3 py-2">Notifications</p>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted p-3">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="text-sm px-3 py-2.5 rounded-xl hover:bg-sage-50 transition-colors">
                        {n.message}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* User / Auth buttons */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/profile" className="text-sm font-medium text-ink/70 hover:text-forest transition-colors px-2">
                {user.name}
              </Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="text-sm font-medium text-muted hover:text-ink border border-ink/10 rounded-full px-3 py-1.5 hover:bg-sage-50 transition-all"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="text-sm font-medium px-3 py-1.5 text-ink/60 hover:text-forest transition-colors">
                Log in
              </Link>
              <Link to="/signup" className="text-sm font-medium btn-primary bg-forest text-white px-4 py-1.5 rounded-full hover:bg-forest-dark transition-all">
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-sage/50 transition"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 6H18M4 11H18M4 16H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 bg-card shadow-elevated-lg flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-ink/5">
              <span className="font-display text-lg font-semibold text-forest">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-sage/50 flex items-center justify-center transition"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 py-4 px-3 space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block text-sm font-medium px-4 py-3 rounded-xl transition-colors ${
                      isActive ? 'text-forest bg-forest-50' : 'text-ink/60 hover:bg-sage-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {user && (
                <Link
                  to="/create-listing"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium px-4 py-3 rounded-xl text-forest bg-forest-50 hover:bg-forest-100 transition-colors mt-4"
                >
                  + List an item
                </Link>
              )}
            </nav>

            {/* Footer actions */}
            <div className="p-4 border-t border-ink/5 space-y-2">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-sage-50 transition"
                  >
                    👤 {user.name}
                  </Link>
                  <button
                    onClick={() => { logout(); navigate('/'); setMobileOpen(false); }}
                    className="w-full text-sm font-medium text-muted px-4 py-2.5 rounded-xl border border-ink/10 hover:bg-sage-50 transition text-left"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block text-center text-sm font-medium px-4 py-2.5 rounded-xl border border-ink/10 hover:bg-sage-50 transition"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="block text-center text-sm font-medium bg-forest text-white px-4 py-2.5 rounded-full hover:bg-forest-dark transition"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
