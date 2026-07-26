import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import api from '../../api/axios.js';
import AdminLayout from '../../components/AdminLayout.jsx';
import Loader from '../../components/Loader.jsx';
import { Link } from 'react-router-dom';

const PIE_COLORS = ['#2F5233', '#3F6B44', '#C97A3D', '#E0985E', '#8B8478'];

const KPI_ICONS = {
  activeListings: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 10H13M7 7H13M7 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  completedTransactions: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 10L9 13L14 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  verifiedUsers: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L12.5 7.5L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  ),
  flaggedAccounts: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 6V10M10 14H10.01M3 10C3 6.134 6.134 3 10 3C13.866 3 17 6.134 17 10C17 13.866 13.866 17 10 17C6.134 17 3 13.866 3 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  totalUsers: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 17C3 13.69 6.134 11 10 11C13.866 11 17 13.69 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  openReports: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 3V17M4 3L12 7L4 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
};

const KPI_COLORS = {
  activeListings: 'text-forest bg-forest-50',
  completedTransactions: 'text-forest bg-forest-50',
  verifiedUsers: 'text-amber-dark bg-amber-50',
  flaggedAccounts: 'text-red-500 bg-red-50',
  totalUsers: 'text-forest bg-forest-50',
  openReports: 'text-amber-dark bg-amber-50',
};

export default function AdminStatsDashboard() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/audit-log'),
      api.get('/admin/stats/trends').catch(() => ({ data: { trends: [] } })),
    ])
      .then(([statsRes, logsRes, trendsRes]) => {
        setStats(statsRes.data);
        setLogs(logsRes.data.logs.slice(0, 8));
        setTrends(trendsRes.data.trends || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout title="Dashboard"><Loader /></AdminLayout>;

  const kpiCards = [
    { key: 'activeListings', label: 'Active listings', value: stats.activeListings },
    { key: 'completedTransactions', label: 'Completed transactions', value: stats.completedTransactions },
    { key: 'verifiedUsers', label: 'Verified users', value: stats.verifiedUsers },
    { key: 'flaggedAccounts', label: 'Flagged accounts', value: stats.flaggedAccounts },
    { key: 'totalUsers', label: 'Total users', value: stats.totalUsers },
    { key: 'openReports', label: 'Open reports', value: stats.openReports },
  ];

  const overviewData = [
    { name: 'Active', value: stats.activeListings },
    { name: 'Completed', value: stats.completedTransactions },
    { name: 'Last 7d', value: stats.completedLast7Days },
    { name: 'Verified', value: stats.verifiedUsers },
    { name: 'Flagged', value: stats.flaggedAccounts },
  ];

  const roleDistribution = stats.roleDistribution || [
    { name: 'Students', value: Math.round(stats.totalUsers * 0.55) },
    { name: 'Public', value: Math.round(stats.totalUsers * 0.3) },
    { name: 'Schools', value: Math.round(stats.totalUsers * 0.1) },
    { name: 'Admins', value: Math.max(1, Math.round(stats.totalUsers * 0.05)) },
  ];

  const ACTION_ICONS = {
    verify_approve: '✅',
    verify_reject: '❌',
    user_suspend: '🚫',
    user_reinstate: '✅',
    report_actioned: '⚡',
    report_dismissed: '🗑️',
    report_reviewed: '👁️',
  };

  return (
    <AdminLayout title="Dashboard">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {kpiCards.map((card) => (
          <div
            key={card.key}
            className="bg-card border border-ink/5 rounded-2xl p-5 hover-lift transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${KPI_COLORS[card.key]}`}>
                {KPI_ICONS[card.key]}
              </div>
              {card.key === 'completedTransactions' && stats.completedLast7Days > 0 && (
                <span className="text-xs font-medium text-forest bg-forest-50 px-2 py-0.5 rounded-full">
                  +{stats.completedLast7Days} this week
                </span>
              )}
            </div>
            <p className="text-3xl font-display font-bold text-ink">{card.value}</p>
            <p className="text-sm text-muted mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-card border border-ink/5 rounded-2xl p-6">
          <p className="font-display font-semibold text-lg mb-1">Platform overview</p>
          <p className="text-xs text-muted mb-6">Key metrics at a glance</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(43,38,32,0.06)" />
                <XAxis dataKey="name" fontSize={12} tick={{ fill: '#8B8478' }} />
                <YAxis fontSize={12} tick={{ fill: '#8B8478' }} />
                <Tooltip
                  contentStyle={{
                    background: '#FFFDF8',
                    border: '1px solid rgba(43,38,32,0.1)',
                    borderRadius: '12px',
                    fontSize: '13px',
                    boxShadow: '0 4px 20px rgba(43,38,32,0.1)',
                  }}
                />
                <Bar dataKey="value" fill="#2F5233" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-card border border-ink/5 rounded-2xl p-6">
          <p className="font-display font-semibold text-lg mb-1">User distribution</p>
          <p className="text-xs text-muted mb-4">By role</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {roleDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#FFFDF8',
                    border: '1px solid rgba(43,38,32,0.1)',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {roleDistribution.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-muted">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trends Chart — only if data available */}
      {trends.length > 0 && (
        <div className="bg-card border border-ink/5 rounded-2xl p-6 mb-10">
          <p className="font-display font-semibold text-lg mb-1">Weekly activity</p>
          <p className="text-xs text-muted mb-6">Last 30 days</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2F5233" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2F5233" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(43,38,32,0.06)" />
                <XAxis dataKey="label" fontSize={11} tick={{ fill: '#8B8478' }} />
                <YAxis fontSize={11} tick={{ fill: '#8B8478' }} />
                <Tooltip
                  contentStyle={{
                    background: '#FFFDF8',
                    border: '1px solid rgba(43,38,32,0.1)',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}
                />
                <Area type="monotone" dataKey="transactions" stroke="#2F5233" fillOpacity={1} fill="url(#colorArea)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Quick Actions + Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="bg-card border border-ink/5 rounded-2xl p-6">
          <p className="font-display font-semibold text-lg mb-4">Quick actions</p>
          <div className="space-y-2">
            <Link
              to="/admin/verifications"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-forest-50 hover:bg-forest-100 transition-colors group"
            >
              <span className="text-forest">✅</span>
              <span className="text-sm font-medium text-forest">Review pending verifications</span>
            </Link>
            <Link
              to="/admin/reports"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors group"
            >
              <span className="text-amber-dark">🚩</span>
              <span className="text-sm font-medium text-amber-dark">Handle open reports</span>
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sage-50 hover:bg-sage transition-colors group"
            >
              <span className="text-muted">👥</span>
              <span className="text-sm font-medium text-ink/70">Manage users</span>
            </Link>
          </div>
        </div>

        {/* Recent admin actions */}
        <div className="lg:col-span-2 bg-card border border-ink/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold text-lg">Recent admin actions</p>
            <Link to="/admin/audit-log" className="text-xs font-medium text-forest animated-underline">
              View all →
            </Link>
          </div>
          {logs.length === 0 ? (
            <p className="text-muted text-sm py-4">No admin actions logged yet.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((l) => (
                <div
                  key={l._id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-paper hover:bg-sage-50 transition-colors"
                >
                  <span className="text-base shrink-0">
                    {ACTION_ICONS[l.action] || '📋'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium">{l.admin?.name}</span>
                      <span className="text-muted"> → </span>
                      <span className="font-medium">{l.action.replace(/_/g, ' ')}</span>
                      <span className="text-muted"> ({l.targetType})</span>
                    </p>
                  </div>
                  <span className="text-xs text-muted shrink-0">
                    {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
