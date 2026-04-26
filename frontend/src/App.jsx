import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, Database, LogOut, Zap, User } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { checkHealth } from './services/api';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import SearchPage from './pages/Search';
import IngestControl from './pages/IngestControl';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './index.css';
import './App.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [api, setApi] = useState('checking');

  useEffect(() => {
    const check = () => checkHealth().then(() => setApi('online')).catch(() => setApi('offline'));
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={20} color="var(--accent)" />
          <h2>Market Intel</h2>
        </div>
        <p>Analytics Platform</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Search size={18} /> News Search
        </NavLink>
        <NavLink to="/ingest" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Database size={18} /> Data Ingestion
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={14} color="var(--accent)" />
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{user?.name || 'User'}</span>
          </div>
          <button onClick={handleLogout} className="btn-ghost" title="Logout" style={{ padding: '0.3rem' }}>
            <LogOut size={15} />
          </button>
        </div>
        <div className="status-indicator">
          <span className={`dot ${api === 'online' ? 'dot-online' : 'dot-offline'}`}></span>
          {api === 'online' ? 'API Connected' : api === 'checking' ? 'Connecting...' : 'API Offline'}
        </div>
      </div>
    </aside>
  );
}

function AppShell() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-area animate-fade-up">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/ingest" element={<IngestControl />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/*" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
