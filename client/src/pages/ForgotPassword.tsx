import { useState } from 'react';
import toast from 'react-hot-toast';
import '../index.css';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Sending reset link...');

    try {
      const form = new FormData(e.currentTarget);
      const email = form.get('email');

      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'If an account exists, a reset link has been sent.', { id: toastId });
      } else {
        toast.error(data.message || 'Failed to send reset link.', { id: toastId });
      }
    } catch (error) {
      console.error("Forgot Password error:", error);
      toast.error('An unexpected error occurred. Please try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Password Recovery</h1>
          <p>Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={onSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="name@company.com"
              required
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn" style={{ marginTop: '1rem' }}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="form-footer" style={{ justifyContent: 'center', marginTop: '1rem' }}>
            <a href="/login">Back to Login</a>
          </div>
        </form>
      </div>
    </div>
  );
}
