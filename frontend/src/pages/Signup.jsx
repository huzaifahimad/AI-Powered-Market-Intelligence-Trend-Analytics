import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup as apiSignup } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Loader2, TrendingUp } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const data = await apiSignup(name, email, password);
      loginUser(data.access_token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <div style={{ background: 'var(--accent-light)', borderRadius: 14, padding: '0.65rem', display: 'flex' }}>
              <TrendingUp size={28} color="var(--accent)" />
            </div>
          </div>
          <h1>Create Account</h1>
          <p>Join Market Intel to track market trends</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="signup-name">Full Name</label>
            <input id="signup-name" type="text" className="input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-email">Email Address</label>
            <input id="signup-email" type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <input id="signup-password" type="password" className="input" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-confirm">Confirm Password</label>
            <input id="signup-confirm" type="password" className="input" placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.25rem' }} disabled={loading}>
            {loading ? <><Loader2 size={16} className="spinning" /> Creating account...</> : <><UserPlus size={16} /> Create Account</>}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
