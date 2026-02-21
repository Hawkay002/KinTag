import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateCard from './pages/CreateCard';
import PublicCard from './pages/PublicCard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Parent Portal Routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<CreateCard />} />
        
        {/* Public Scannable Route */}
        <Route path="/id/:profileId" element={<PublicCard />} />
      </Routes>
    </Router>
  );
}

export default App;
