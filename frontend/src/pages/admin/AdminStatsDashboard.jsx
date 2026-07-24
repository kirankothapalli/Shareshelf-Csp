import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios.js';
import AdminLayout from '../../components/AdminLayout.jsx';
import Loader from '../../components/Loader.jsx';

export default function AdminStatsDashboard() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/audit-log')])
      .then(([statsRes, logsRes]) => {
        setStats(statsRes.data);
        setLogs(logsRes.data.logs);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout title="Stats dashboard"><Loader /></AdminLayout>;

  const cards = [
    ['Active listings', stats.activeListings],
    ['Completed transactions', stats.completedTransactions],
    ['Verified users', stats.verifiedUsers],
    ['Flagged / suspended accounts', stats.flaggedAccounts],
    ['Total users', stats.totalUsers],
    ['Open reports', stats.openReports],
  ];

  const chartData = [
    { name: 'Active', value: stats.activeListings },
    { name: 'Completed', value: stats.completedTransactions },
    { name: 'Last 7d', value: stats.completedLast7Days },
    { name: 'Verified', value: stats.verifiedUsers },
    { name: 'Flagged', value: stats.flaggedAccounts },
  ];

  return (
    <AdminLayout title="Stats dashboard">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {cards.map(([label, value]) => (
          <div key={label} className="border border-ink/10 rounded-xl p-4 bg-card">
            <p className="text-3xl font-display font-semibold text-forest">{value}</p>
            <p className="text-sm text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="border border-ink/10 rounded-xl p-4 bg-card mb-10 h-72">
        <p className="font-semibold mb-4">Platform overview</p>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2B262010" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Bar dataKey="value" fill="#2F5233" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="font-display text-xl font-semibold mb-4">Recent admin actions</h2>
      <div className="space-y-2">
        {logs.length === 0 && <p className="text-muted">No admin actions logged yet.</p>}
        {logs.map((l) => (
          <div key={l._id} className="text-sm border border-ink/10 rounded-lg px-3 py-2 bg-card flex justify-between">
            <span>{l.admin?.name} → <span className="font-medium">{l.action}</span> ({l.targetType})</span>
            <span className="text-muted text-xs">{new Date(l.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
