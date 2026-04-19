import { useState, useEffect } from 'react';
import { fetchSummary, fetchInsights } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { Activity, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

const DashboardStyles = () => (
  <style>{`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--text-muted);
    }
    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .chart-card {
      padding: 1.5rem;
      min-height: 400px;
    }
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 60vh;
      color: var(--accent-primary);
    }
  `}</style>
);

const COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#64748b'
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchSummary(), fetchInsights(30)])
      .then(([summaryData, insightsData]) => {
        setSummary(summaryData);
        setInsights(insightsData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load dashboard data.");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading-container animate-fade-in"><h2>Loading Analytics...</h2></div>;
  if (error) return <div className="loading-container" style={{color: 'var(--danger)'}}><AlertCircle size={40} /><h2 style={{marginLeft: 10}}>{error}</h2></div>;

  const sentimentData = [
    { name: 'Positive', value: summary.sentiment_breakdown.positive, color: COLORS.positive },
    { name: 'Negative', value: summary.sentiment_breakdown.negative, color: COLORS.negative },
    { name: 'Neutral', value: summary.sentiment_breakdown.neutral, color: COLORS.neutral },
  ];

  return (
    <>
      <DashboardStyles />
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient">Platform Overview</h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time intelligence and AI analysis spanning all ingested documents.</p>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span>Total Processed Articles</span>
            <Activity color="var(--accent-primary)" />
          </div>
          <div className="stat-value">{summary.total_processed_articles}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--success)' }}>Active tracking enabled</div>
        </div>
        
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span>Average Sentiment</span>
            <BarChart3 color="var(--accent-secondary)" />
          </div>
          <div className="stat-value">{(summary.avg_sentiment_score).toFixed(3)}</div>
          <div style={{ fontSize: '0.85rem', color: summary.avg_sentiment_score >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            Overall pulse
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span>Most Active Day</span>
            <TrendingUp color="#10b981" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.8rem', lineHeight: '2.5rem' }}>
            {summary.most_active_day || 'N/A'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Highest ingestion volume</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="glass-panel chart-card">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>30-Day Growth Trend</h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={insights.daily_trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
              <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-core)', borderColor: 'var(--border-light)', borderRadius: 8 }}
                itemStyle={{ color: 'var(--accent-primary)' }}
              />
              <Area type="monotone" dataKey="count" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel chart-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Sentiment Distribution</h3>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-core)', borderColor: 'var(--border-light)', borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem' }}>
            {sentimentData.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: s.color }}></div>
                <span style={{ color: 'var(--text-muted)'}}>{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Top Trending Keywords</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={insights.top_keywords} margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="keyword" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} angle={-45} textAnchor="end" />
            <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-core)', borderColor: 'var(--border-light)', borderRadius: 8 }}
              cursor={{fill: 'rgba(255,255,255,0.05)'}}
            />
            <Bar dataKey="trend_score" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
