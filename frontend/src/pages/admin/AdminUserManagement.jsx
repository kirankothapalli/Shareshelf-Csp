import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios.js';
import AdminLayout from '../../components/AdminLayout.jsx';
import Loader from '../../components/Loader.jsx';
import VerifiedBadge from '../../components/VerifiedBadge.jsx';

const ROLES = ['', 'student', 'school', 'admin'];
const VERIF_STATUSES = ['', 'unverified', 'pending', 'approved', 'rejected'];

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verifFilter, setVerifFilter] = useState('');
  const [suspFilter, setSuspFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [reasonDraft, setReasonDraft] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [detailModal, setDetailModal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    if (suspFilter) params.suspended = suspFilter;
    api.get('/admin/users', { params })
      .then((res) => {
        let list = res.data.users;
        if (verifFilter) {
          list = list.filter((u) => u.verification?.status === verifFilter);
        }
        setUsers(list);
      })
      .finally(() => setLoading(false));
  }, [search, roleFilter, verifFilter, suspFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

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

  async function bulkSuspend(suspend) {
    if (selectedIds.size === 0) return;
    const promises = [...selectedIds].map((id) =>
      api.patch(`/admin/users/${id}/suspend`, { suspend, reason: 'Bulk action' }).catch(() => null)
    );
    await Promise.all(promises);
    setSelectedIds(new Set());
    load();
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function openDetail(user) {
    setDetailModal(user);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${user._id}/detail`);
      setDetailModal((prev) => ({ ...prev, ...data.user }));
    } catch {
      // If endpoint doesn't exist yet, we still show what we have
    } finally {
      setDetailLoading(false);
    }
  }

  function downloadCSV() {
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Verification', 'Rating', 'Suspended', 'Joined'];
    const rows = users.map((u) => [
      u.name,
      u.email || '',
      u.phone || '',
      u.role,
      u.verification?.status || '',
      `${(u.rating?.avg || 0).toFixed(1)} (${u.rating?.count || 0})`,
      u.isSuspended ? 'Yes' : 'No',
      new Date(u.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shareshelf-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const ROLE_BADGES = {
    student: 'bg-forest-50 text-forest',
    school: 'bg-sage-50 text-ink/70',
    admin: 'bg-ink/5 text-ink',
  };

  return (
    <AdminLayout title="User management">
      {/* Filters */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <input
          placeholder="Search name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="lg:col-span-2 border border-ink/10 rounded-xl px-3 py-2.5 text-sm bg-card focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-ink/10 rounded-xl px-3 py-2.5 text-sm bg-card"
        >
          <option value="">All roles</option>
          {ROLES.filter(Boolean).map((r) => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        <select
          value={verifFilter}
          onChange={(e) => setVerifFilter(e.target.value)}
          className="border border-ink/10 rounded-xl px-3 py-2.5 text-sm bg-card"
        >
          <option value="">Any verification</option>
          {VERIF_STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          value={suspFilter}
          onChange={(e) => setSuspFilter(e.target.value)}
          className="border border-ink/10 rounded-xl px-3 py-2.5 text-sm bg-card"
        >
          <option value="">All statuses</option>
          <option value="false">Active</option>
          <option value="true">Suspended</option>
        </select>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <>
              <span className="text-xs text-muted font-medium">{selectedIds.size} selected</span>
              <button
                onClick={() => bulkSuspend(true)}
                className="text-xs font-medium text-red-500 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50 transition"
              >
                Suspend selected
              </button>
              <button
                onClick={() => bulkSuspend(false)}
                className="text-xs font-medium text-forest border border-forest-100 px-3 py-1.5 rounded-full hover:bg-forest-50 transition"
              >
                Reinstate selected
              </button>
            </>
          )}
        </div>
        <button
          onClick={downloadCSV}
          className="text-xs font-medium text-muted border border-ink/10 px-3 py-1.5 rounded-full hover:bg-sage-50 transition inline-flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2V9M7 9L4 6M7 9L10 6M2 12H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export CSV
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-muted font-medium">No users match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u._id}
              className={`border rounded-2xl p-4 bg-card transition-all ${
                selectedIds.has(u._id) ? 'border-forest/30 shadow-glow-forest' : 'border-ink/5 hover:border-ink/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(u._id)}
                  onChange={() => toggleSelect(u._id)}
                  className="mt-1.5 w-4 h-4 rounded border-ink/30 accent-forest shrink-0"
                />

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => openDetail(u)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{u.name}</p>
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${ROLE_BADGES[u.role] || 'bg-ink/5 text-ink'}`}>
                          {u.role}
                        </span>
                      </div>
                      <p className="text-sm text-muted">{u.email || u.phone}</p>
                      <p className="text-xs text-muted mt-0.5">
                        Rating: {(u.rating?.avg || 0).toFixed(1)} ({u.rating?.count || 0}) · Joined {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <VerifiedBadge status={u.verification?.status} role={u.role} />
                      {u.isSuspended && (
                        <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1 justify-end">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          Suspended
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="ml-7 mt-3">
                {!u.isSuspended ? (
                  <div className="flex gap-2 items-center">
                    <input
                      placeholder="Suspension reason"
                      value={reasonDraft[u._id] || ''}
                      onChange={(e) => setReasonDraft((d) => ({ ...d, [u._id]: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 border border-ink/10 rounded-xl px-3 py-1.5 text-sm bg-paper focus:ring-2 focus:ring-forest/20 transition-all"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSuspend(u); }}
                      className="border border-red-200 text-red-500 text-sm font-medium px-4 py-1.5 rounded-full hover:bg-red-50 transition shrink-0"
                    >
                      Suspend
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {u.suspensionReason && (
                      <p className="text-xs text-muted italic flex-1">Reason: {u.suspensionReason}</p>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSuspend(u); }}
                      className="bg-forest text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-forest-dark transition shrink-0"
                    >
                      Reinstate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Detail Modal */}
      {detailModal && (
        <div
          className="fixed inset-0 z-[60] modal-overlay flex items-center justify-center p-4"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-elevated-lg max-w-lg w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-ink/5 flex items-start justify-between">
              <div>
                <h3 className="font-display font-semibold text-xl">{detailModal.name}</h3>
                <p className="text-sm text-muted">{detailModal.email || detailModal.phone}</p>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="w-8 h-8 rounded-lg hover:bg-sage/50 flex items-center justify-center transition"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {detailLoading && <Loader />}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-paper rounded-xl p-3">
                  <p className="text-xs text-muted mb-1">Role</p>
                  <p className="font-medium text-sm capitalize">{detailModal.role}</p>
                </div>
                <div className="bg-paper rounded-xl p-3">
                  <p className="text-xs text-muted mb-1">Verification</p>
                  <p className="font-medium text-sm capitalize">{detailModal.verification?.status || 'N/A'}</p>
                </div>
                <div className="bg-paper rounded-xl p-3">
                  <p className="text-xs text-muted mb-1">Rating</p>
                  <p className="font-medium text-sm">{(detailModal.rating?.avg || 0).toFixed(1)} ({detailModal.rating?.count || 0})</p>
                </div>
                <div className="bg-paper rounded-xl p-3">
                  <p className="text-xs text-muted mb-1">Status</p>
                  <p className={`font-medium text-sm ${detailModal.isSuspended ? 'text-red-500' : 'text-forest'}`}>
                    {detailModal.isSuspended ? 'Suspended' : 'Active'}
                  </p>
                </div>
              </div>

              {detailModal.listingCount !== undefined && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-paper rounded-xl p-3">
                    <p className="text-xs text-muted mb-1">Listings</p>
                    <p className="font-medium text-sm">{detailModal.listingCount || 0}</p>
                  </div>
                  <div className="bg-paper rounded-xl p-3">
                    <p className="text-xs text-muted mb-1">Transactions</p>
                    <p className="font-medium text-sm">{detailModal.transactionCount || 0}</p>
                  </div>
                </div>
              )}

              <div className="bg-paper rounded-xl p-3">
                <p className="text-xs text-muted mb-1">Joined</p>
                <p className="font-medium text-sm">{new Date(detailModal.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
