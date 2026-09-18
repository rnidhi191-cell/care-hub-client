import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';

const ReviewText = ({ review }) => (
  <details style={{ marginTop: '0.5rem' }}>
    <summary style={{ cursor: 'pointer', fontWeight: 600 }}>View self and colleague reviews</summary>
    <div className="grid-2" style={{ marginTop: '0.75rem' }}>
      <div><strong>Contribute</strong><p>{review.contribute || '—'}</p></div><div><strong>Achieve</strong><p>{review.achieve || '—'}</p></div>
      <div><strong>Reflect</strong><p>{review.reflect || '—'}</p></div><div><strong>Evolve</strong><p>{review.evolve || '—'}</p></div>
    </div>
    {review.goals?.length > 0 && <div><strong>Self-review goals</strong>{review.goals.map((goal, index) => <p key={goal._id || index}><strong>{goal.title}:</strong> {goal.employeeAssessment || '—'}</p>)}</div>}
    <div><strong>Colleague review {review.assessment?.reviewer?.name ? `— ${review.assessment.reviewer.name}` : ''}</strong><p>{review.assessment?.overallComments || '—'}</p>{review.assessment && <><p><strong>Strengths:</strong> {review.assessment.strengths || '—'}</p><p><strong>Areas for improvement:</strong> {review.assessment.areasForImprovement || '—'}</p><p><strong>Overall assessment:</strong> {review.assessment.overallAssessment || '—'}</p></>}</div>
  </details>
);

export default function ReviewerDashboard() {
  const user = useSelector(selectCurrentUser);
  const isManager = user?.role?.toUpperCase() === 'MANAGER';

  // Colleague review assignments (for employees acting as selected colleague)
  const [colleagueReviews, setColleagueReviews] = useState([]);
  // Manager review queue (reviews in MANAGER_REVIEW stage)
  const [managerReviews, setManagerReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      if (isManager) {
        // Fetch all reviews visible to this manager
        const { data } = await api.get('/reviews/self-reviews');
        const all = data.data || [];
        // Reviews awaiting manager input are in MANAGER_REVIEW stage
        setManagerReviews(all.filter((r) => r.workflowStatus === 'MANAGER_REVIEW'));
        // Previously completed manager reviews (other stages)
        setColleagueReviews(all.filter((r) => r.workflowStatus !== 'MANAGER_REVIEW'));
      } else {
        // Employee acting as colleague reviewer — see reviews assigned to them
        const { data } = await api.get('/reviews/self-reviews?assignedOnly=true');
        setColleagueReviews(data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager]);

  const handleManagerReview = async (rev) => {
    const { value: formValues } = await Swal.fire({
      title: `Manager Review — ${rev.employee?.name}`,
      html: `
        <div style="text-align:left">
          <p><strong>Cycle:</strong> ${rev.cycle} ${rev.year}</p>
          <label style="display:block;margin-top:1rem">Overall Comments</label>
          <textarea id="mgr-comments" class="swal2-textarea" rows="3" placeholder="Overall comments on the employee's performance..."></textarea>
          <label style="display:block;margin-top:0.75rem">Rating (1–5)</label>
          <select id="mgr-rating" class="swal2-select" style="width:100%">
            <option value="1">1 – Needs Significant Improvement</option>
            <option value="2">2 – Needs Improvement</option>
            <option value="3" selected>3 – Meets Expectations</option>
            <option value="4">4 – Exceeds Expectations</option>
            <option value="5">5 – Outstanding</option>
          </select>
          <label style="display:block;margin-top:0.75rem">Recommendation</label>
          <input id="mgr-recommendation" class="swal2-input" placeholder="e.g. Promote, Retain, Develop...">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Submit Manager Review',
      preConfirm: () => {
        const rating = Number(document.getElementById('mgr-rating').value);
        const comments = document.getElementById('mgr-comments').value.trim();
        const recommendation = document.getElementById('mgr-recommendation').value.trim();
        if (!rating || rating < 1 || rating > 5) {
          Swal.showValidationMessage('Please provide a valid rating (1–5)');
          return false;
        }
        return { selfReview: rev._id, comments, rating, recommendation };
      },
    });

    if (formValues) {
      try {
        await api.post('/reviews/manager-reviews', formValues);
        await Swal.fire({
          icon: 'success',
          title: 'Manager Review Submitted',
          text: 'The review has been forwarded to HR for final review.',
          timer: 1800,
          showConfirmButton: false,
        });
        fetchReviews();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: err.response?.data?.message || 'Could not submit manager review.',
        });
      }
    }
  };

  const pendingColleagueCount = colleagueReviews.filter((r) => !r.assessment).length;
  const completedColleagueCount = colleagueReviews.filter((r) => r.assessment).length;

  return (
    <main>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Performance reviews</div>
          <h1>{isManager ? 'Manager Review Portal' : 'Colleague Reviewer Portal'}</h1>
          <p>
            {isManager
              ? 'Review your direct reports\' colleague assessments and submit your manager review.'
              : 'Evaluate employee self-reviews as their selected colleague reviewer.'}
          </p>
        </div>
        <button className="button button-secondary button-sm" onClick={fetchReviews}>
          ↻ Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats */}
      {isManager ? (
        <div className="grid-3 dashboard-stats">
          <div className="stat-card">
            <div className="label">Awaiting Manager Review</div>
            <div className="value" style={{ color: '#d97706' }}>{managerReviews.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Completed / Other Stages</div>
            <div className="value" style={{ color: '#16a34a' }}>{colleagueReviews.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Total Visible Reviews</div>
            <div className="value">{managerReviews.length + colleagueReviews.length}</div>
          </div>
        </div>
      ) : (
        <div className="grid-3 dashboard-stats">
          <div className="stat-card">
            <div className="label">Assigned to You</div>
            <div className="value">{colleagueReviews.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Awaiting Your Review</div>
            <div className="value" style={{ color: '#d97706' }}>{pendingColleagueCount}</div>
          </div>
        </div>
      )}

      {/* Manager Review Queue */}
      {isManager && (
        <section className="card data-card">
          <div className="card-header">
            <h2>Awaiting Your Manager Review</h2>
          </div>

          {loading ? (
            <p>Loading reviews...</p>
          ) : managerReviews.length === 0 ? (
            <div className="empty-state">
              <p>No reviews are currently awaiting your manager review.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Cycle &amp; Year</th>
                    <th>Goals</th>
                    <th>Colleague Review</th>
                    <th>Review details</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {managerReviews.map((rev) => (
                    <tr key={rev._id}>
                      <td>
                        <strong>{rev.employee?.name || 'Unknown'}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rev.employee?.email}</div>
                      </td>
                      <td>{rev.cycle} {rev.year}</td>
                      <td>{rev.goals?.length || 0} goals</td>
                      <td>
                        {rev.assessment ? (
                          <span className="badge badge-completed">Colleague review done</span>
                        ) : (
                          <span className="badge badge-pending">Pending</span>
                        )}
                      </td>
                      <td><ReviewText review={rev} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <Link className="button button-secondary button-sm" to={`/reviewer/assessment?id=${rev._id}`}>
                            View Details
                          </Link>
                          <button
                            className="button button-sm"
                            onClick={() => handleManagerReview(rev)}
                          >
                            Submit Manager Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Colleague Review Queue — shown for both roles but labeled differently */}
      <section className="card data-card">
        <div className="card-header">
          <h2>{isManager ? 'All Other Visible Reviews' : 'Employee Submissions Assigned to You'}</h2>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : colleagueReviews.length === 0 ? (
          <div className="empty-state">
            <p>
              {isManager
                ? 'No other reviews to show.'
                : 'No employee self-reviews have been assigned to you yet.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Cycle &amp; Year</th>
                  <th>Goals</th>
                  <th>Status</th>
                  <th>Assessment</th>
                    <th>Review details</th>
                    <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {colleagueReviews.map((rev) => (
                  <tr key={rev._id}>
                    <td>
                      <strong>{rev.employee?.name || 'Unknown'}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rev.employee?.email}</div>
                    </td>
                    <td>{rev.cycle} {rev.year}</td>
                    <td>{rev.goals?.length || 0} goals</td>
                    <td>
                      <span className={`badge badge-${rev.workflowStatus?.toLowerCase().replace(/_/g, '-')}`}>
                        {rev.workflowStatus?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {rev.assessment ? (
                        <span className="badge badge-completed">Assessed</span>
                      ) : (
                        <span className="badge badge-pending">Needs Review</span>
                      )}
                    </td>
                    <td><ReviewText review={rev} /></td>
                    <td>
                      <Link
                        className="button button-sm"
                        to={`/reviewer/assessment?id=${rev._id}`}
                      >
                        {rev.assessment ? 'View Assessment' : 'Assess'}
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
