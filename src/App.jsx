import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Page Imports - Ensure these exactly match your file names (case-sensitive for Vercel)
import Dashboard from './pages/Dashboard';
import CreateCard from './pages/CreateCard';
import PublicCard from './pages/PublicCard';
import Login from './pages/Login';

// Protected Route Wrapper: Forces unauthenticated users to the Login page
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Main Routing Logic
function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication Route */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected Parent Portal Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create" 
        element={
          <ProtectedRoute>
            <CreateCard />
          </ProtectedRoute>
        } 
      />
      
      {/* Public Scannable Route (No login required for finders) */}
      <Route path="/id/:profileId" element={<PublicCard />} />

      {/* Catch-all route for any undefined URLs, redirects to Dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Root App Component
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
