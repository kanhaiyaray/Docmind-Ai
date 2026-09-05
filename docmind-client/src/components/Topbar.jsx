import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, Menu } from 'lucide-react';

const Topbar = () => {
  const { user } = useAuth();

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu className="h-5 w-5" />
        </button>
        <div className="topbar-greeting">
          Welcome back, <span>{user?.name?.split(' ')[0] || 'User'}</span> 👋
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="topbar-search">
          <Search className="h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search..." />
        </div>
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg relative">
          <Bell className="h-5 w-5" />
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            background: '#e17055',
            borderRadius: '50%',
            border: '2px solid white'
          }}></span>
        </button>
      </div>
    </div>
  );
};

export default Topbar;
