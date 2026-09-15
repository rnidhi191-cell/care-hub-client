import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import Swal from 'sweetalert2';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' }); const [error, setError] = useState(''); const navigate = useNavigate();
  const submit = async (event) => { event.preventDefault(); setError(''); try {
    const { data } = await api.post('/auth/login', form); const { token, user } = data.data; localStorage.setItem('careHubToken', token); localStorage.setItem('careHubUser', JSON.stringify(user)); onLogin(user);
    await Swal.fire({ icon: 'success', title: 'Welcome back', text: data.message, timer: 1400, showConfirmButton: false });
    navigate('/dashboard');
  } catch (err) { const message = err.response?.data?.message || 'Unable to log in'; setError(message); Swal.fire({ icon: 'error', title: 'Login failed', text: message }); } };
  return <main className="card login"><h1>CARE Hub</h1><p>Sign in to manage performance reviews and development.</p><form onSubmit={submit}><label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Password<input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>{error && <p className="error">{error}</p>}<button>Sign in</button></form><p>New to CARE Hub? <Link to="/register">Create an employee account</Link></p></main>;
}
