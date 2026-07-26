import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios.js';
import AdminLayout from '../../components/AdminLayout.jsx';
import Loader from '../../components/Loader.jsx';

const STATUS_FILTERS = ['open', 'reviewed', 'actioned', 'dismissed'];

const STATUS_STYLES = {
  open: 'bg-red-50 text-red-600 border-red-200',
  reviewed: 'bg-amber-50 text-amber-dark border-amber-100',
  actioned: 'bg-forest-50 text-forest border-forest-100',
  dismissed: 'bg-ink/5 text-muted border-ink/10',
};

export default function AdminReportsQueue() {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/reports', { params: { status } })
      .then((res) => setReports(res.data.reports))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    load();
    setSelectedIds(new Set());
  }, [load]);

  async function updateStatus(reportId, newStatus) {
    try {
      await api.patch(`/admin/reports/${reportId}`, {
        status: newStatus,
        adminNote: noteDraft[reportId] || '',
      });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  }

  async function bulkUpdate(newStatus) {
    if (selectedIds.size === 0) return;
    const promises = [...selectedIds].map((id) =>
      api.patch(`/admin/reports/${id}`, { status: newStatus, adminNote: 'Bulk action' }).catch(() => null)
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

  return (
    <AdminLayout title="Reports queue">
      {/* Status tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`text-sm font-medium px-4 py-2 rounded-full capitalize transition-all ${
              status === s
                ? 'bg-forest text-white shadow-glow-forest'
                : 'bg-card border border-ink/5 hover:border-ink/15'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && status === 'open' && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-card border border-ink/5 rounded-xl">
          <span className="text-xs text-muted font-medium">{selectedIds.size} selected</span>
          <button
            onClick={() => bulkUpdate('actioned')}
            className="text-xs font-medium text-red-500 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50 transition"
          >
            Action all
          </button>
          <button
            onClick={() => bulkUpdate('dismissed')}
            className="text-xs font-medium text-muted border border-ink/10 px-3 py-1.5 rounded-full hover:bg-sage-50 transition"
          >
            Dismiss all
          </button>
        </div>
      )}

      {loading ? (
        <Loader />
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">{status === 'open' ? '🎉' : '📋'}</p>
          <p className="text-muted font-medium">No {status} reports.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div
              key={r._id}
              className={`border rounded-2xl p-5 bg-card transition-all ${
                selectedIds.has(r._id) ? 'border-forest/30 shadow-glow-forest' : 'border-ink/5 hover:border-ink/10'
              }`}
            >
              <div className="flex items-start gap-3">
                {status === 'open' && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r._id)}
                    onChange={() => toggleSelect(r._id)}
                    className="mt-1 w-4 h-4 rounded border-ink/30 accent-forest shrink-0"
                  />
                )}

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold capitalize">{r.targetType} report</p>
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLES[r.status]}`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted">
                        Target: <span className="font-mono text-xs">{r.targetId}</span>
                      </p>
                      <p className="text-sm text-muted">
                        By: {r.reportedBy?.name || 'Unknown'} · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>

                  <div className="bg-paper rounded-xl px-4 py-3 mb-4 border-l-3 border-l-amber">
                    <p className="text-sm text-ink/80 italic">"{r.reason}"</p>
                  </div>

                  {status === 'open' && (
                    <>
                      <input
                        placeholder="Admin note…"
                        value={noteDraft[r._id] || ''}
                        onChange={(e) => setNoteDraft((d) => ({ ...d, [r._id]: e.target.value }))}
                        className="w-full border border-ink/10 rounded-xl px-3 py-2 text-sm bg-paper mb-3 focus:ring-2 focus:ring-forest/20 transition-all"
                      />
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => updateStatus(r._id, 'actioned')}
                          className="bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-red-600 transition"
                        >
                          ⚡ Action
                        </button>
                        <button
                          onClick={() => updateStatus(r._id, 'dismissed')}
                          className="border border-ink/10 text-sm font-medium px-4 py-2 rounded-full hover:bg-sage-50 transition"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => updateStatus(r._id, 'reviewed')}
                          className="text-sm font-medium px-4 py-2 rounded-full hover:bg-sage-50 transition text-muted"
                        >
                          Mark reviewed
                        </button>
                      </div>
                    </>
                  )}

                  {r.adminNote && (
                    <div className="mt-3 flex items-start gap-2">
                      <span className="text-xs text-muted">📝</span>
                      <p className="text-xs text-muted italic">Note: {r.adminNote}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
