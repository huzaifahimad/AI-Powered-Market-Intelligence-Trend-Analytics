import { useState, useEffect } from 'react';
import { fetchSummary, fetchInsights } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Activity, BarChart3, Clock, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

const COLORS = { positive: '#22c55e', negative: '#ef4444', neutral: '#9ca3af' };

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '0.6rem 0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: 2 }}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color || '#4f6ef7', fontWeight: 700, fontSize: '0.85rem' }}>{e.name}: {e.value?.toLocaleString()}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    Promise.all([fetchSummary(), fetchInsights(30)])
      .then(([s, i]) => { setSummary(s); setInsights(i); setLoading(false); })
      .catch(() => { setError('Failed to load data. Is the backend running?'); setLoading(false); });
  };

  useEffect(load, []);

  if (loading) return (
    <div className="center-state animate-fade-in">
      <Loader2 size={36} className="spinning" color="var(--accent)" />
      <h3 style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading Analytics...</h3>
    </div>
  );

  if (error) return (
    <div className="center-state">
      <AlertCircle size={44} color="var(--accent-red)" />
      <h3 style={{ color: 'var(--accent-red)' }}>{error}</h3>
      <button className="btn btn-primary" onClick={load} style={{ marginTop: '0.5rem' }}>Retry</button>
    </div>
  );

  const pie = [
    { name: 'Positive', value: summary.sentiment_breakdown.positive, color: COLORS.positive },
    { name: 'Negative', value: summary.sentiment_breakdown.negative, color: COLORS.negative },
    { name: 'Neutral', value: summary.sentiment_breakdown.neutral, color: COLORS.neutral },
  ];
  const hasData = summary.total_processed_articles > 0;

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Real-time intelligence overview across all ingested documents.</p>
      </div>

      <div className="stats-grid stagger">
        <div className="card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Processed</span>
            <div className="stat-icon" style={{ background: 'var(--accent-light)' }}><Activity size={18} color="var(--accent)" /></div>
          </div>
          <div className="stat-value">{summary.total_processed_articles.toLocaleString()}</div>
          <div className="stat-meta" style={{ color: 'var(--accent-green)' }}>{summary.total_raw_articles} raw articles</div>
        </div>
        <div className="card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Sentiment</span>
            <div className="stat-icon" style={{ background: '#f3e8ff' }}><BarChart3 size={18} color="var(--accent-secondary)" /></div>
          </div>
          <div className="stat-value">{summary.avg_sentiment_score >= 0 ? '+' : ''}{summary.avg_sentiment_score.toFixed(3)}</div>
          <div className="stat-meta" style={{ color: summary.avg_sentiment_score >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {summary.avg_sentiment_score >= 0.1 ? '↗ Bullish' : summary.avg_sentiment_score <= -0.1 ? '↘ Bearish' : '→ Neutral'}
          </div>
        </div>
        <div className="card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Peak Day</span>
            <div className="stat-icon" style={{ background: '#ecfdf5' }}><Clock size={18} color="var(--accent-green)" /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.35rem' }}>{summary.most_active_day || 'N/A'}</div>
          <div className="stat-meta" style={{ color: 'var(--text-muted)' }}>Highest volume</div>
        </div>
      </div>

      {!hasData ? (
        <div className="card empty-box"><TrendingUp size={44} style={{ opacity: 0.2 }} /><h3>No Data Yet</h3><p>Go to Data Ingestion to fetch your first batch of articles.</p></div>
      ) : (
        <>
          <div className="charts-row">
            <div className="card chart-box animate-fade-up">
              <div className="chart-title">30-Day Article Trend</div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={insights.daily_trend} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                  <defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.15} /><stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="date" stroke="transparent" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} />
                  <YAxis stroke="transparent" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" name="Articles" stroke="#4f6ef7" strokeWidth={2.5} fill="url(#gc)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="card chart-box animate-fade-up" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="chart-title">Sentiment Split</div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pie} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                      {pie.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                {pie.map((s) => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block' }}></span>
                    {s.name} ({s.value})
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card animate-fade-up" style={{ padding: '1.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div className="chart-title" style={{ margin: 0 }}>Top Keywords</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent)', background: 'var(--accent-light)', padding: '0.2rem 0.6rem', borderRadius: 6, fontWeight: 600 }}>Avg Score</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={insights.top_keywords} margin={{ top: 0, right: 0, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="keyword" stroke="transparent" tick={{ fill: '#9ca3af', fontSize: 10 }} angle={-35} textAnchor="end" tickLine={false} />
                <YAxis stroke="transparent" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="trend_score" name="Trend Score" fill="#7c5cfc" radius={[5, 5, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </>
  );
}
