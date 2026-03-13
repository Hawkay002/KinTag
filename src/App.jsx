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
import UpdateToast from './components/UpdateToast'; // 🌟 NEW

let isAuthRefresh = window.location.hash.includes('/login') || window.location.hash.includes('/signup');

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
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
      // 🌟 Updated to point to the new dedicated dashboard route
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  return (
    <Routes>
      {/* 🌟 Home page is now visible to everyone, logged in or not */}
      <Route path="/" element={<Home />} />
      
      {/* 🌟 New dedicated protected route for the dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      
      {/* 🌟 Logged in users trying to access login/signup go to dashboard */}
      <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={currentUser ? <Navigate to="/dashboard" replace /> : <Signup />} />
      
      <Route path="/create" element={<ProtectedRoute><CreateCard /></ProtectedRoute>} />
      <Route path="/edit/:profileId" element={<ProtectedRoute><EditCard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/id/:profileId" element={<PublicCard />} />
      <Route path="/changelog" element={<Changelog />} /> 
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <UpdateToast /> {/* 🌟 NEW */}
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
