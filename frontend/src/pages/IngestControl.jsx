import { useState } from 'react';
import { triggerIngest } from '../services/api';
import { DatabaseZap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const IngestStyles = () => (
  <style>{`
    .ingest-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .ingest-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .form-label {
      color: var(--text-muted);
      font-weight: 500;
      font-size: 0.9rem;
    }
    .status-card {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: 300px;
    }
    .rotating {
      animation: rotate 2s linear infinite;
    }
    @keyframes rotate {
      100% { transform: rotate(360deg); }
    }
  `}</style>
);

export default function IngestControl() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('technology');
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [taskData, setTaskData] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setStatus('loading');
    
    triggerIngest(query, category, pageSize)
      .then(res => {
        setTaskData(res);
        setStatus('success');
        // Reset query
        setQuery('');
      })
      .catch(err => {
        console.error(err);
        setStatus('error');
      });
  };

  return (
    <>
      <IngestStyles />
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">Data Ingestion</h1>
        <p style={{ color: 'var(--text-muted)' }}>Trigger manual data fetch and NLP processing pipeline.</p>
      </div>

      <div className="ingest-container animate-fade-in">
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DatabaseZap color="var(--accent-primary)" /> New Ingestion Task
          </h3>
          
          <form className="ingest-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Search Query</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g., artificial intelligence" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select 
                className="input-field"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="business">Business</option>
                <option value="technology">Technology</option>
                <option value="science">Science</option>
                <option value="health">Health</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Maximum Articles (Page Size)</label>
              <input 
                type="number" 
                className="input-field" 
                min="10" 
                max="100" 
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ marginTop: '1rem', justifyContent: 'center' }}
              disabled={status === 'loading' || !query.trim()}
            >
              {status === 'loading' ? 'Initializing Task...' : 'Trigger Ingestion Pipeline'}
            </button>
          </form>
        </div>

        <div className="glass-panel status-card">
          {status === 'idle' && (
            <div style={{ color: 'var(--text-muted)' }}>
              <DatabaseZap size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <h3>Ready</h3>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Fill out the configuration to start a new ingestion task.</p>
            </div>
          )}

          {status === 'loading' && (
            <div style={{ color: 'var(--accent-primary)' }}>
              <Loader2 size={48} className="rotating" style={{ marginBottom: '1rem' }} />
              <h3>Processing Request...</h3>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Communicating with News API.</p>
            </div>
          )}

          {status === 'success' && taskData && (
            <div className="animate-fade-in">
              <CheckCircle2 color="var(--success)" size={48} style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'var(--success)' }}>Task Started Successfully</h3>
              
              <div style={{ marginTop: '1.5rem', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 8 }}>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-muted)' }}>Task ID:</strong> {taskData.task_id}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-muted)' }}>Articles Fetched:</strong> {taskData.articles_fetched}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
                  Processing continues in the background. Data will automatically appear in Dashboard and Search once completed.
                </div>
              </div>
              
              <button className="btn-secondary" style={{ marginTop: '1.5rem' }} onClick={() => setStatus('idle')}>
                Queue Another Task
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="animate-fade-in">
              <AlertCircle color="var(--danger)" size={48} style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'var(--danger)' }}>Task Initialization Failed</h3>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Please check the configuration or API limit.</p>
              <button className="btn-secondary" style={{ marginTop: '1.5rem' }} onClick={() => setStatus('idle')}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
