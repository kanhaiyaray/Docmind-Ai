import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Loader, Users, FileText, MessageSquare, Activity } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      setStats(res.data.stats);
    } catch (err) {
      handleError(err, 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-purple-600" /></div>;
  }
  if (!stats) return <div className="text-center py-12 text-gray-500">No stats available</div>;

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Users className="h-6 w-6 text-blue-500" />} label="Total Users" value={stats.totalUsers} />
        <StatCard icon={<FileText className="h-6 w-6 text-green-500" />} label="Documents" value={stats.totalDocuments} />
        <StatCard icon={<MessageSquare className="h-6 w-6 text-purple-500" />} label="Conversations" value={stats.totalConversations} />
        <StatCard icon={<Activity className="h-6 w-6 text-orange-500" />} label="Active Today" value={stats.activeToday} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Storage & Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Storage Used</span><span className="font-medium text-gray-900 dark:text-white">{formatBytes(stats.storageUsed)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Total Chunks</span><span className="font-medium text-gray-900 dark:text-white">{stats.totalChunks}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Processing</span><span className="font-medium text-yellow-600">{stats.processingDocs}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Failed</span><span className="font-medium text-red-600">{stats.failedDocs}</span></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Users</h3>
          {stats.topUsers && stats.topUsers.length > 0 ? (
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
        {stats.last7DaysActivity && stats.last7DaysActivity.length > 0 ? (
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
