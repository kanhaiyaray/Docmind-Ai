import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Loader, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const { handleError, handleSuccess } = useErrorHandler();

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      setSettings(res.data.settings || []);
    } catch (err) {
      handleError(err, 'Failed to load settings');
    } finally { setLoading(false); }
  };

  const handleSave = async (key, value) => {
    try {
      await api.put(`/admin/settings/${key}`, { value });
      handleSuccess('Setting updated');
      fetchSettings();
      setEditing(null);
    } catch (err) {
      handleError(err, 'Update failed');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">System Settings</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        {settings.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No settings configured yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {settings.map((setting) => (
              <li key={setting.key} className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{setting.key}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description || 'No description'}</p>
                </div>
                {editing === setting.key ? (
                  <div className="flex items-center gap-2">
                    <input type="text" defaultValue={setting.value} ref={(el) => el && el.focus()} className="input-custom w-48" onKeyDown={(e) => { if (e.key === 'Enter') handleSave(setting.key, e.target.value); }} />
                    <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-gray-700 dark:text-gray-300">{String(setting.value)}</span>
                    <button onClick={() => setEditing(setting.key)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Add New Setting</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target;
          const key = form.key.value;
          const value = form.value.value;
          if (!key) return toast.error('Key is required');
          try {
            await api.put(`/admin/settings/${key}`, { value, description: form.description.value });
            handleSuccess('Setting created');
            fetchSettings();
            form.reset();
          } catch (err) {
            handleError(err, 'Creation failed');
          }
        }} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm text-gray-500 dark:text-gray-400">Key</label>
            <input name="key" className="input-custom" placeholder="e.g. maxFileSize" required />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm text-gray-500 dark:text-gray-400">Value</label>
            <input name="value" className="input-custom" placeholder="e.g. 20" required />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm text-gray-500 dark:text-gray-400">Description</label>
            <input name="description" className="input-custom" placeholder="e.g. Max file size in MB" />
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2"><Save size={16} /> Add</button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
