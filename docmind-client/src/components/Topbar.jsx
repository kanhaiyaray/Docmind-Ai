import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Topbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Sync search term with URL param when on /documents
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('search');
    if (location.pathname === '/documents' && query) {
      setSearchTerm(query);
    } else if (location.pathname !== '/documents') {
      setSearchTerm('');
    }
  }, [location]);

  const handleSearch = () => {
    const trimmed = searchTerm.trim();
    if (trimmed) {
      navigate(`/documents?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/documents');
    }
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
    if (e.key === 'Escape') {
      setSearchTerm('');
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    inputRef.current?.focus();
    if (location.pathname === '/documents') {
      navigate('/documents');
    }
  };

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
        <div className={`topbar-search ${isFocused ? 'focused' : ''}`}>
          <Search
            className="h-4 w-4 text-gray-400"
            onClick={handleSearch}
            style={{ cursor: 'pointer' }}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {searchTerm && (
            <button
              onClick={handleClear}
              className="p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg relative">
          <Bell className="h-5 w-5" />
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              background: '#e17055',
              borderRadius: '50%',
              border: '2px solid white',
            }}
          />
        </button>
      </div>
    </div>
  );
};

export default Topbar;
