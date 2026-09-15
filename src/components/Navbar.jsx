import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const logout = () => { localStorage.removeItem('careHubToken'); localStorage.removeItem('careHubUser'); onLogout(); navigate('/login'); };
  if (!user) return null;
  const links = user.role === 'Employee' ? [['Dashboard', '/employee'], ['Self Review', '/self-review']]
    : user.role === 'Reviewer' ? [['Dashboard', '/reviewer'], ['Assess Review', '/reviewer/assessment']]
    : [['HR Dashboard', '/hr']];
  return <nav className="navbar"><Link to="/" className="brand">CARE Hub</Link><div>{links.map(([label, to]) => <Link key={to} to={to}>{label}</Link>)}<span>{user.name} · {user.role}</span><button onClick={logout}>Log out</button></div></nav>;
}