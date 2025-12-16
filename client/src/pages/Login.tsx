// Features and logic by Wajihi Ramadan (JeehTech)
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import PageTitle from '../components/PageTitle';
import '../index.css';

export default function Login() {
  const { dispatch, state } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (state?.user) {
      navigate('/dashboard', { replace: true });
    }
  }, [state?.user, navigate]);

  // Get intended URL from location state or default to dashboard
  const from = location.state?.from?.pathname || "/dashboard";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    // Dismiss loading toast if any exists from previous attempts (optional)
    const toastId = toast.loading('Authenticating...');

    try {
      const form = new FormData(e.currentTarget);
      const identifier = form.get('identifier') as string;
      const password = form.get('password') as string;
      const body = identifier.includes('@') ? { email: identifier, password } : { username: identifier, password };

      const res = await fetch(`${settings.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
        dispatch({
          type: 'LOGIN',
          accessToken: data.accessToken,
          user: { id: payload.sub, email: payload.email, role_id: payload.role_id }
        });

        toast.success(`Welcome back, ${payload.email || 'User'}!`, { id: toastId });
        navigate(from, { replace: true });
      } else {
        toast.error(data.message || 'Login failed. Please check your credentials.', { id: toastId });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error('An unexpected error occurred. Please try again later.', { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  const year = new Date().getFullYear();

  return (
    <div className="login-container" style={{ flexDirection: 'column', gap: '2rem' }}>
      <PageTitle title="Login" />
      <div className="login-card">
        <div className="login-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          {settings.logoUrl ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <img
                src={settings.logoUrl}
                alt={settings.companyName}
                style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <h1>Welcome Back</h1>
          )}
          <p style={{ marginTop: settings.logoUrl ? '1rem' : '0.5rem', color: 'var(--text-muted)' }}>
            Sign in to {settings.companyName}
          </p>
        </div>

        <form onSubmit={onSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="identifier">Email or Username</label>
            <input
              id="identifier"
              name="identifier"
              placeholder="name@company.com"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                className="form-input"
                style={{ width: '100%', paddingRight: '2.5rem', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-footer">
            <a href="/forgot-password" className="forgot-password">Forgot password?</a>
          </div>

          <button type="submit" disabled={loading} className="submit-btn" style={{ justifyContent: 'center' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <footer style={{
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        textAlign: 'center',
        opacity: 0.8
      }}>
        &copy; {year} Developed and Maintained By Powercomputers LTD
      </footer>
    </div>
  );
}
