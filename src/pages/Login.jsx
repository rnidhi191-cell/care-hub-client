import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api';
import companyLogo from '../assets/code_underscore.png';

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
      onLogin({ user, token: activeToken, refreshToken });

      await Swal.fire({
        icon: 'success',
        title: 'Welcome back!',
        text: `Logged in as ${user.name} (${user.role})`,
        timer: 1500,
        showConfirmButton: false,
      });

      const role = user.role?.toUpperCase();
      const targetPath = role === 'ADMIN' ? '/admin'
        : role === 'HR' ? '/hr'
        : role === 'MANAGER' ? '/reviewer'
        : role === 'EMPLOYEE' ? '/employee'
        : '/login';

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
    <main className="login-container" aria-labelledby="login-title">
      <div className="card auth-card">
        <div className="login-logo-frame">
          <img className="login-logo" src={companyLogo} alt="Code Underscore Technology" />
        </div>
        <h1 id="login-title">Welcome to the CARE Program</h1>

        <p className="subtitle">Employee Performance &amp; Growth Management System</p>

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

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}
