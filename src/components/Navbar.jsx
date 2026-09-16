import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('careHubToken');
    localStorage.removeItem('careHubUser');
    onLogout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  const roleLinks = {
    Employee: [
      { label: 'My Dashboard', to: '/employee' },
      { label: 'Self-Review', to: '/self-review' },
    ],
    Reviewer: [
      { label: 'Reviewer Dashboard', to: '/reviewer' },
      { label: 'Conduct Assessment', to: '/reviewer/assessment' },
    ],
    HR: [
      { label: 'HR Admin Dashboard', to: '/hr' },
    ],
  };

  const links = roleLinks[user.role] || [];
  const homePath =
    user.role === 'Employee'
      ? '/employee'
      : user.role === 'Reviewer'
      ? '/reviewer'
      : '/hr';

  return (
    <header className="navbar">
      <Link to={homePath} className="brand">
        CARE Hub
      </Link>

      <div className="nav-links">
        {links.map((link) => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}

        <span className="user-badge">
          {user.name} ({user.role})
        </span>

        <button type="button" className="logout-btn" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}