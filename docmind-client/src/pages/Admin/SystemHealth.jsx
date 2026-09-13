import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Loader, RefreshCw, Server, Database, Cpu, HardDrive, Users, AlertTriangle, Send } from 'lucide-react';

const fmtBytes = (b) => {
  if (!b) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), units.length - 1);
  return `${(b / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

const fmtUptime = (s) => {
  if (!s && s !== 0) return '-';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m ${sec}s`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
};

const AdminSystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const { handleError, handleSuccess } = useErrorHandler();

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/system/health');
      setHealth(res.data.health || null);
    } catch (err) {
      handleError(err, 'Failed to load health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const sendTest = async (e) => {
    e.preventDefault();
    if (!testEmail.trim()) return;
    setSending(true);
    try {
      const res = await api.post('/admin/test-email', { to: testEmail.trim() });
      handleSuccess(res.data.message || 'Test email sent');
      setTestEmail('');
    } catch (err) {
      handleError(err, 'Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  if (loading && !health) {
    return <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-purple-600" /></div>;
  }

  if (!health) {
    return (
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">System Health</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">Could not fetch system health.</p>
          <p className="text-sm text-gray-500 mt-1">The backend may need to be restarted.</p>
          <button onClick={fetchHealth} className="btn-primary mt-4">Retry</button>
        </div>
      </div>
    );
  }

  const server = health.server || {};
  const memory = health.memory || { process: {}, system: {} };
  const database = health.database || {};
  const metrics = health.metrics || {};
  const procMem = memory.process || {};
  const sysMem = memory.system || {};
  const memUsedPct = sysMem.total ? (sysMem.used / sysMem.total) * 100 : 0;

  return (
    <div className="max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Health</h1>
        <button onClick={fetchHealth} disabled={loading} className="btn-primary flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {metrics.recentErrors > 0 && (
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-center gap-2 text-orange-700 dark:text-orange-300">
          <AlertTriangle className="h-5 w-5" />
          <span>{metrics.recentErrors} error(s) in the last hour</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card icon={<Server />} title="Server">
          <Row label="Uptime" value={fmtUptime(server.uptime)} />
          <Row label="Node Version" value={server.nodeVersion || '-'} />
          <Row label="Platform" value={server.platform ? `${server.platform} (${server.arch})` : '-'} />
          <Row label="Hostname" value={server.hostname || '-'} />
          <Row label="CPU Cores" value={server.cpuCount || '-'} />
          <Row label="Load Average" value={(server.loadAvg || []).map((n) => n.toFixed(2)).join(' / ') || '-'} />
        </Card>

        <Card icon={<Database />} title="Database">
          <Row label="Status" value={
            <span className={`inline-flex items-center gap-1 ${database.state === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
              <span className={`h-2 w-2 rounded-full ${database.state === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
              {database.state || 'unknown'}
            </span>
          } />
          <Row label="Collections" value={database.collections ?? 0} />
          <Row label="Documents" value={(database.objects ?? 0).toLocaleString()} />
          <Row label="Data Size" value={fmtBytes(database.dataSize)} />
          <Row label="Storage Size" value={fmtBytes(database.storageSize)} />
          <Row label="Indexes" value={database.indexes ?? 0} />
        </Card>

        <Card icon={<Cpu />} title="Process Memory">
          <Row label="RSS" value={fmtBytes(procMem.rss)} />
          <Row label="Heap Total" value={fmtBytes(procMem.heapTotal)} />
          <Row label="Heap Used" value={fmtBytes(procMem.heapUsed)} />
          <Row label="External" value={fmtBytes(procMem.external)} />
        </Card>

        <Card icon={<HardDrive />} title="System Memory">
          <Row label="Total" value={fmtBytes(sysMem.total)} />
          <Row label="Used" value={fmtBytes(sysMem.used)} />
          <Row label="Free" value={fmtBytes(sysMem.free)} />
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Usage</span>
              <span>{memUsedPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full transition-all ${memUsedPct > 85 ? 'bg-red-500' : memUsedPct > 65 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${memUsedPct}%` }} />
            </div>
          </div>
        </Card>

        <Card icon={<Users />} title="Live Metrics">
          <Row label="Active Sessions" value={metrics.activeSessions ?? 0} />
          <Row label="Uploads (1h)" value={metrics.recentUploads ?? 0} />
          <Row label="Errors (1h)" value={<span className={metrics.recentErrors > 0 ? 'text-red-600' : 'text-green-600'}>{metrics.recentErrors ?? 0}</span>} />
        </Card>

        <Card icon={<Send />} title="Email Configuration Test">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Send a test email via Resend to verify your configuration.</p>
          <form onSubmit={sendTest} className="flex gap-2">
            <input type="email" placeholder="you@example.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="input-custom flex-1" required />
            <button type="submit" disabled={sending} className="btn-primary flex items-center gap-2">
              {sending ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          </form>
        </Card>
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Auto-refreshes every 15s - Last updated: {health.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '-'}
      </p>
    </div>
  );
};

const Card = ({ icon, title, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-5">
    <div className="flex items-center gap-2 mb-4">
      <div className="text-purple-600">{icon}</div>
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-gray-900 dark:text-white font-medium">{value}</span>
  </div>
);

export default AdminSystemHealth;
