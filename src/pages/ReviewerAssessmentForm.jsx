import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api';

// 10 standard CARE performance competency areas
const DEFAULT_RATING_AREAS = [
  'Quality of Work',
  'Productivity',
  'Functional / Technical Skills',
  'Communication',
  'Teamwork',
  'Ownership',
  'Problem Solving',
  'Reliability',
  'Initiative',
  'Adaptability',
];

// Rating label definitions (configurable — not hardcoded into business logic)
const RATING_LABELS = {
  1: 'Needs Significant Improvement',
  2: 'Needs Improvement',
  3: 'Meets Expectations',
  4: 'Exceeds Expectations',
  5: 'Outstanding',
};

const RECOMMENDATION_OPTIONS = [
  '', 'Meets Expectations', 'Exceeds Expectations', 'Outstanding',
  'Needs Improvement', 'Needs Significant Improvement',
];


export default function ReviewerAssessmentForm() {
  const [searchParams] = useSearchParams();
  const reviewIdParam = searchParams.get('id');
  const navigate = useNavigate();

  const [availableReviews, setAvailableReviews] = useState([]);
  const [selectedReviewId, setSelectedReviewId] = useState(reviewIdParam || '');
  const [selfReviewData, setSelfReviewData] = useState(null);
  const [existingAssessmentId, setExistingAssessmentId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [overallComments, setOverallComments] = useState('');
  const [goalAssessments, setGoalAssessments] = useState([]);
  const [performanceRatings, setPerformanceRatings] = useState(
    DEFAULT_RATING_AREAS.map((area) => ({ area, rating: 3, comments: '' }))
  );

  // New narrative / structured fields
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [overallAssessment, setOverallAssessment] = useState('');
  const [recommendation, setRecommendation] = useState('');


  // Fetch list of reviews for selection if not pre-selected
  useEffect(() => {
    const fetchAllReviews = async () => {
      try {
        const { data } = await api.get('/reviews/self-reviews');
        setAvailableReviews(data.data || []);
      } catch (err) {
        console.error('Error fetching reviews list', err);
      }
    };
    fetchAllReviews();
  }, []);

  // Fetch self-review details whenever selectedReviewId changes
  useEffect(() => {
    if (!selectedReviewId) return;

    let ignore = false;
    const fetchReviewDetails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/reviews/self-reviews/${selectedReviewId}`);
        if (ignore) return;
        const review = data.data;
        setSelfReviewData(review);

        // Check if an assessment already exists
        if (review.assessment) {
          setExistingAssessmentId(review.assessment._id);
          setOverallComments(review.assessment.overallComments || '');
          setStrengths(review.assessment.strengths || '');
          setAreasForImprovement(review.assessment.areasForImprovement || '');
          setOverallAssessment(review.assessment.overallAssessment || '');
          setRecommendation(review.assessment.recommendation || '');

          if (review.assessment.performanceRatings?.length) {
            setPerformanceRatings(review.assessment.performanceRatings);
          }

          if (review.assessment.goalAssessments?.length) {
            setGoalAssessments(review.assessment.goalAssessments);
          } else {
            // Build goalAssessments matching the review's goals
            setGoalAssessments(
              (review.goals || []).map((g) => ({
                goal: g._id,
                goalTitle: g.title,
                reviewerAssessment: '',
                evidence: '',
                rating: null,
                recommendedOutcome: '',
              }))
            );
          }
        } else {
          setExistingAssessmentId(null);
          setOverallComments('');
          setStrengths('');
          setAreasForImprovement('');
          setOverallAssessment('');
          setRecommendation('');
          setPerformanceRatings(
            DEFAULT_RATING_AREAS.map((area) => ({ area, rating: 3, comments: '' }))
          );
          setGoalAssessments(
            (review.goals || []).map((g) => ({
              goal: g._id,
              goalTitle: g.title,
              reviewerAssessment: '',
              evidence: '',
              rating: null,
              recommendedOutcome: '',
            }))
          );
        }

      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to load self-review details',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReviewDetails();

    return () => {
      ignore = true;
    };
  }, [selectedReviewId]);

  const handleRatingChange = (index, field, value) => {
    const updated = [...performanceRatings];
    updated[index][field] = value;
    setPerformanceRatings(updated);
  };

  const handleGoalAssessmentChange = (index, field, value) => {
    const updated = [...goalAssessments];
    updated[index][field] = value;
    setGoalAssessments(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedReviewId) {
      Swal.fire({ icon: 'warning', text: 'Please select an employee self-review to assess.' });
      return;
    }

    setSaving(true);
    const payload = {
      selfReview: selectedReviewId,
      overallComments,
      strengths,
      areasForImprovement,
      overallAssessment,
      recommendation,
      performanceRatings,
      goalAssessments,
    };


    try {
      if (existingAssessmentId) {
        await api.put(`/reviews/assessments/${existingAssessmentId}`, payload);
        await Swal.fire({
          icon: 'success',
          title: 'Assessment Updated',
          timer: 1400,
          showConfirmButton: false,
        });
      } else {
        await api.post('/reviews/assessments', payload);
        await Swal.fire({
          icon: 'success',
          title: 'Assessment Saved',
          timer: 1400,
          showConfirmButton: false,
        });
      }
      navigate('/reviewer');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to save assessment',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main>
      <div className="page-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <div>
          <div className="page-eyebrow">Manager assessment</div>
          <h1>{existingAssessmentId ? 'Edit Reviewer Assessment' : 'Conduct Reviewer Assessment'}</h1>
          <p>Evaluate the employee’s self-review against objectives and provide structured ratings.</p>
        </div>
        <Link to="/reviewer" className="button button-secondary button-sm">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Review Selection Header */}
      <div className="card">
        <label>
          <strong>Select Employee Self-Review to Assess</strong>
          <select
            value={selectedReviewId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedReviewId(val);
              if (!val) setSelfReviewData(null);
            }}
          >
            <option value="">-- Choose an employee submission --</option>
            {availableReviews.map((rev) => (
              <option key={rev._id} value={rev._id}>
                {rev.employee?.name} — {rev.cycle} {rev.year} ({rev.status})
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && (
        <div className="card">
          <p>Loading submission details...</p>
        </div>
      )}

      {selfReviewData && !loading && (
        <>
          {/* Employee CARE Submission Summary */}
          <section className="card">
            <div className="card-header">
              <h2>Employee Submission: {selfReviewData.employee?.name}</h2>
              <span className="badge badge-active">
                {selfReviewData.cycle} {selfReviewData.year}
              </span>
            </div>

            <div className="grid-2">
              <div className="goal-item">
                <strong>Contribute</strong>
                <p style={{ margin: '0.4rem 0 0', color: 'var(--text-main)' }}>
                  {selfReviewData.contribute || 'No contribution notes provided.'}
                </p>
              </div>

              <div className="goal-item">
                <strong>Achieve</strong>
                <p style={{ margin: '0.4rem 0 0', color: 'var(--text-main)' }}>
                  {selfReviewData.achieve || 'No achievement notes provided.'}
                </p>
              </div>

              <div className="goal-item">
                <strong>Reflect</strong>
                <p style={{ margin: '0.4rem 0 0', color: 'var(--text-main)' }}>
                  {selfReviewData.reflect || 'No reflection notes provided.'}
                </p>
              </div>

              <div className="goal-item">
                <strong>Evolve</strong>
                <p style={{ margin: '0.4rem 0 0', color: 'var(--text-main)' }}>
                  {selfReviewData.evolve || 'No evolution notes provided.'}
                </p>
              </div>
            </div>
          </section>

          {/* Assessment Form */}
          <form onSubmit={handleSubmit} className="card">
            <h2>Goal-by-Goal Review & Evidence</h2>
            {selfReviewData.goals?.length === 0 ? (
              <p className="empty-state">No individual goals were submitted in this review.</p>
            ) : (
              selfReviewData.goals.map((goal, idx) => {
                const ga = goalAssessments[idx] || {};
                return (
                  <div key={goal._id || idx} className="goal-item">
                    <h3>Goal #{idx + 1}: {goal.title}</h3>
                    <p style={{ fontStyle: 'italic', marginBottom: '0.75rem' }}>
                      Employee self-assessment: &ldquo;{goal.employeeAssessment || 'No assessment entered'}&rdquo;
                    </p>

                    <label>
                      Reviewer Assessment &amp; Feedback
                      <textarea
                        rows={2}
                        placeholder="Your assessment of this goal..."
                        value={ga.reviewerAssessment || ''}
                        onChange={(e) =>
                          handleGoalAssessmentChange(idx, 'reviewerAssessment', e.target.value)
                        }
                      />
                    </label>

                    <label>
                      Evidence &amp; Observations
                      <input
                        type="text"
                        placeholder="e.g. Jira tickets delivered, customer metrics, peer feedback"
                        value={ga.evidence || ''}
                        onChange={(e) =>
                          handleGoalAssessmentChange(idx, 'evidence', e.target.value)
                        }
                      />
                    </label>

                    <div className="grid-2">
                      <label>
                        Rating (1–5)
                        <select
                          value={ga.rating || ''}
                          onChange={(e) =>
                            handleGoalAssessmentChange(idx, 'rating', e.target.value ? Number(e.target.value) : null)
                          }
                        >
                          <option value="">-- No Rating --</option>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n} — {RATING_LABELS[n]}</option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Recommended Goal Outcome
                        <select
                          value={ga.recommendedOutcome || ''}
                          onChange={(e) =>
                            handleGoalAssessmentChange(idx, 'recommendedOutcome', e.target.value)
                          }
                        >
                          {RECOMMENDATION_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt || '-- Not Set --'}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                );
              })
            )}

            <h2>Performance Competency Ratings (1 to 5)</h2>
            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '35%' }}>Competency Area</th>
                    <th style={{ width: '20%' }}>Score</th>
                    <th style={{ width: '45%' }}>Reviewer Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceRatings.map((rating, idx) => (
                    <tr key={idx}>
                      <td><strong>{rating.area}</strong></td>
                      <td>
                        <select
                          value={rating.rating}
                          onChange={(e) =>
                            handleRatingChange(idx, 'rating', Number(e.target.value))
                          }
                        >
                          <option value={1}>1 - Needs Significant Improvement</option>
                          <option value={2}>2 - Partially Meets Expectations</option>
                          <option value={3}>3 - Consistently Meets Expectations</option>
                          <option value={4}>4 - Exceeds Expectations</option>
                          <option value={5}>5 - Outstanding / Role Model</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Feedback on this area..."
                          value={rating.comments}
                          onChange={(e) =>
                            handleRatingChange(idx, 'comments', e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid-2">
              <label>
                <strong>Strengths</strong>
                <textarea
                  rows={3}
                  placeholder="What does the employee do well?"
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                />
              </label>

              <label>
                <strong>Areas for Improvement</strong>
                <textarea
                  rows={3}
                  placeholder="What should improve?"
                  value={areasForImprovement}
                  onChange={(e) => setAreasForImprovement(e.target.value)}
                />
              </label>

              <label>
                <strong>Overall Assessment</strong>
                <textarea
                  rows={3}
                  placeholder="Summary of performance."
                  value={overallAssessment}
                  onChange={(e) => setOverallAssessment(e.target.value)}
                />
              </label>

              <label>
                <strong>Recommendation</strong>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', marginTop: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                >
                  {RECOMMENDATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt || '-- Select Recommendation --'}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              <strong>Overall Reviewer Summary & Growth Recommendations</strong>
              <textarea
                rows={4}
                required
                placeholder="Summarize the employee's performance, key strengths, and growth recommendations..."
                value={overallComments}
                onChange={(e) => setOverallComments(e.target.value)}
              />
            </label>

            <div className="button-group">
              <button type="submit" disabled={saving}>
                {saving ? 'Saving Assessment...' : 'Submit Reviewer Assessment'}
              </button>
            </div>
          </form>
        </>
      )}
    </main>
  );
}
