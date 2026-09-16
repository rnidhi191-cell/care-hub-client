import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', form);
      const { token, accessToken, refreshToken, user } = data.data;

      const activeToken = accessToken || token;
      localStorage.setItem('careHubToken', activeToken);
      if (refreshToken) {
        localStorage.setItem('careHubRefreshToken', refreshToken);
      }
      localStorage.setItem('careHubUser', JSON.stringify(user));
      onLogin(user);

      await Swal.fire({
        icon: 'success',
        title: 'Welcome back!',
        text: `Logged in as ${user.name} (${user.role})`,
        timer: 1500,
        showConfirmButton: false,
      });

      const role = user.role?.toUpperCase();
      const targetPath =
        role === 'SUPER_ADMIN' || role === 'HR_ADMIN' || role === 'HR' || role === 'HR_HRBP'
          ? '/hr'
          : role === 'MANAGER' || role === 'REVIEWER'
          ? '/reviewer'
          : '/employee';

      navigate(targetPath);
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to log in. Please check your credentials.';
      setError(message);
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-container">
      <div className="card">
        <h1>CARE Hub</h1>
        <p className="subtitle">Sign in to manage your performance reviews and growth goals.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>
            Email Address
            <input
              name="email"
              type="email"
              required
              placeholder="e.g. john@company.com"
              value={form.email}
              onChange={handleChange}
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
          </label>

          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: 0 }}>
          New to CARE Hub? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
