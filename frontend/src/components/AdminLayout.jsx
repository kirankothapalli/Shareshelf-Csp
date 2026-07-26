import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  {
    to: '/admin/stats',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
    ),
  },
  {
    to: '/admin/verifications',
    label: 'Verifications',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6 9L8.25 11.25L12.75 6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/></svg>
    ),
    badge: true,
  },
  {
    to: '/admin/reports',
    label: 'Reports',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 10.5V3.75A.75.75 0 013.75 3H7.5L9 4.5H14.25A.75.75 0 0115 5.25V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 10.5L4.5 7.5H13.5L15 10.5V14.25A.75.75 0 0114.25 15H3.75A.75.75 0 013 14.25V10.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    to: '/admin/users',
    label: 'Users',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M3 15C3 12.3 5.69 10.5 9 10.5C12.31 10.5 15 12.3 15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    ),
  },
  {
    to: '/admin/audit-log',
    label: 'Audit Log',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5.25 3H12.75A1.5 1.5 0 0114.25 4.5V15L9 12L3.75 15V4.5A1.5 1.5 0 015.25 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
];

export default function AdminLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Build breadcrumbs from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace('-', ' '),
    path: '/' + pathSegments.slice(0, i + 1).join('/'),
    isLast: i === pathSegments.length - 1,
  }));

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-16 left-0 z-50 md:z-auto
          h-[calc(100vh-4rem)] w-64
          admin-sidebar text-white
          flex flex-col
          transform transition-transform duration-300 ease-smooth
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Admin badge */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-white/50">Administrator</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `admin-sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'active bg-white/12 text-white' : 'text-white/65 hover:text-white'
                }`
              }
            >
              <span className="shrink-0 opacity-80">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="w-2 h-2 bg-amber rounded-full animate-pulse-soft" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-white/30">ShareShelf Admin v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="sticky top-16 z-30 bg-paper/95 backdrop-blur border-b border-ink/5 px-4 md:px-8 py-3">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-sage/50 transition"
              aria-label="Open admin menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-sm">
              {breadcrumbs.map((bc) => (
                <span key={bc.path} className="flex items-center gap-1.5">
                  {bc.isLast ? (
                    <span className="font-medium text-ink">{bc.label}</span>
                  ) : (
                    <>
                      <span className="text-muted">{bc.label}</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-muted/50">
                        <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </span>
              ))}
            </nav>
          </div>
        </div>

        {/* Page content */}
        <div className="px-4 md:px-8 py-8">
          {title && (
            <h1 className="font-display text-2xl md:text-3xl font-semibold mb-8">{title}</h1>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
