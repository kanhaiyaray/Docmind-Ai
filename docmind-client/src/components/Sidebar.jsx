import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText, MessageSquare, Home, LayoutDashboard,
  Sparkles, Zap, BookOpen, History, Settings,
  LogOut, Plus, ChevronRight, FolderOpen, BarChart3
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <div className="sidebar-logo-text">DocMind</div>
          <div style={{ fontSize: '10px', color: '#a0a7b5', fontWeight: 500, letterSpacing: '0.3px' }}>
            AI Intelligence
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <button className="new-chat-btn" onClick={() => navigate('/chat')}>
        <Plus className="h-4 w-4" />
        <span>New Chat</span>
      </button>

      {/* Navigation */}
      <div className="sidebar-nav">
        <div className="sidebar-section-title">Main</div>
        <SidebarItem to="/" icon={<Home className="h-4 w-4" />} label="Home" active={isActive('/')} />
        <SidebarItem to="/documents" icon={<FolderOpen className="h-4 w-4" />} label="Documents" active={isActive('/documents')} />
        <SidebarItem to="/chat" icon={<MessageSquare className="h-4 w-4" />} label="AI Chat" active={isActive('/chat')} />

        <div className="sidebar-section-title">AI Tools</div>
        <SidebarItem to="/compare" icon={<BarChart3 className="h-4 w-4" />} label="Compare" active={isActive('/compare')} />
        <SidebarItem to="/quiz" icon={<Zap className="h-4 w-4" />} label="Quiz Generator" active={isActive('/quiz')} />
        <SidebarItem to="/flashcards" icon={<BookOpen className="h-4 w-4" />} label="Flashcards" active={isActive('/flashcards')} />

        <div className="sidebar-section-title">Workspace</div>
        <SidebarItem to="/history" icon={<History className="h-4 w-4" />} label="History" active={isActive('/history')} />
        <SidebarItem to="/settings" icon={<Settings className="h-4 w-4" />} label="Settings" active={isActive('/settings')} />
      </div>

      {/* User Profile */}
      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #eef0f3' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 4px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px'
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: '11px', color: '#a0a7b5' }}>{user?.email || 'user@example.com'}</div>
          </div>
          <button
            onClick={logout}
            style={{ padding: '4px', color: '#a0a7b5', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Sidebar Item Component
const SidebarItem = ({ to, icon, label, active }) => {
  return (
    <Link to={to} className={`sidebar-item ${active ? 'active' : ''}`}>
      <span className="icon">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

export default Sidebar;
