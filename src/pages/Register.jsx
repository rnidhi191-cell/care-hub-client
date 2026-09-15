import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api';

// Public registration creates Employee accounts. HR manages elevated roles.
export default function Register({ onLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    try {
      const { data } = await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
      const { token, user } = data.data;
      localStorage.setItem('careHubToken', token);
      localStorage.setItem('careHubUser', JSON.stringify(user));
      onLogin(user);
      await Swal.fire({ icon: 'success', title: 'Account created', text: data.message, timer: 1400, showConfirmButton: false });
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to create your account';
      setError(message);
      Swal.fire({ icon: 'error', title: 'Registration failed', text: message });
    }
  };

  return <main className="card login"><h1>Create your account</h1><p>New accounts are registered as Employees.</p><form onSubmit={submit}><label>Full name<input name="name" required value={form.name} onChange={update} /></label><label>Email<input name="email" type="email" required value={form.email} onChange={update} /></label><label>Password<input name="password" type="password" minLength="6" required value={form.password} onChange={update} /></label><label>Confirm password<input name="confirmPassword" type="password" minLength="6" required value={form.confirmPassword} onChange={update} /></label>{error && <p className="error">{error}</p>}<button>Create account</button></form><p>Already have an account? <Link to="/login">Sign in</Link></p></main>;
}
