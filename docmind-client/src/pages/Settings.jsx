import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-8 w-8 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>
      <div className="glass-card p-8">
        <p className="text-gray-500 text-lg">Manage your account preferences.</p>
        <p className="text-gray-400 mt-2">This feature is coming soon.</p>
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-700">Theme</span>
            <span className="text-sm text-gray-400">Light / Dark (coming soon)</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-700">Notifications</span>
            <span className="text-sm text-gray-400">Enabled (coming soon)</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-700">Language</span>
            <span className="text-sm text-gray-400">English (coming soon)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
