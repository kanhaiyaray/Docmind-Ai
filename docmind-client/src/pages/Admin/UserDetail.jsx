import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import {
  Loader, ArrowLeft, Mail, Shield, HardDrive,
  FileText, MessageSquare, Activity as ActivityIcon,
  LogOut, UserCheck, UserX, KeyRound,
} from 'lucide-react';

const fmtBytes = (b) => {
  if (!b) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), units.length - 1);
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');

const AdminUserDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { handleError, handleSuccess } = useErrorHandler();

  useEffect(() => { fetchUser(); }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const [userRes, activityRes] = await Promise.all([
        api.get(`/admin/users/${id}`),
        api.get(`/admin/users/${id}/activity?limit=25`),
      ]);
      setUser(userRes.data.user);
      setActivity(activityRes.data.logs || []);
    } catch (err) {
      handleError(err, 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async () => {
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${id}`, { isActive: !user.isActive });
      handleSuccess(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUser();
    } catch (err) { handleError(err, 'Update failed'); }
    finally { setActionLoading(false); }
  };

  const changeRole = async (role) => {
    if (!window.confirm(`Change role to "${role}"?`)) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${id}`, { role });
      handleSuccess('Role updated');
      fetchUser();
    } catch (err) { handleError(err, 'Update failed'); }
    finally { setActionLoading(false); }
  };

  const forceLogout = async () => {
    if (!window.confirm('Revoke ALL sessions for this user?')) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/users/${id}/force-logout`);
      handleSuccess(`Revoked ${res.data.revoked} session(s)`);
      fetchUser();
    } catch (err) { handleError(err, 'Force logout failed'); }
    finally { setActionLoading(false); }
  };

  const verifyEmail = async () => {
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${id}`, { isEmailVerified: true });
      handleSuccess('Email marked as verified');
      fetchUser();
    } catch (err) { handleError(err, 'Update failed'); }
    finally { setActionLoading(false); }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-purple-600" /></div>;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <Link to="/admin/users" className="text-purple-600 hover:underline mt-2 inline-block">Back to users</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <Link to="/admin/users" className="inline-flex items-center text-sm text-gray-500 hover:text-purple-600 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Users
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center text-2xl font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Mail size={14} /> {user.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{user.role}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.isActive ? 'Active' : 'Inactive'}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.isEmailVerified ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{user.isEmailVerified ? 'Email Verified' : 'Email Unverified'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={toggleActive} disabled={actionLoading} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${user.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} disabled:opacity-50`}>
              {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
            {!user.isEmailVerified && (
              <button onClick={verifyEmail} disabled={actionLoading} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50">
                <KeyRound size={14} /> Verify Email
              </button>
            )}
            <button onClick={forceLogout} disabled={actionLoading} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50">
              <LogOut size={14} /> Force Logout
            </button>
            {user.role === 'user' ? (
              <button onClick={() => changeRole('admin')} disabled={actionLoading} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50">
                <Shield size={14} /> Promote to Admin
              </button>
            ) : (
              <button onClick={() => changeRole('user')} disabled={actionLoading} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50">
                <Shield size={14} /> Demote to User
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatTile icon={<FileText />} label="Documents" value={user.docCount || 0} />
        <StatTile icon={<MessageSquare />} label="Conversations" value={user.convCount || 0} />
        <StatTile icon={<HardDrive />} label="Storage" value={fmtBytes(user.storageUsed)} />
        <StatTile icon={<KeyRound />} label="Active Sessions" value={user.sessionCount || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Account Info</h3>
          <dl className="space-y-3 text-sm">
            <InfoRow label="User ID" value={<code className="text-xs">{user._id}</code>} />
            <InfoRow label="Chunks" value={user.chunkCount || 0} />
            <InfoRow label="Last Login" value={fmtDate(user.lastLogin)} />
            <InfoRow label="Created" value={fmtDate(user.createdAt)} />
            <InfoRow label="Updated" value={fmtDate(user.updatedAt)} />
            <InfoRow label="Failed Logins" value={user.failedLoginAttempts || 0} />
          </dl>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Documents</h3>
          {user.recentDocs?.length > 0 ? (
            <ul className="space-y-2">
              {user.recentDocs.map((d) => (
                <li key={d._id} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
                  <span className="truncate text-gray-700 dark:text-gray-300">{d.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${d.status === 'completed' ? 'bg-green-100 text-green-700' : d.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-400">No documents yet</p>}
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ActivityIcon className="h-4 w-4" /> Recent Activity
        </h3>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-400">No activity recorded</p>
        ) : (
          <ul className="space-y-3">
            {activity.map((a) => (
              <li key={a._id} className="flex items-start gap-3 text-sm">
                <div className="mt-1 h-2 w-2 rounded-full bg-purple-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{a.action}</span>
                    {a.details && <span className="text-gray-500 dark:text-gray-400 ml-1">{JSON.stringify(a.details).slice(0, 100)}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtDate(a.timestamp)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const StatTile = ({ icon, label, value }) => (
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

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between">
    <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
    <dd className="text-gray-900 dark:text-white text-right">{value}</dd>
  </div>
);

export default AdminUserDetail;
