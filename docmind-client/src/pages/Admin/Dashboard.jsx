import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Loader, Users, FileText, MessageSquare, Activity, BarChart3, Zap, Sparkles } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.stats);
    } catch (err) {
      handleError(err, 'Failed to fetch stats');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data.analytics);
    } catch (err) {
      handleError(err, 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-purple-600" /></div>;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const maxVal = (data) => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map(item => item.count), 1);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Users className="h-6 w-6 text-blue-500" />} label="Total Users" value={stats?.totalUsers || 0} />
        <StatCard icon={<FileText className="h-6 w-6 text-green-500" />} label="Documents" value={stats?.totalDocuments || 0} />
        <StatCard icon={<MessageSquare className="h-6 w-6 text-purple-500" />} label="Conversations" value={stats?.totalConversations || 0} />
        <StatCard icon={<Activity className="h-6 w-6 text-orange-500" />} label="Active Today" value={stats?.activeToday || 0} />
      </div>

      {/* Advanced Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<BarChart3 className="h-6 w-6 text-indigo-500" />} label="Avg Docs / User" value={analytics?.avgDocsPerUser || 0} />
        <StatCard icon={<Zap className="h-6 w-6 text-yellow-500" />} label="Quiz Generations" value={analytics?.quizGenerations || 0} />
        <StatCard icon={<Sparkles className="h-6 w-6 text-pink-500" />} label="Flashcard Generations" value={analytics?.flashcardGenerations || 0} />
      </div>

      {/* Charts: Registrations & Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Daily Registrations (last 30 days)</h3>
          {analytics?.userRegistrations?.length > 0 ? (
            <div className="flex items-end gap-1 h-32">
              {analytics.userRegistrations.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(day.count / maxVal(analytics.userRegistrations)) * 100}%` }} />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(day._id)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 dark:text-gray-400 text-sm">No data</p>}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Daily Document Uploads (last 30 days)</h3>
          {analytics?.docUploads?.length > 0 ? (
            <div className="flex items-end gap-1 h-32">
              {analytics.docUploads.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-green-500 rounded-t" style={{ height: `${(day.count / maxVal(analytics.docUploads)) * 100}%` }} />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(day._id)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 dark:text-gray-400 text-sm">No data</p>}
        </div>
      </div>

      {/* Existing Stats (Storage, Top Users, 7-Day Activity) - keep as before */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Storage & Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Storage Used</span><span className="font-medium text-gray-900 dark:text-white">{stats?.storageUsed ? (stats.storageUsed / 1048576).toFixed(1) + ' MB' : '0 MB'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Total Chunks</span><span className="font-medium text-gray-900 dark:text-white">{stats?.totalChunks || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Processing</span><span className="font-medium text-yellow-600">{stats?.processingDocs || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Failed</span><span className="font-medium text-red-600">{stats?.failedDocs || 0}</span></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Users</h3>
          {stats?.topUsers && stats.topUsers.length > 0 ? (
            <ul className="space-y-2">
              {stats.topUsers.map((u, idx) => (
                <li key={idx} className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-1">
                  <span className="text-gray-700 dark:text-gray-300">{u.user?.name || 'Unknown'}</span>
                  <span className="text-gray-500 dark:text-gray-400">{u.count} docs</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-gray-500 dark:text-gray-400 text-sm">No users yet</p>}
        </div>
      </div>
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">7-Day Activity</h3>
        {stats?.last7DaysActivity && stats.last7DaysActivity.length > 0 ? (
          <div className="flex items-end gap-2 h-32">
            {stats.last7DaysActivity.map((day) => (
              <div key={day._id} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-purple-500 rounded-t" style={{ height: `${Math.max(4, (day.count / 10) * 100)}%` }} />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(day._id)}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-500 dark:text-gray-400 text-sm">No activity in the last 7 days</p>}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-3">
      {icon}
      <div><p className="text-sm text-gray-500 dark:text-gray-400">{label}</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p></div>
    </div>
  </div>
);

export default AdminDashboard;