import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, MessageSquare, LogOut, Home, 
  Sparkles, Menu, X, Bell, LayoutDashboard,
  FolderOpen, MessageCircle, Zap, Upload, BarChart3, BookOpen
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  if (!isAuthenticated) {
    return (
      <nav className="navbar-glass fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-2">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">DocMind</span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="navbar-glass fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-2">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text hidden sm:block">DocMind</span>
              </Link>
            </div>

            {/* Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <NavTab to="/" icon={<LayoutDashboard className="h-4 w-4" />} label="Home" active={isActive('/')} />
              <NavTab to="/documents" icon={<FolderOpen className="h-4 w-4" />} label="Documents" active={isActive('/documents')} />
              <NavTab to="/chat" icon={<MessageCircle className="h-4 w-4" />} label="AI Chat" active={isActive('/chat')} />
              <NavTab to="/compare" icon={<BarChart3 className="h-4 w-4" />} label="Compare" active={isActive('/compare')} />
              <NavTab to="/quiz" icon={<Zap className="h-4 w-4" />} label="Quiz" active={isActive('/quiz')} />
              <NavTab to="/flashcards" icon={<Sparkles className="h-4 w-4" />} label="Flashcards" active={isActive('/flashcards')} />
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
                <Bell className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>

              <button 
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100">
            <div className="px-4 py-3 space-y-1">
              <MobileTab to="/" icon={<LayoutDashboard className="h-5 w-5" />} label="Home" />
              <MobileTab to="/documents" icon={<FolderOpen className="h-5 w-5" />} label="Documents" />
              <MobileTab to="/chat" icon={<MessageCircle className="h-5 w-5" />} label="AI Chat" />
              <MobileTab to="/compare" icon={<BarChart3 className="h-5 w-5" />} label="Compare" />
              <MobileTab to="/quiz" icon={<Zap className="h-5 w-5" />} label="Quiz Generator" />
              <MobileTab to="/flashcards" icon={<Sparkles className="h-5 w-5" />} label="Flashcards" />
              <div className="pt-2 border-t border-gray-100">
                <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      <div className="h-16"></div>
    </>
  );
};

// Nav Tab Component
const NavTab = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 ${
      active 
        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/20' 
        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
    }`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

// Mobile Tab
const MobileTab = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export default Navbar;
