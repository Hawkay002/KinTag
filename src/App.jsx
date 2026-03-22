import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect } from 'react';

import Home from './pages/Home'; 
import Dashboard from './pages/Dashboard';
import CreateCard from './pages/CreateCard';
import EditCard from './pages/EditCard';
import PublicCard from './pages/PublicCard';
import Login from './pages/Login';
import Signup from './pages/Signup'; 
import Admin from './pages/Admin'; 
import Profile from './pages/Profile'; 
import Changelog from './pages/Changelog';
import UpdateToast from './components/UpdateToast';
import Settings from './pages/Settings';
import CareView from './pages/CareView'; // 🌟 NEW: Imported the Caretaker View
import AppLock from './components/AppLock'; // 🌟 NEW: Imported the Biometric App Lock

let isAuthRefresh = window.location.hash.includes('/login') || window.location.hash.includes('/signup');

// 🌟 UPDATED: AppLock wraps the children so every protected route gets biometric security
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <AppLock>{children}</AppLock>;
};

function AppRoutes() {
  const { currentUser } = useAuth(); 
  const navigate = useNavigate();
  const location = useLocation(); 

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthRefresh) {
      isAuthRefresh = false; 
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={currentUser ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route path="/id/:profileId" element={<PublicCard />} />
      <Route path="/changelog" element={<Changelog />} /> 
      
      {/* 🌟 NEW: Babysitter / Caretaker Link (MUST be public so they don't have to log in) */}
      <Route path="/care/:sessionId" element={<CareView />} />
      
      {/* --- PROTECTED ROUTES --- */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><CreateCard /></ProtectedRoute>} />
      <Route path="/edit/:profileId" element={<ProtectedRoute><EditCard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      
      {/* 🌟 MOVED & PROTECTED: Settings is now safely guarded behind authentication */}
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      
      {/* --- CATCH-ALL (Must stay at the very bottom!) --- */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <UpdateToast />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
