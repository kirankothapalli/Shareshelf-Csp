import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/admin/stats', label: 'Stats dashboard' },
  { to: '/admin/verifications', label: 'Verification queue' },
  { to: '/admin/reports', label: 'Reports queue' },
  { to: '/admin/users', label: 'User management' },
];

export default function AdminLayout({ children, title }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-[200px_1fr] gap-8">
      <aside>
        <p className="text-xs uppercase tracking-wide text-muted font-semibold mb-3">Admin</p>
        <nav className="flex md:flex-col gap-1 flex-wrap">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium px-3 py-2 rounded-lg ${isActive ? 'bg-forest text-white' : 'hover:bg-sage/50'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div>
        <h1 className="font-display text-2xl font-semibold mb-6">{title}</h1>
        {children}
      </div>
    </div>
  );
}
