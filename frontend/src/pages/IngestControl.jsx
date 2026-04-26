import { useState } from 'react';
import { triggerIngest } from '../services/api';
import { DatabaseZap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function IngestControl() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('technology');
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState('idle');
  const [taskData, setTaskData] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setStatus('loading'); setErrMsg('');
    triggerIngest(query, category, pageSize)
      .then((r) => { setTaskData(r); setStatus('success'); setQuery(''); })
      .catch((err) => { setErrMsg(err.response?.data?.detail || 'Check API key and backend.'); setStatus('error'); });
  };

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Data Ingestion</h1>
        <p className="page-subtitle">Fetch news articles and run the NLP processing pipeline.</p>
      </div>

      <div className="ingest-grid animate-fade-up">
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            <DatabaseZap size={18} color="var(--accent)" /> New Ingestion Task
          </h3>
          <form className="form-stack" onSubmit={handleSubmit}>
            <div>
              <label className="field-label" htmlFor="iq">Search Query</label>
              <input id="iq" type="text" className="input" placeholder="e.g., artificial intelligence" value={query} onChange={(e) => setQuery(e.target.value)} required />
            </div>
            <div>
              <label className="field-label" htmlFor="ic">Category</label>
              <select id="ic" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="business">Business</option>
                <option value="technology">Technology</option>
                <option value="science">Science</option>
                <option value="health">Health</option>
                <option value="entertainment">Entertainment</option>
                <option value="sports">Sports</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="ip">Max Articles</label>
              <input id="ip" type="number" className="input" min="1" max="100" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={status === 'loading' || !query.trim()}>
              {status === 'loading' ? <><Loader2 size={15} className="spinning" /> Processing...</> : 'Trigger Pipeline'}
            </button>
          </form>
        </div>

        <div className="card status-pane">
          {status === 'idle' && (
            <div style={{ color: 'var(--text-muted)' }}>
              <DatabaseZap size={44} style={{ opacity: 0.15, marginBottom: '1rem' }} />
              <h3 style={{ color: 'var(--text-secondary)' }}>Ready</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.35rem', maxWidth: 280 }}>Configure parameters and trigger the ingestion pipeline.</p>
            </div>
          )}
          {status === 'loading' && (
            <div><Loader2 size={44} className="spinning" color="var(--accent)" style={{ marginBottom: '1rem' }} /><h3 style={{ color: 'var(--accent)' }}>Processing...</h3><p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>Fetching from News API</p></div>
          )}
          {status === 'success' && taskData && (
            <div className="animate-scale-in">
              <CheckCircle2 size={44} color="var(--accent-green)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'var(--accent-green)' }}>Task Started</h3>
              <div style={{ marginTop: '1.25rem', textAlign: 'left', background: 'var(--bg-input)', padding: '1rem', borderRadius: 10, width: '100%' }}>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}><span style={{ color: 'var(--text-muted)' }}>Task ID:</span> <strong>{taskData.task_id}</strong></div>
                <div style={{ fontSize: '0.85rem' }}><span style={{ color: 'var(--text-muted)' }}>Fetched:</span> <strong style={{ color: 'var(--accent-green)' }}>{taskData.articles_fetched} articles</strong></div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>Processing in background. Data appears in Dashboard shortly.</p>
              </div>
              <button className="btn btn-outline" style={{ marginTop: '1.25rem' }} onClick={() => setStatus('idle')}>New Task</button>
            </div>
          )}
          {status === 'error' && (
            <div className="animate-scale-in">
              <AlertCircle size={44} color="var(--accent-red)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'var(--accent-red)' }}>Failed</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem', maxWidth: 300 }}>{errMsg}</p>
              <button className="btn btn-outline" style={{ marginTop: '1.25rem' }} onClick={() => setStatus('idle')}>Try Again</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
