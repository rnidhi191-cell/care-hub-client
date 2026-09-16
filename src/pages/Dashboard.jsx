import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem('careHubUser');
    if (!raw) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const user = JSON.parse(raw);
      if (user.role === 'Employee') {
        navigate('/employee', { replace: true });
      } else if (user.role === 'Reviewer') {
        navigate('/reviewer', { replace: true });
      } else if (user.role === 'HR') {
        navigate('/hr', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <main className="card">
      <h1>Redirecting...</h1>
      <p>Taking you to your CARE Hub workspace.</p>
    </main>
  );
}
