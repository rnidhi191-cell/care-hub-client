import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ReviewerDashboard() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    try {
      const { data } = await api.get('/reviews/self-reviews');
      setReviews(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to fetch self-reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      await fetchReviews();
    };
    run();
  }, []);

  const pendingCount = reviews.filter((r) => !r.assessment).length;
  const completedCount = reviews.filter((r) => r.assessment).length;

  return (
    <main>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Performance reviews</div>
          <h1>Reviewer Portal</h1>
          <p>Evaluate employee self-reviews, provide evidence-based feedback, and submit performance ratings.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-3 dashboard-stats">
        <div className="stat-card">
          <div className="label">Total Submissions</div>
          <div className="value">{reviews.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Awaiting Your Review</div>
          <div className="value" style={{ color: '#d97706' }}>{pendingCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">Assessed Reviews</div>
          <div className="value" style={{ color: '#16a34a' }}>{completedCount}</div>
        </div>
      </div>

      <section className="card data-card">
        <div className="card-header">
          <h2>Employee Submissions</h2>
          <button className="button button-secondary button-sm" onClick={fetchReviews}>
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading employee submissions...</p>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <p>No employee self-reviews have been submitted yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Cycle & Year</th>
                  <th>Goals</th>
                  <th>Review Status</th>
                  <th>Assessment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((rev) => (
                  <tr key={rev._id}>
                    <td>
                      <strong>{rev.employee?.name || 'Unknown'}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {rev.employee?.email}
                      </div>
                    </td>
                    <td>{rev.cycle} {rev.year}</td>
                    <td>{rev.goals?.length || 0} goals</td>
                    <td>
                      <span className={`badge badge-${rev.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {rev.status}
                      </span>
                    </td>
                    <td>
                      {rev.assessment ? (
                        <span className="badge badge-completed">Assessed</span>
                      ) : (
                        <span className="badge badge-pending">Needs Review</span>
                      )}
                    </td>
                    <td>
                      <Link
                        className="button button-sm"
                        to={`/reviewer/assessment?id=${rev._id}`}
                      >
                        {rev.assessment ? 'Edit Assessment' : 'Assess'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
