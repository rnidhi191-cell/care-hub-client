import { useEffect, useState } from 'react';
import api from '../api';
import Swal from 'sweetalert2';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchData = async () => {
    try {
      const usersRes = await api.get('/auth/users');
      setUsers(usersRes.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateHR = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Create HR User',
      html: `
        <input id="hr-name" class="swal2-input" placeholder="Name">
        <input id="hr-email" type="email" class="swal2-input" placeholder="Email">
        <input id="hr-password" type="password" class="swal2-input" placeholder="Password">
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        return {
          name: document.getElementById('hr-name').value,
          email: document.getElementById('hr-email').value,
          password: document.getElementById('hr-password').value,
          role: 'HR'
        };
      }
    });

    if (formValues) {
      try {
        await api.post('/auth/hr', formValues);
        Swal.fire('Success', 'HR User Created', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create HR', 'error');
      }
    }
  };

  return (
    <main>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Workspace administration</div>
          <h1>Admin Dashboard</h1>
          <p>Manage users and keep your CARE Hub workspace organised.</p>
        </div>
        <div className="page-actions">
          <button className={`button ${activeTab === 'dashboard' ? '' : 'button-secondary'}`} onClick={() => setActiveTab('dashboard')}>Overview</button>
          <button className={`button ${activeTab === 'users' ? '' : 'button-secondary'}`} onClick={() => setActiveTab('users')}>Users</button>
          <button className={`button ${activeTab === 'roles' ? '' : 'button-secondary'}`} onClick={() => setActiveTab('roles')}>Roles</button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid-3 dashboard-stats">
          <div className="stat-card">
            <div className="label">Total Users</div>
            <div className="value">{users.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Total Employees</div>
            <div className="value">{users.filter(u => u.role === 'EMPLOYEE').length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Total Managers</div>
            <div className="value">{users.filter(u => u.role === 'MANAGER').length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Total HR</div>
            <div className="value">{users.filter(u => u.role === 'HR').length}</div>
          </div>
          <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button className="button" onClick={handleCreateHR}>+ Create HR</button>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <section className="card data-card">
          <div className="card-header"><div><h2>All Users</h2><p>Directory of active CARE Hub accounts</p></div></div>
          <div className="table-scroll"><table>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '0.5rem' }}>Name</th>
                <th style={{ padding: '0.5rem' }}>Email</th>
                <th style={{ padding: '0.5rem' }}>Role</th>
                <th style={{ padding: '0.5rem' }}>Department</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>{u.name}</td>
                  <td style={{ padding: '0.5rem' }}>{u.email}</td>
                  <td style={{ padding: '0.5rem' }}>{u.role}</td>
                  <td style={{ padding: '0.5rem' }}>{u.department?.name || 'N/A'}</td>
                  <td style={{ padding: '0.5rem' }}>{u.status || 'active'}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <button className="button button-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </section>
      )}

    </main>
  );
}
