import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import AdminLayout from '../../components/AdminLayout.jsx';
import Loader from '../../components/Loader.jsx';

const STATUS_FILTERS = ['open', 'reviewed', 'actioned', 'dismissed'];

export default function AdminReportsQueue() {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState({});

  function load() {
    setLoading(true);
    api.get('/admin/reports', { params: { status } }).then((res) => setReports(res.data.reports)).finally(() => setLoading(false));
  }

  useEffect(load, [status]);

  async function updateStatus(reportId, newStatus) {
    try {
      await api.patch(`/admin/reports/${reportId}`, { status: newStatus, adminNote: noteDraft[reportId] || '' });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  }

  return (
    <AdminLayout title="Reports queue">
      <div className="flex gap-2 mb-6">
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`text-sm font-medium px-3 py-1.5 rounded-full ${status === s ? 'bg-forest text-white' : 'bg-sage/50'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : reports.length === 0 ? (
        <p className="text-muted">No {status} reports.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r._id} className="border border-ink/10 rounded-xl p-4 bg-card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{r.targetType} report</p>
                  <p className="text-sm text-muted">Target ID: {r.targetId}</p>
                  <p className="text-sm text-muted">Reported by: {r.reportedBy?.name}</p>
                </div>
                <span className="text-xs bg-ink/5 px-2 py-1 rounded-full">{r.status}</span>
              </div>
              <p className="text-sm mb-3">"{r.reason}"</p>
              {status === 'open' && (
                <>
                  <input
                    placeholder="Admin note…"
                    value={noteDraft[r._id] || ''}
                    onChange={(e) => setNoteDraft((d) => ({ ...d, [r._id]: e.target.value }))}
                    className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm mb-3"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(r._id, 'actioned')} className="bg-red-500 text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-red-600">
                      Action (suspend/remove)
                    </button>
                    <button onClick={() => updateStatus(r._id, 'dismissed')} className="border border-ink/20 text-sm font-medium px-4 py-1.5 rounded-full hover:bg-sage/50">
                      Dismiss
                    </button>
                    <button onClick={() => updateStatus(r._id, 'reviewed')} className="text-sm font-medium px-4 py-1.5 rounded-full hover:bg-sage/50">
                      Mark reviewed
                    </button>
                  </div>
                </>
              )}
              {r.adminNote && <p className="text-xs text-muted mt-2 italic">Note: {r.adminNote}</p>}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
