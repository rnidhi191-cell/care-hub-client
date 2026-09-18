import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api';

export default function Register({ onLogin }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'EMPLOYEE',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });

      const { token, accessToken, refreshToken, user } = data.data;
      const activeToken = accessToken || token;
      onLogin({ user, token: activeToken, refreshToken });

      await Swal.fire({
        icon: 'success',
        title: 'Account Created!',
        text: `Registered as ${user.name} (${user.role})`,
        timer: 1500,
        showConfirmButton: false,
      });

      const role = user.role?.toUpperCase();
      const targetPath = role === 'EMPLOYEE' ? '/employee' : '/login';

      navigate(targetPath);
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to create your account.';
      setError(message);
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-container">
      <div className="card auth-card">
        <div className="auth-brand" aria-hidden="true">C</div>
        <div className="auth-eyebrow">CARE HUB</div>
        <h1>Create Account</h1>
        <p className="subtitle">Join CARE Hub to participate in performance reviews and goal tracking.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Jane Doe"
              value={form.name}
              onChange={handleChange}
            />
          </label>

          <label>
            Work Email
            <input
              name="email"
              type="email"
              required
              placeholder="e.g. jane@company.com"
              value={form.email}
              onChange={handleChange}
            />
          </label>

          <label>
            Account Role
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              minLength={6}
              required
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
            />
          </label>

          <label>
            Confirm Password
            <input
              name="confirmPassword"
              type="password"
              minLength={6}
              required
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </label>

          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: 0 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
