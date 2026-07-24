import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import AdminLayout from '../../components/AdminLayout.jsx';
import Loader from '../../components/Loader.jsx';
import VerifiedBadge from '../../components/VerifiedBadge.jsx';

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [reasonDraft, setReasonDraft] = useState({});

  function load() {
    setLoading(true);
    api.get('/admin/users', { params: { search: search || undefined } }).then((res) => setUsers(res.data.users)).finally(() => setLoading(false));
  }

  useEffect(load, [search]);

  async function toggleSuspend(user) {
    try {
      await api.patch(`/admin/users/${user._id}/suspend`, {
        suspend: !user.isSuspended,
        reason: reasonDraft[user._id] || '',
      });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  }

  return (
    <AdminLayout title="User management">
      <input
        placeholder="Search by name, email, or phone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm mb-6"
      />

      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u._id} className="border border-ink/10 rounded-xl p-4 bg-card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-muted">{u.email || u.phone} · {u.role}</p>
                  <p className="text-xs text-muted mt-1">Rating: {(u.rating?.avg || 0).toFixed(1)} ({u.rating?.count || 0})</p>
                </div>
                <div className="text-right">
                  <VerifiedBadge status={u.verification?.status} role={u.role} />
                  {u.isSuspended && <p className="text-xs text-red-500 font-medium mt-1">Suspended</p>}
                </div>
              </div>

              {!u.isSuspended ? (
                <div className="flex gap-2 items-center">
                  <input
                    placeholder="Suspension reason"
                    value={reasonDraft[u._id] || ''}
                    onChange={(e) => setReasonDraft((d) => ({ ...d, [u._id]: e.target.value }))}
                    className="flex-1 border border-ink/20 rounded-lg px-3 py-1.5 text-sm"
                  />
                  <button onClick={() => toggleSuspend(u)} className="border border-red-300 text-red-500 text-sm font-medium px-4 py-1.5 rounded-full hover:bg-red-50 shrink-0">
                    Suspend
                  </button>
                </div>
              ) : (
                <button onClick={() => toggleSuspend(u)} className="bg-forest text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-forest-dark">
                  Reinstate
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
