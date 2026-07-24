import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import AdminLayout from '../../components/AdminLayout.jsx';
import Loader from '../../components/Loader.jsx';

export default function AdminVerificationQueue() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reasonDraft, setReasonDraft] = useState({});

  function load() {
    setLoading(true);
    api.get('/admin/verifications/pending').then((res) => setUsers(res.data.users)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function review(userId, decision) {
    try {
      await api.patch(`/admin/verify/${userId}`, { decision, reason: reasonDraft[userId] || '' });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  }

  return (
    <AdminLayout title="Pending verifications">
      {loading ? (
        <Loader />
      ) : users.length === 0 ? (
        <p className="text-muted">No pending verifications — nice and clear.</p>
      ) : (
        <div className="space-y-4">
          {users.map((u) => (
            <div key={u._id} className="border border-ink/10 rounded-xl p-4 bg-card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-muted">{u.email || u.phone} · {u.role}</p>
                </div>
                <span className="text-xs bg-amber/10 text-amber-dark px-2 py-1 rounded-full font-medium">
                  {u.verification.docType?.replace('_', ' ')}
                </span>
              </div>
              <input
                placeholder="Reason (required for rejection)"
                value={reasonDraft[u._id] || ''}
                onChange={(e) => setReasonDraft((d) => ({ ...d, [u._id]: e.target.value }))}
                className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm mb-3"
              />
              <div className="flex gap-2">
                <button onClick={() => review(u._id, 'approved')} className="bg-forest text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-forest-dark">
                  Approve
                </button>
                <button onClick={() => review(u._id, 'rejected')} className="border border-red-300 text-red-500 text-sm font-medium px-4 py-1.5 rounded-full hover:bg-red-50">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
