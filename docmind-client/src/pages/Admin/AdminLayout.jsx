import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';   // <-- fixed path
import { LayoutDashboard, Users, FileText, Activity, Settings, LogOut, Home } from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed h-full overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-purple-600">DocMind Admin</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
        </div>
        <nav className="p-4 space-y-1">
          <AdminNavItem to="/admin" icon={<LayoutDashboard size={18} />} label="Dashboard" active={isActive('/admin')} />
          <AdminNavItem to="/admin/users" icon={<Users size={18} />} label="Users" active={isActive('/admin/users')} />
          <AdminNavItem to="/admin/documents" icon={<FileText size={18} />} label="Documents" active={isActive('/admin/documents')} />
          <AdminNavItem to="/admin/logs" icon={<Activity size={18} />} label="Activity Logs" active={isActive('/admin/logs')} />
          <AdminNavItem to="/admin/settings" icon={<Settings size={18} />} label="Settings" active={isActive('/admin/settings')} />
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <AdminNavItem to="/" icon={<Home size={18} />} label="Back to App" />
            <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </nav>
        <div className="absolute bottom-4 left-4 right-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-300">Logged in as</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

const AdminNavItem = ({ to, icon, label, active }) => (
  <Link to={to} className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${active ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
    {icon} {label}
  </Link>
);

export default AdminLayout;