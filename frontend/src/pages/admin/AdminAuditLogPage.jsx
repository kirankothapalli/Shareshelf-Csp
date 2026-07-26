import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import AdminLayout from '../../components/AdminLayout.jsx';
import Loader from '../../components/Loader.jsx';

const ACTION_ICONS = {
  verify_approve: { icon: '✅', color: 'bg-forest-50 text-forest' },
  verify_reject: { icon: '❌', color: 'bg-red-50 text-red-500' },
  user_suspend: { icon: '🚫', color: 'bg-red-50 text-red-500' },
  user_reinstate: { icon: '✅', color: 'bg-forest-50 text-forest' },
  report_actioned: { icon: '⚡', color: 'bg-amber-50 text-amber-dark' },
  report_dismissed: { icon: '🗑️', color: 'bg-ink/5 text-muted' },
  report_reviewed: { icon: '👁️', color: 'bg-sage-50 text-ink/70' },
  doc_deleted: { icon: '🗑️', color: 'bg-red-50 text-red-500' },
  doc_viewed: { icon: '👁️', color: 'bg-sage-50 text-ink/70' },
};

const ACTION_TYPES = ['', 'verify_approve', 'verify_reject', 'user_suspend', 'user_reinstate', 'report_actioned', 'report_dismissed', 'report_reviewed'];

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/admin/audit-log')
      .then((res) => setLogs(res.data.logs))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (actionFilter && l.action !== actionFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const matchesAdmin = l.admin?.name?.toLowerCase().includes(term);
      const matchesAction = l.action?.toLowerCase().includes(term);
      const matchesReason = l.reason?.toLowerCase().includes(term);
      if (!matchesAdmin && !matchesAction && !matchesReason) return false;
    }
    return true;
  });

  return (
    <AdminLayout title="Audit log">
      {/* Filters */}
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <input
          placeholder="Search by admin name or action…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-ink/10 rounded-xl px-3 py-2.5 text-sm bg-card focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border border-ink/10 rounded-xl px-3 py-2.5 text-sm bg-card"
        >
          <option value="">All actions</option>
          {ACTION_TYPES.filter(Boolean).map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted mb-4">{filteredLogs.length} entries</p>

      {loading ? (
        <Loader />
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-muted font-medium">No matching audit log entries.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((l) => {
            const actionInfo = ACTION_ICONS[l.action] || { icon: '📋', color: 'bg-ink/5 text-muted' };
            const isExpanded = expandedId === l._id;

            return (
              <div
                key={l._id}
                className="border border-ink/5 rounded-xl bg-card hover:border-ink/10 transition-all overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : l._id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${actionInfo.color}`}>
                    {actionInfo.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium">{l.admin?.name || 'System'}</span>
                      <span className="text-muted"> performed </span>
                      <span className="font-medium">{l.action.replace(/_/g, ' ')}</span>
                      <span className="text-muted"> on {l.targetType}</span>
                    </p>
                  </div>
                  <span className="text-xs text-muted shrink-0">
                    {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={`shrink-0 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-ink/5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-paper rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-wide text-muted font-semibold mb-1">Target ID</p>
                        <p className="text-xs font-mono break-all">{l.targetId}</p>
                      </div>
                      <div className="bg-paper rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-wide text-muted font-semibold mb-1">Timestamp</p>
                        <p className="text-xs">{new Date(l.createdAt).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    {l.reason && (
                      <div className="bg-paper rounded-lg p-3 mt-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted font-semibold mb-1">Reason</p>
                        <p className="text-xs">{l.reason}</p>
                      </div>
                    )}
                    {l.metadata && Object.keys(l.metadata).length > 0 && (
                      <div className="bg-paper rounded-lg p-3 mt-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted font-semibold mb-1">Metadata</p>
                        <pre className="text-xs font-mono break-all whitespace-pre-wrap">{JSON.stringify(l.metadata, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
