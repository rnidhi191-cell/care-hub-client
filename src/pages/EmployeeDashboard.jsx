import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api';
import AttachmentPanel from '../components/AttachmentPanel';

const FINAL_RATING_LABELS = {
  1: 'Needs Significant Improvement',
  2: 'Needs Improvement',
  3: 'Meets Expectations',
  4: 'Exceeds Expectations',
  5: 'Outstanding',
};

const getFinalizedRating = (reviews) => {
  const assessment = reviews.find(({ assessment }) => {
    const rating = Number(assessment?.calibratedRating);
    return assessment?.isFinalized && Number.isInteger(rating) && FINAL_RATING_LABELS[rating];
  })?.assessment;

  if (!assessment) return null;
  const rating = Number(assessment.calibratedRating);
  return { rating, label: FINAL_RATING_LABELS[rating] };
};

export default function EmployeeDashboard() {
  const [reviews, setReviews] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(null);

  const fetchData = async () => {
    try {
      const [reviewsRes, plansRes, settingsRes] = await Promise.all([
        api.get('/reviews/self-reviews'),
        api.get('/reviews/development-plans'),
        api.get('/settings').catch(() => ({ data: { data: null } }))
      ]);
      setReviews(reviewsRes.data.data || []);
      setPlans(plansRes.data.data || []);
      setSettings(settingsRes.data?.data || null);
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

  const finalRating = getFinalizedRating(reviews);

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
      <div className="page-header">
        <div>
          <div className="page-eyebrow">My performance</div>
          <h1>Employee Dashboard</h1>
          <p>Manage your CARE self-reviews, track assessment feedback, and review development plans.</p>
          {settings && settings.cycleStartDate && settings.cycleEndDate && (
            <p style={{ fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.5rem' }}>
              Performance Review Validation: This is valid for {new Date(settings.cycleStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} to {new Date(settings.cycleEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.
            </p>
          )}
        </div>
        <Link className="button" to="/self-review">
          + Start / Update Self-Review
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {finalRating && (
        <section
          className={`final-rating-card ${finalRating.rating >= 3 ? 'final-rating-card--celebrate' : ''}`}
          aria-label={`Your final performance rating is ${finalRating.rating}: ${finalRating.label}`}
        >
          {finalRating.rating >= 3 && <div className="final-rating-confetti" aria-hidden="true" />}
          <div className="final-rating-content">
            <p className="final-rating-title">🎉 Your Final Performance Rating</p>
            <div className="final-rating-score" aria-label={`${finalRating.rating} out of 5`}>⭐ {finalRating.rating} ⭐</div>
            <h2>{finalRating.label}</h2>
            <p>Your performance review has been finalized.</p>
          </div>
        </section>
      )}

      <div className="grid-3 dashboard-stats">
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
      <section className="card data-card">
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
      <section className="card data-card">
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
                  <Fragment key={p._id}>
                  <tr>
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
                  <tr><td colSpan="4"><AttachmentPanel endpoint={`/reviews/development-plans/${p._id}/attachments`} title="Plan evidence & documents" /></td></tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
