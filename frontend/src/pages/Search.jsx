import { useState, useEffect } from 'react';
import { searchArticles } from '../services/api';
import { Search, Filter, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const SearchStyles = () => (
  <style>{`
    .search-header {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .search-input-wrapper {
      flex: 1;
      position: relative;
    }
    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }
    .search-input {
      width: 100%;
      padding: 1rem 1rem 1rem 3rem;
      background: var(--bg-panel);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      color: var(--text-main);
      font-size: 1rem;
      backdrop-filter: var(--glass-blur);
      transition: all 0.3s;
    }
    .search-input:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px var(--accent-glow);
    }
    .filter-select {
      background: var(--bg-panel);
      border: 1px solid var(--border-light);
      color: var(--text-main);
      padding: 0 1.5rem;
      border-radius: 12px;
      outline: none;
      backdrop-filter: var(--glass-blur);
      cursor: pointer;
    }
    .article-card {
      padding: 1.5rem;
      margin-bottom: 1rem;
      border-left: 4px solid transparent;
    }
    .article-card.positive { border-left-color: var(--success); }
    .article-card.negative { border-left-color: var(--danger); }
    .article-card.neutral { border-left-color: var(--neutral); }
    
    .keyword-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border-light);
      border-radius: 20px;
      color: var(--text-muted);
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
      display: inline-block;
    }
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
      padding: 1rem;
      background: var(--bg-panel);
      border-radius: 12px;
      border: 1px solid var(--border-light);
    }
  `}</style>
);

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('technology');
  const [sentiment, setSentiment] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ results: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const fetchResults = () => {
    setLoading(true);
    searchArticles({ query: activeQuery, page, pageSize: 10, sentiment })
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (activeQuery) {
      fetchResults();
    }
  }, [activeQuery, page, sentiment]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setPage(1);
      setActiveQuery(query);
    }
  };

  const totalPages = Math.ceil(data.total / 10);

  return (
    <>
      <SearchStyles />
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">Intelligence Search</h1>
        <p style={{ color: 'var(--text-muted)' }}>Semantic search through processed market intelligence articles.</p>
      </div>

      <form onSubmit={handleSearch} className="search-header">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search keywords, companies, or topics..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={sentiment}
          onChange={e => setSentiment(e.target.value)}
        >
          <option value="all">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <h3>Searching intelligence database...</h3>
        </div>
      ) : (
        <div className="search-results animate-fade-in">
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
            Found {data.total} results for "{activeQuery}"
          </p>

          {data.results.map((article) => (
            <div key={article.id} className={`glass-panel article-card ${article.sentiment}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', flex: 1, paddingRight: '1rem' }}>
                  {article.title}
                </h3>
                <div style={{ 
                  padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                  backgroundColor: article.sentiment === 'positive' ? 'rgba(16, 185, 129, 0.1)' : 
                                  article.sentiment === 'negative' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                  color: article.sentiment === 'positive' ? 'var(--success)' : 
                         article.sentiment === 'negative' ? 'var(--danger)' : 'var(--text-muted)',
                  textTransform: 'capitalize'
                }}>
                  {article.sentiment}
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap' }}>
                {article.keywords.map(kw => (
                  <span key={kw} className="keyword-badge">{kw}</span>
                ))}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span>Published: {new Date(article.published_at).toLocaleDateString()}</span>
                <span style={{ display: 'flex', gap: '1rem' }}>
                  <span>Score: {article.score}</span>
                  <span>Trend: {article.trend_score}</span>
                </span>
              </div>
            </div>
          ))}

          {data.total > 0 && (
            <div className="pagination">
              <button 
                className="btn-secondary" 
                disabled={page <= 1} 
                onClick={() => setPage(p => p - 1)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages || 1}</span>
              <button 
                className="btn-secondary" 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => p + 1)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
