import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Loader, Search } from 'lucide-react';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ action: '', userId: '' });
  const { handleError } = useErrorHandler();

  useEffect(() => { fetchLogs(); }, [page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 30, ...filters };
      Object.keys(params).forEach(k => params[k] === '' && delete params[k]);
      const res = await api.get('/admin/logs', { params });
      setLogs(res.data.logs);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      handleError(err, 'Failed to load logs');
    } finally { setLoading(false); }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  if (loading && logs.length === 0) {
    return <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Activity Logs</h1>
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="User ID" value={filters.userId} onChange={(e) => setFilters({ ...filters, userId: e.target.value })} className="input-custom pl-10" />
        </div>
        <input type="text" placeholder="Action" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} className="input-custom" />
        <button onClick={() => { setFilters({ action: '', userId: '' }); setPage(1); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">Clear</button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map((log) => (
              <tr key={log._id}>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{log.userId?.name || log.userId?.email || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{log.action}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{JSON.stringify(log.details).slice(0, 80)}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(log.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
