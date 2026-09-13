import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Loader, TrendingUp, FileText, Users, MessageSquare, Zap, Sparkles, GitCompare, BookOpen } from 'lucide-react';

const fmtBytes = (b) => {
  if (!b) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), u.length - 1);
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
};

const fmtDate = (s) => {
  try { return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return ''; }
};

const Chart = ({ data, stroke = '#3b82f6', gradId, label }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">No data for this period</p>;
  }
  const max = Math.max(1, ...data.map((d) => d?.count || 0));
  const points = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * 100;
    const y = 100 - ((d?.count || 0) / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{label} - max: {max}</p>
      <div className="relative h-40">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline points={`0,100 ${points} 100,100`} fill={`url(#${gradId})`} stroke="none" />
          <polyline points={points} fill="none" stroke={stroke} strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{fmtDate(data[0]?._id)}</span>
        <span>{fmtDate(data[data.length - 1]?._id)}</span>
      </div>
    </div>
  );
};

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/analytics', { params: { range } });
        setAnalytics(res.data.analytics || null);
      } catch (err) {
        handleError(err, 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, [range]);

  if (loading && !analytics) {
    return <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-purple-600" /></div>;
  }

  if (!analytics) {
    return <div className="text-center py-12 text-gray-500">No analytics data available.</div>;
  }

  const statusBreakdown = Array.isArray(analytics.statusBreakdown) ? analytics.statusBreakdown : [];
  const storageByUser = Array.isArray(analytics.storageByUser) ? analytics.storageByUser : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[7, 30, 90].map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                range === r ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}>{r}d</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi icon={<Users />} label="Total Users" value={analytics.totalUsers ?? 0} />
        <Kpi icon={<FileText />} label="Total Documents" value={analytics.totalDocs ?? 0} />
        <Kpi icon={<TrendingUp />} label="Avg Docs / User" value={analytics.avgDocsPerUser ?? 0} />
        <Kpi icon={<Zap />} label={`Quizzes (${range}d)`} value={analytics.quizGenerations ?? 0} />
        <Kpi icon={<Sparkles />} label={`Flashcards (${range}d)`} value={analytics.flashcardGenerations ?? 0} />
        <Kpi icon={<GitCompare />} label="Comparisons" value={analytics.comparisonCount ?? 0} />
        <Kpi icon={<BookOpen />} label="Summaries" value={analytics.summaryCount ?? 0} />
        <Kpi icon={<MessageSquare />} label="Status Types" value={statusBreakdown.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Panel title={`User Registrations (last ${range} days)`}>
          <Chart data={analytics.userRegistrations} stroke="#3b82f6" gradId="grad-reg" label="New users / day" />
        </Panel>
        <Panel title={`Document Uploads (last ${range} days)`}>
          <Chart data={analytics.docUploads} stroke="#10b981" gradId="grad-doc" label="Uploads / day" />
        </Panel>
        <Panel title={`Conversation Starts (last ${range} days)`}>
          <Chart data={analytics.convStarts} stroke="#8b5cf6" gradId="grad-conv" label="New conversations / day" />
        </Panel>

        <Panel title="Document Status Breakdown">
          {statusBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map((s) => {
                const total = statusBreakdown.reduce((a, x) => a + (x.count || 0), 0);
                const pct = total ? ((s.count || 0) / total) * 100 : 0;
                const colors = { completed: 'bg-green-500', processing: 'bg-yellow-500', failed: 'bg-red-500' };
                return (
                  <div key={s._id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-700 dark:text-gray-300">{s._id}</span>
                      <span className="text-gray-500">{s.count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[s._id] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Top 10 Users by Storage">
        {storageByUser.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">Storage</th>
                </tr>
              </thead>
              <tbody>
                {storageByUser.map((u, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 text-gray-900 dark:text-white">{u?.user?.name || 'Unknown'}</td>
                    <td className="py-2 text-gray-500 dark:text-gray-400">{u?.user?.email || '-'}</td>
                    <td className="py-2 text-right text-gray-900 dark:text-white font-medium">{fmtBytes(u?.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};

const Kpi = ({ icon, label, value }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
    <div className="flex items-center gap-3">
      <div className="text-purple-600">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </div>
);

const Panel = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-5">
    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
    {children}
  </div>
);

export default AdminAnalytics;
