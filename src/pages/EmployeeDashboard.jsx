import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function EmployeeDashboard() {
  const [reviews, setReviews] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [reviewsRes, plansRes] = await Promise.all([
        api.get('/reviews/self-reviews'),
        api.get('/reviews/development-plans'),
      ]);
      setReviews(reviewsRes.data.data || []);
      setPlans(plansRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your review information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      await fetchData();
    };
    run();
  }, []);

  const handleAcknowledge = async (rev) => {
    const { value: formValues } = await Swal.fire({
      title: 'Acknowledge Final Review',
      html: `
        <div style="text-align: left; max-height: 60vh; overflow-y: auto; font-size: 0.9rem;">
          <p><strong>Final Rating:</strong> ${rev.assessment.finalRating || 'N/A'}</p>
          <p><strong>Performance Summary:</strong> ${rev.assessment.overallComments || 'N/A'}</p>
          <p><strong>Strengths:</strong> ${rev.assessment.strengths || 'N/A'}</p>
          <p><strong>Development Areas:</strong> ${rev.assessment.areasForImprovement || 'N/A'}</p>
          <hr/>
          <p><em>"I acknowledge that this performance review has been discussed with me and made available for my review."</em></p>
          <label>Acknowledgement Comment (optional)</label>
          <textarea id="swal-ack-comment" class="swal2-textarea" placeholder="Add a comment..."></textarea>
          <label style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem;">
            <input type="checkbox" id="swal-ack-concern">
            Raise a concern/dispute
          </label>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Acknowledge Review',
      preConfirm: () => {
        return {
          acknowledgementComment: document.getElementById('swal-ack-comment').value,
          raisedConcern: document.getElementById('swal-ack-concern').checked,
        };
      }
    });

    if (formValues) {
      try {
        await api.put(`/reviews/self-reviews/${rev._id}`, {
          acknowledged: true,
          acknowledgementComment: formValues.acknowledgementComment,
          raisedConcern: formValues.raisedConcern,
        });
        Swal.fire({ icon: 'success', title: 'Acknowledged', timer: 1500, showConfirmButton: false });
        fetchData();
      } catch (err) {
        Swal.fire({ icon: 'error', text: err.response?.data?.message || 'Failed to acknowledge' });
      }
    }
  };

  return (
    <main>
      <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <div>
          <h1>Employee Dashboard</h1>
          <p>Manage your CARE self-reviews, track assessment feedback, and review development plans.</p>
        </div>
        <Link className="button" to="/self-review">
          + Start / Update Self-Review
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-3" style={{ marginTop: '1rem' }}>
        <div className="stat-card">
          <div className="label">Submitted Reviews</div>
          <div className="value">{reviews.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Assessed Reviews</div>
          <div className="value">{reviews.filter((r) => r.assessment).length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Active Development Plans</div>
          <div className="value">{plans.length}</div>
        </div>
      </div>

      {/* Reviews Table */}
      <section className="card">
        <div className="card-header">
          <h2>Your Self-Reviews</h2>
        </div>

        {loading ? (
          <p>Loading your reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <p>You haven't submitted any self-reviews yet.</p>
            <Link className="button button-sm" to="/self-review">
              Start Your First Review
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Cycle & Year</th>
                  <th>Goals</th>
                  <th>Review Status</th>
                  <th>Reviewer Feedback</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((rev) => (
                  <tr key={rev._id}>
                    <td>
                      <strong>{rev.cycle} {rev.year}</strong>
                    </td>
                    <td>{rev.goals?.length || 0} goals defined</td>
                    <td>
                      <span
                        className={`badge badge-${rev.status?.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {rev.status}
                      </span>
                    </td>
                    <td>
                      {rev.assessment ? (
                        <span className="badge badge-completed">
                          Assessed by {rev.assessment.reviewer?.name || 'Reviewer'}
                        </span>
                      ) : (
                        <span className="badge badge-pending">Pending Review</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link
                          className="button button-secondary button-sm"
                          to={`/self-review?id=${rev._id}`}
                        >
                          View / Edit
                        </Link>
                        {rev.assessment && rev.assessment.isFinalized && !rev.acknowledged && (
                          <button
                            className="button button-sm"
                            style={{ background: '#d97706', border: 'none', color: '#fff' }}
                            onClick={() => handleAcknowledge(rev)}
                          >
                            Required: Acknowledge
                          </button>
                        )}
                        {rev.acknowledged && (
                          <span className="badge badge-completed">Acknowledged</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Development Plans */}
      <section className="card">
        <div className="card-header">
          <h2>Your Development Plans</h2>
        </div>

        {plans.length === 0 ? (
          <p className="empty-state">No development plans have been assigned by HR yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Cycle</th>
                  <th>Priorities</th>
                  <th>Target Goals</th>
                  <th>Follow-up Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p._id}>
                    <td><strong>{p.cycle} {p.year || ''}</strong></td>
                    <td>{p.priorities || 'N/A'}</td>
                    <td>{p.goals?.join(', ') || 'N/A'}</td>
                    <td>
                      <span
                        className={`badge badge-${p.followUpStatus?.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {p.followUpStatus}
                      </span>
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