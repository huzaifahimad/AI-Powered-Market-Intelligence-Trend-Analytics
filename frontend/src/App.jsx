import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Database } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import SearchPage from './pages/Search';
import IngestControl from './pages/IngestControl';
import './index.css';

const Sidebar = () => {
  return (
    <nav className="glass-panel" style={{ width: 'var(--nav-width)', height: 'calc(100vh - 40px)', margin: '20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
        <h2 className="text-gradient">Market Intel</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>AI Insights Platform</p>
      </div>
      
      <div style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        <NavLink to="/" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink to="/search" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Search size={20} />
          <span>News Search</span>
        </NavLink>
        
        <NavLink to="/ingest" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Database size={20} />
          <span>Data Ingestion</span>
        </NavLink>
      </div>
      
      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success)', boxShadow: '0 0 10px var(--success)' }}></div>
          API Online
        </div>
      </div>
    </nav>
  );
};

// Insert sidebar styles via styled-component-like approach in App
const SidebarStyles = () => (
  <style>{`
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1rem;
      color: var(--text-muted);
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.2s ease;
      font-weight: 500;
    }
    .sidebar-link:hover {
      background: rgba(255,255,255,0.05);
      color: var(--text-main);
    }
    .sidebar-link.active {
      background: rgba(59, 130, 246, 0.15);
      color: var(--accent-primary);
      border-right: 3px solid var(--accent-primary);
    }
  `}</style>
);

function App() {
  return (
    <Router>
      <SidebarStyles />
      <div className="app-container">
        <Sidebar />
        <main className="main-content animate-fade-in">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/ingest" element={<IngestControl />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
