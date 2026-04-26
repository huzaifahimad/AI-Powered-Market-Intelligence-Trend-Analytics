import { useState, useEffect } from 'react';
import { searchArticles } from '../services/api';
import { Search, ChevronLeft, ChevronRight, Loader2, Inbox } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('technology');
  const [sentiment, setSentiment] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ results: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchResults = () => {
    if (!activeQuery) return;
    setLoading(true);
    searchArticles({ query: activeQuery, page, pageSize: 10, sentiment })
      .then((r) => { setData(r); setSearched(true); })
      .catch(() => { setData({ results: [], total: 0 }); setSearched(true); })
      .finally(() => setLoading(false));
  };

  useEffect(fetchResults, [activeQuery, page, sentiment]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) { setPage(1); setActiveQuery(query.trim()); }
  };

  const totalPages = Math.ceil(data.total / 10);

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">News Search</h1>
        <p className="page-subtitle">Search processed articles with sentiment filtering.</p>
      </div>

      <form onSubmit={handleSearch} className="search-bar">
        <div className="search-wrap">
          <Search size={17} />
          <input id="search-input" type="text" className="search-field" placeholder="Search keywords, companies, topics..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="filter-dropdown" value={sentiment} onChange={(e) => { setSentiment(e.target.value); setPage(1); }}>
          <option value="all">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {loading ? (
        <div className="center-state" style={{ minHeight: '30vh' }}>
          <Loader2 size={28} className="spinning" color="var(--accent)" />
          <p style={{ color: 'var(--text-muted)' }}>Searching...</p>
        </div>
      ) : (
        <div className="animate-fade-up">
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{data.total}</strong> results for "<strong style={{ color: 'var(--accent)' }}>{activeQuery}</strong>"
          </p>

          {data.results.length === 0 && searched ? (
            <div className="card empty-box"><Inbox size={40} style={{ opacity: 0.2 }} /><h3>No Results</h3><p>Try a different term or ingest more data.</p></div>
          ) : (
            data.results.map((a) => (
              <div key={a.id} className={`card article-item ${a.sentiment}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div className="article-title">{a.title}</div>
                  <span className={`badge badge-${a.sentiment}`}>{a.sentiment}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                  {a.keywords.slice(0, 5).map((k) => <span key={k} className="keyword-tag">{k}</span>)}
                </div>
                <div className="article-meta">
                  <span>{new Date(a.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  <span style={{ display: 'flex', gap: '1rem' }}>
                    <span>Score: <strong>{a.score}</strong></span>
                    <span>Trend: <strong style={{ color: 'var(--accent)' }}>{a.trend_score}</strong></span>
                  </span>
                </div>
              </div>
            ))
          )}

          {data.total > 0 && (
            <div className="pager">
              <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={15} /> Prev</button>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Page <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> / {totalPages || 1}</span>
              <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight size={15} /></button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
