import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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

// 🌟 NEW: Checks if the user hard-refreshed directly onto the login or signup page
let isAuthRefresh = window.location.hash.includes('/login') || window.location.hash.includes('/signup');

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

function AppRoutes() {
  const { currentUser } = useAuth(); 
  const navigate = useNavigate();

  useEffect(() => {
    // 🌟 NEW: If it was a hard refresh on auth pages, boot them to Home
    if (isAuthRefresh) {
      isAuthRefresh = false; // Reset it immediately so normal navigation works perfectly
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={currentUser ? <Dashboard /> : <Home />} />
      
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={currentUser ? <Navigate to="/" replace /> : <Signup />} />
      
      <Route path="/create" element={<ProtectedRoute><CreateCard /></ProtectedRoute>} />
      <Route path="/edit/:profileId" element={<ProtectedRoute><EditCard /></ProtectedRoute>} />
      
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      
      <Route path="/id/:profileId" element={<PublicCard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
