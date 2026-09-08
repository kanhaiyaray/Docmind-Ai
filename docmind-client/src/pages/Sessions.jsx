import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Monitor, Smartphone, Laptop, Tablet, Trash2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data.sessions);
    } catch (err) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (id) => {
    if (!window.confirm('Log out from this device?')) return;
    try {
      await api.delete(`/auth/sessions/${id}`);
      toast.success('Session revoked');
      fetchSessions();
    } catch (err) {
      toast.error('Failed to revoke session');
    }
  };

  const revokeOthers = async () => {
    if (!window.confirm('Log out from all other devices?')) return;
    try {
      await api.post('/auth/sessions/revoke-others');
      toast.success('All other sessions revoked');
      fetchSessions();
    } catch (err) {
      toast.error('Failed to revoke other sessions');
    }
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <Monitor />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile')) return <Smartphone />;
    if (ua.includes('tablet')) return <Tablet />;
    if (ua.includes('mac') || ua.includes('windows') || ua.includes('linux')) return <Laptop />;
    return <Monitor />;
  };

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active Sessions</h1>
        {sessions.length > 1 && (
          <button
            onClick={revokeOthers}
            className="btn-primary flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" /> Logout Others
          </button>
        )}
      </div>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-500">No active sessions</div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`glass-card p-4 flex items-center justify-between ${
                session.isCurrent ? 'border-purple-500 border-2' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {getDeviceIcon(session.deviceInfo?.userAgent)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {session.deviceInfo?.userAgent?.split(' ').slice(0, 3).join(' ') || 'Unknown Device'}
                    {session.isCurrent && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    IP: {session.deviceInfo?.ipAddress || 'N/A'} • Started: {new Date(session.createdAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    Expires: {new Date(session.expiresAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {!session.isCurrent && (
                <button
                  onClick={() => revokeSession(session.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sessions;