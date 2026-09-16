import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api';

export default function SelfReviewForm() {
  const [searchParams] = useSearchParams();
  const reviewIdParam = searchParams.get('id');
  const navigate = useNavigate();

  const [reviewId, setReviewId] = useState(reviewIdParam || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assessment, setAssessment] = useState(null);

  const [form, setForm] = useState({
    cycle: 'April',
    year: new Date().getFullYear(),
    contribute: '',
    achieve: '',
    reflect: '',
    evolve: '',
    goals: [{ title: '', employeeAssessment: '' }],
    status: 'Completed',
  });

  // Load existing review if ID provided
  useEffect(() => {
    if (!reviewIdParam) return;

    const fetchReview = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/reviews/self-reviews/${reviewIdParam}`);
        const item = data.data;
        setReviewId(item._id);
        setForm({
          cycle: item.cycle,
          year: item.year,
          contribute: item.contribute || '',
          achieve: item.achieve || '',
          reflect: item.reflect || '',
          evolve: item.evolve || '',
          goals: item.goals?.length ? item.goals : [{ title: '', employeeAssessment: '' }],
          status: item.status || 'Completed',
        });
        if (item.assessment) {
          setAssessment(item.assessment);
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to load self-review',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [reviewIdParam]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGoalChange = (index, field, value) => {
    const updated = [...form.goals];
    updated[index][field] = value;
    setForm((prev) => ({ ...prev, goals: updated }));
  };

  const addGoal = () => {
    setForm((prev) => ({
      ...prev,
      goals: [...prev.goals, { title: '', employeeAssessment: '' }],
    }));
  };

  const removeGoal = (index) => {
    if (form.goals.length <= 1) return;
    const updated = form.goals.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, goals: updated }));
  };

  const handleSubmit = async (e, customStatus) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      status: customStatus || form.status,
    };

    try {
      if (reviewId) {
        // Update existing review
        await api.put(`/reviews/self-reviews/${reviewId}`, payload);
        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Your self-review has been successfully updated.',
          timer: 1400,
          showConfirmButton: false,
        });
      } else {
        // Create new review
        const { data } = await api.post('/reviews/self-reviews', payload);
        setReviewId(data.data._id);
        await Swal.fire({
          icon: 'success',
          title: 'Submitted!',
          text: 'Your self-review has been submitted for review.',
          timer: 1400,
          showConfirmButton: false,
        });
      }
      navigate('/employee');
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.existingId) {
        const res = await Swal.fire({
          icon: 'info',
          title: 'Review Exists',
          text: err.response.data.message,
          showCancelButton: true,
          confirmButtonText: 'Load & Edit Existing Review',
        });
        if (res.isConfirmed) {
          navigate(`/self-review?id=${err.response.data.existingId}`);
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Save Failed',
          text: err.response?.data?.message || 'Could not save review.',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="card">
        <p>Loading review form...</p>
      </main>
    );
  }

  return (
    <main>
      <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <div>
          <h1>{reviewId ? 'Edit Self-Review' : 'New CARE Self-Review'}</h1>
          <p>
            Complete all four pillars of the CARE framework: Contribute, Achieve, Reflect, and Evolve.
          </p>
        </div>
        <Link to="/employee" className="button button-secondary button-sm">
          ← Back to Dashboard
        </Link>
      </div>

      {assessment && (
        <div className="alert alert-info">
          <strong>Reviewer Feedback Available:</strong> This review has been assessed by{' '}
          {assessment.reviewer?.name || 'your reviewer'}. Check the reviewer comments below.
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, 'Completed')} className="card">
        <div className="grid-2">
          <label>
            Review Cycle
            <select
              value={form.cycle}
              disabled={!!reviewId}
              onChange={(e) => handleChange('cycle', e.target.value)}
            >
              <option value="April">April Cycle</option>
              <option value="September">September Cycle</option>
            </select>
          </label>

          <label>
            Year
            <input
              type="number"
              min="2020"
              max="2035"
              value={form.year}
              disabled={!!reviewId}
              onChange={(e) => handleChange('year', Number(e.target.value))}
            />
          </label>
        </div>

        {/* C - Contribute */}
        <label>
          <strong>C · Contribute</strong>
          <small style={{ display: 'block', color: 'var(--text-muted)' }}>
            What were your core contributions to team and organization goals during this cycle?
          </small>
          <textarea
            required
            rows={3}
            value={form.contribute}
            placeholder="Describe your key contributions..."
            onChange={(e) => handleChange('contribute', e.target.value)}
          />
        </label>

        {/* A - Achieve */}
        <label>
          <strong>A · Achieve</strong>
          <small style={{ display: 'block', color: 'var(--text-muted)' }}>
            What specific accomplishments, project deliveries, or measurable wins did you achieve?
          </small>
          <textarea
            required
            rows={3}
            value={form.achieve}
            placeholder="Describe what you achieved..."
            onChange={(e) => handleChange('achieve', e.target.value)}
          />
        </label>

        {/* R - Reflect */}
        <label>
          <strong>R · Reflect</strong>
          <small style={{ display: 'block', color: 'var(--text-muted)' }}>
            What challenges did you face, what lessons did you learn, and what could be improved?
          </small>
          <textarea
            required
            rows={3}
            value={form.reflect}
            placeholder="Reflect on roadblocks, learnings, and improvements..."
            onChange={(e) => handleChange('reflect', e.target.value)}
          />
        </label>

        {/* E - Evolve */}
        <label>
          <strong>E · Evolve</strong>
          <small style={{ display: 'block', color: 'var(--text-muted)' }}>
            What are your growth goals, skills to develop, and focus areas for the next cycle?
          </small>
          <textarea
            required
            rows={3}
            value={form.evolve}
            placeholder="Outline your future growth and skill development..."
            onChange={(e) => handleChange('evolve', e.target.value)}
          />
        </label>

        {/* Goals Section */}
        <h2>Key Objectives & Goal Self-Assessment</h2>
        {form.goals.map((goal, idx) => (
          <div key={idx} className="goal-item">
            <div className="goal-header">
              <strong>Goal #{idx + 1}</strong>
              {form.goals.length > 1 && (
                <button
                  type="button"
                  className="button-danger button-sm"
                  onClick={() => removeGoal(idx)}
                >
                  Remove
                </button>
              )}
            </div>

            <label>
              Goal Title
              <input
                required
                type="text"
                placeholder="e.g. Lead the frontend migration to React 19"
                value={goal.title}
                onChange={(e) => handleGoalChange(idx, 'title', e.target.value)}
              />
            </label>

            <label>
              Your Assessment & Evidence
              <textarea
                rows={2}
                placeholder="How did you perform against this objective? Include relevant evidence or metrics."
                value={goal.employeeAssessment}
                onChange={(e) => handleGoalChange(idx, 'employeeAssessment', e.target.value)}
              />
            </label>
          </div>
        ))}

        <div style={{ marginBottom: '1.5rem' }}>
          <button type="button" className="button-secondary button-sm" onClick={addGoal}>
            + Add Another Goal
          </button>
        </div>

        {/* Action Buttons */}
        <div className="button-group">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Submit Self-Review'}
          </button>
          <button
            type="button"
            className="button-secondary"
            disabled={saving}
            onClick={(e) => handleSubmit(e, 'Not Completed')}
          >
            Save as Draft
          </button>
        </div>
      </form>

      {/* Reviewer Feedback Section if available */}
      {assessment && (
        <section className="card">
          <h2>Reviewer Assessment Feedback</h2>
          {assessment.overallComments && (
            <p>
              <strong>Overall Comments:</strong> {assessment.overallComments}
            </p>
          )}

          {assessment.performanceRatings?.length > 0 && (
            <div>
              <h3>Performance Ratings</h3>
              <table>
                <thead>
                  <tr>
                    <th>Area</th>
                    <th>Rating</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {assessment.performanceRatings.map((pr, i) => (
                    <tr key={i}>
                      <td><strong>{pr.area}</strong></td>
                      <td>★ {pr.rating} / 5</td>
                      <td>{pr.comments || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}