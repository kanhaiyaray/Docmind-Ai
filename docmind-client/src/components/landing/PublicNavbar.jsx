import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FileText, Menu, X, ArrowRight, Github } from 'lucide-react';

const PublicNavbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center shadow-md shadow-purple-200 group-hover:scale-105 transition">
              <FileText className="h-4 w-4 text-white" strokeWidth={2.4} />
            </div>
            <div className="leading-none">
              <div className="font-extrabold text-lg bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] bg-clip-text text-transparent">
                DocMind
              </div>
              <div className="text-[10px] text-gray-400 font-medium tracking-wide mt-0.5">
                AI DOCUMENT INTELLIGENCE
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <a
              href="https://github.com/kanhaiyaray/Docmind-Ai"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-gray-100 transition"
              aria-label="GitHub"
              title="View source on GitHub"
            >
              <Github className="h-5 w-5" />
            </a>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="btn-primary inline-flex items-center gap-1.5 text-sm"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary inline-flex items-center gap-1.5 text-sm"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-4 flex flex-col gap-2">
            <a
              href="https://github.com/kanhaiyaray/Docmind-Ai"
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700"
            >
              <Github className="h-4 w-4" /> View on GitHub
            </a>

            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary justify-center inline-flex">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full text-center px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700"
                >
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary justify-center inline-flex">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
