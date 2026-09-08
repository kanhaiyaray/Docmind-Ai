import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';                 
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Chat from './pages/Chat';
import Compare from './pages/Compare';
import Quiz from './pages/Quiz';
import Flashcards from './pages/Flashcards';
import Settings from './pages/Settings';
import History from './pages/History';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Sessions from './pages/Sessions';  

// Admin imports
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from './pages/Admin/Users';
import AdminDocuments from './pages/Admin/Documents';
import AdminLogs from './pages/Admin/Logs';
import AdminSettings from './pages/Admin/Settings';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa] dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading DocMind...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#fff', color: '#1a1a2e' } }} />
      <Routes>
        {/* Public Routes (no auth required) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route path="/*" element={
          <PrivateRoute>
            <div className="app-container">
              <Sidebar />
              <div className="main-content">
                <Topbar />
                <div style={{ padding: '24px 32px' }}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/chat/:documentId?" element={<Chat />} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/quiz" element={<Quiz />} />
                    <Route path="/flashcards" element={<Flashcards />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/sessions" element={<Sessions />} />  {/* <-- NEW route */}

                    {/* ============ ADMIN ROUTES ============ */}
                    <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>} />
                    <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                    <Route path="/admin/documents" element={<AdminRoute><AdminDocuments /></AdminRoute>} />
                    <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />
                    <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                    <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </div>
            </div>
          </PrivateRoute>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;