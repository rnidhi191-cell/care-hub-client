import { Fragment, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import api from '../api';
import AttachmentPanel from '../components/AttachmentPanel';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPLOYMENT_STATUS_OPTIONS = ['FULL_TIME', 'PART_TIME', 'PROBATION', 'CONTRACT', 'TERMINATED'];
const ROLE_OPTIONS = ['Employee', 'Reviewer', 'HR', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'];

const HR_TABS = [
  { key: 'dashboard', label: '📊 Dashboard' },
  { key: 'employees', label: '👥 Employees' },
  { key: 'reviews', label: '📋 Reviews' },
  { key: 'assessments', label: '✅ Assessments' },
  { key: 'calibration', label: '⚖️ Calibration' },
  { key: 'plans', label: '🎯 Development Plans' },
];

const BLANK_EMP_FORM = {
  name: '',
  email: '',
  password: '',
  employeeCode: '',
  role: 'EMPLOYEE',
  departmentId: '',
  jobTitleId: '',
  locationId: '',
  joiningDate: '',
  employmentStatus: 'FULL_TIME',
  phoneNumber: '',
  status: 'active',
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- Core data ---
  const [reviews, setReviews] = useState([]);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [orgData, setOrgData] = useState({ departments: [], jobTitles: [], locations: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Development Plan modal ---
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    employee: '',
    cycle: 'April',
    priorities: '',
    goals: '',
    followUpDate: '',
    followUpStatus: 'Not Started',
  });

  // --- Add Employee form state ---
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [empForm, setEmpForm] = useState(BLANK_EMP_FORM);
  const [empFormErrors, setEmpFormErrors] = useState({});
  const [empSaving, setEmpSaving] = useState(false);

  // --- Employee search/filter ---
  const [empSearch, setEmpSearch] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('');

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewsRes, plansRes, usersRes, empRes, orgRes, assessRes] = await Promise.all([
        api.get('/reviews/self-reviews'),
        api.get('/reviews/development-plans'),
        api.get('/auth/users'),
        api.get('/employees'),
        api.get('/v1/organization'),
        api.get('/reviews/assessments'),
      ]);
      setReviews(reviewsRes.data.data || []);
      setPlans(plansRes.data.data || []);
      setUsers(usersRes.data.data || []);
      setEmployees(empRes.data.data?.employees || []);
      setOrgData(orgRes.data.data || { departments: [], jobTitles: [], locations: [] });
      setAssessments(assessRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load HR management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ---------------------------------------------------------------------------
  // Handlers — Development Plan (preserved from original)
  // ---------------------------------------------------------------------------

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!planForm.employee) {
      Swal.fire({ icon: 'warning', text: 'Please select an employee.' });
      return;
    }

    try {
      const payload = {
        ...planForm,
        goals: planForm.goals
          .split('\n')
          .map((g) => g.trim())
          .filter(Boolean),
      };

      await api.post('/reviews/development-plans', payload);
      await Swal.fire({
        icon: 'success', title: 'Plan Created',
        text: 'Development plan has been assigned to employee.',
        timer: 1500, showConfirmButton: false,
      });

      setShowPlanModal(false);
      setPlanForm({ employee: '', cycle: 'April', priorities: '', goals: '', followUpDate: '', followUpStatus: 'Not Started' });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to create plan' });
    }
  };

  const handleUpdateStatus = async (reviewId, newStatus) => {
    try {
      await api.put(`/reviews/self-reviews/${reviewId}`, { status: newStatus });
      Swal.fire({ icon: 'success', title: 'Status Updated', text: `Review marked as ${newStatus}`, timer: 1200, showConfirmButton: false });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', text: err.response?.data?.message || 'Could not update status' });
    }
  };

  const handleDeletePlan = async (planId) => {
    const res = await Swal.fire({
      title: 'Delete Plan?', text: 'Are you sure you want to delete this development plan?',
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Yes, delete',
    });

    if (res.isConfirmed) {
      try {
        await api.delete(`/reviews/development-plans/${planId}`);
        Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false });
        fetchData();
      } catch {
        Swal.fire({ icon: 'error', text: 'Failed to delete development plan' });
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Handlers — Add Employee
  // ---------------------------------------------------------------------------

  const validateEmpForm = () => {
    const errs = {};
    if (!empForm.name.trim()) errs.name = 'Name is required';
    if (!empForm.email.trim() || !/^\S+@\S+\.\S+$/.test(empForm.email)) errs.email = 'Valid email is required';
    if (!empForm.password || empForm.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!empForm.employeeCode.trim()) errs.employeeCode = 'Employee Code is required';
    return errs;
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    const errs = validateEmpForm();
    if (Object.keys(errs).length > 0) { setEmpFormErrors(errs); return; }
    setEmpFormErrors({});
    setEmpSaving(true);

    try {
      await api.post('/employees/create-with-account', {
        name: empForm.name.trim(),
        email: empForm.email.trim().toLowerCase(),
        password: empForm.password,
        role: empForm.role,
        employeeCode: empForm.employeeCode.trim(),
        departmentId: empForm.departmentId || undefined,
        jobTitleId: empForm.jobTitleId || undefined,
        locationId: empForm.locationId || undefined,
        joiningDate: empForm.joiningDate || undefined,
        employmentStatus: empForm.employmentStatus,
        phoneNumber: empForm.phoneNumber,
        status: empForm.status,
      });

      await Swal.fire({
        icon: 'success', title: 'Employee Created',
        text: `${empForm.name} has been added successfully.`,
        timer: 2000, showConfirmButton: false,
      });

      setEmpForm(BLANK_EMP_FORM);
      setShowAddEmployee(false);
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to create employee' });
    } finally {
      setEmpSaving(false);
    }
  };

  const handleTerminateEmployee = async (empId, empName) => {
    const res = await Swal.fire({
      title: `Terminate ${empName}?`,
      text: 'This will mark the employee as TERMINATED and deactivate their account.',
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Yes, terminate',
    });

    if (res.isConfirmed) {
      try {
        await api.delete(`/employees/${empId}`);
        Swal.fire({ icon: 'success', title: 'Terminated', timer: 1500, showConfirmButton: false });
        fetchData();
      } catch {
        Swal.fire({ icon: 'error', text: 'Failed to terminate employee' });
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Handlers — HR Assessment Validation
  // ---------------------------------------------------------------------------

  const handleValidateAssessment = async (assessmentId, status) => {
    const { value: comments } = await Swal.fire({
      title: status === 'approved' ? '✅ Approve Assessment' : '↩️ Return for Correction',
      input: 'textarea',
      inputLabel: 'HR Comments (optional)',
      inputPlaceholder: 'Enter your comments or reasons here...',
      showCancelButton: true,
      confirmButtonText: status === 'approved' ? 'Approve' : 'Return',
      confirmButtonColor: status === 'approved' ? '#16a34a' : '#d97706',
    });

    if (comments === undefined) return; // cancelled

    try {
      await api.put(`/reviews/assessments/${assessmentId}/validate`, { status, comments: comments || '' });
      Swal.fire({
        icon: 'success',
        title: status === 'approved' ? 'Assessment Approved' : 'Assessment Returned',
        text: status === 'approved' ? 'The assessment has been approved and finalized.' : 'The reviewer will be notified to correct and resubmit.',
        timer: 2000, showConfirmButton: false,
      });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', text: err.response?.data?.message || 'Failed to validate assessment' });
    }
  };

  const handleCalibrate = async (assessment) => {
    const { value: formValues } = await Swal.fire({
      title: '⚖️ Calibrate Rating',
      html: `
        <div style="text-align: left;">
          <p><strong>Employee:</strong> ${assessment.selfReview?.employee?.name}</p>
          <p><strong>Manager:</strong> ${assessment.reviewer?.name}</p>
          <p><strong>Proposed Rating:</strong> ${assessment.recommendation}</p>
          <p><strong>Overall Score:</strong> ${assessment.overallScore}</p>
          <hr/>
          <label>Calibrated Rating (1-5)</label>
          <input id="swal-input1" class="swal2-input" type="number" min="1" max="5" value="${assessment.calibratedRating || assessment.overallScore || ''}">
          <label>Final Recommendation</label>
          <select id="swal-input2" class="swal2-input">
            <option value="Meets Expectations" ${assessment.finalRating === 'Meets Expectations' ? 'selected' : ''}>Meets Expectations</option>
            <option value="Exceeds Expectations" ${assessment.finalRating === 'Exceeds Expectations' ? 'selected' : ''}>Exceeds Expectations</option>
            <option value="Outstanding" ${assessment.finalRating === 'Outstanding' ? 'selected' : ''}>Outstanding</option>
            <option value="Needs Improvement" ${assessment.finalRating === 'Needs Improvement' ? 'selected' : ''}>Needs Improvement</option>
            <option value="Needs Significant Improvement" ${assessment.finalRating === 'Needs Significant Improvement' ? 'selected' : ''}>Needs Significant Improvement</option>
          </select>
          <label>Calibration Reason / Comments</label>
          <textarea id="swal-input3" class="swal2-textarea" placeholder="Reason for calibration...">${assessment.calibrationReason || ''}</textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Save Calibration',
      preConfirm: () => {
        return {
          calibratedRating: document.getElementById('swal-input1').value,
          finalRating: document.getElementById('swal-input2').value,
          calibrationReason: document.getElementById('swal-input3').value,
        };
      }
    });

    if (formValues) {
      try {
        await api.put(`/reviews/assessments/${assessment._id}/calibrate`, {
          calibratedRating: Number(formValues.calibratedRating),
          finalRating: formValues.finalRating,
          calibrationReason: formValues.calibrationReason,
        });
        Swal.fire({ icon: 'success', title: 'Calibrated', timer: 1500, showConfirmButton: false });
        fetchData();
      } catch (err) {
        Swal.fire({ icon: 'error', text: err.response?.data?.message || 'Failed to calibrate' });
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Filtered employee list
  // ---------------------------------------------------------------------------

  const filteredEmployees = employees.filter((emp) => {
    const name = emp.user?.name?.toLowerCase() || '';
    const email = emp.user?.email?.toLowerCase() || '';
    const code = emp.employeeCode?.toLowerCase() || '';
    const search = empSearch.toLowerCase();
    const matchSearch = !empSearch || name.includes(search) || email.includes(search) || code.includes(search);
    const matchDept = !empDeptFilter || emp.department?._id === empDeptFilter;
    return matchSearch && matchDept;
  });

  // ---------------------------------------------------------------------------
  // Computed stats (from original)
  // ---------------------------------------------------------------------------

  const completedReviews = reviews.filter((r) => r.status === 'Completed').length;
  const hrAssistedReviews = reviews.filter((r) => r.status === 'HR Assisted').length;
  const pendingValidation = assessments.filter((a) => a.hrValidation?.status === 'pending').length;
  const approvedAssessments = assessments.filter((a) => a.hrValidation?.status === 'approved').length;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) return <main><p>Loading HR Portal...</p></main>;

  return (
    <main>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <div>
          <div className="page-eyebrow">People operations</div>
          <h1>HR Administration Portal</h1>
          <p>Oversee company-wide review cycles, monitor progress, and manage employee development plans.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ── Tab Navigation ── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1rem 0', borderBottom: '2px solid var(--border-color)' }}>
        {HR_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.55rem 1.1rem',
              border: 'none',
              background: activeTab === tab.key ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
              fontWeight: activeTab === tab.key ? '600' : '500',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontSize: '0.88rem',
              borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: DASHBOARD                                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <>
          {/* Metric Cards */}
          <div className="grid-3 dashboard-stats" style={{ marginTop: '1rem' }}>
            <div className="stat-card">
              <div className="label">Total Reviews</div>
              <div className="value">{reviews.length}</div>
            </div>
            <div className="stat-card">
              <div className="label">Completed Reviews</div>
              <div className="value" style={{ color: '#16a34a' }}>{completedReviews}</div>
            </div>
            <div className="stat-card">
              <div className="label">HR Assisted Cases</div>
              <div className="value" style={{ color: '#4f46e5' }}>{hrAssistedReviews}</div>
            </div>
            <div className="stat-card">
              <div className="label">Total Employees</div>
              <div className="value">{employees.length}</div>
            </div>
            <div className="stat-card">
              <div className="label">Pending Validation</div>
              <div className="value" style={{ color: '#d97706' }}>{pendingValidation}</div>
            </div>
            <div className="stat-card">
              <div className="label">Approved Assessments</div>
              <div className="value" style={{ color: '#16a34a' }}>{approvedAssessments}</div>
            </div>
          </div>

          {/* Quick actions */}
          <section className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
              <h2>Quick Actions</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" className="button" onClick={() => setActiveTab('employees')}>
                + Add Employee
              </button>
              <button type="button" className="button" onClick={() => { setActiveTab('plans'); setShowPlanModal(true); }}>
                + New Development Plan
              </button>
              <button type="button" className="button button-secondary" onClick={fetchData}>
                ↻ Refresh Data
              </button>
            </div>
          </section>

          {/* Recent reviews summary */}
          <section className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
              <h2>Recent Reviews</h2>
              <button className="button button-secondary button-sm" onClick={() => setActiveTab('reviews')}>View All →</button>
            </div>
            {reviews.length === 0 ? (
              <p className="empty-state">No reviews registered across the organization.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Cycle &amp; Year</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.slice(0, 5).map((rev) => (
                      <tr key={rev._id}>
                        <td><strong>{rev.employee?.name || 'Unknown'}</strong></td>
                        <td>{rev.cycle} {rev.year}</td>
                        <td>
                          <span className={`badge badge-${rev.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                            {rev.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: EMPLOYEES                                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'employees' && (
        <>
          <section className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="card-header">
              <h2>Employee Management</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="button button-secondary button-sm" onClick={fetchData}>↻ Refresh</button>
                <button
                  type="button"
                  className="button"
                  onClick={() => { setShowAddEmployee(!showAddEmployee); setEmpFormErrors({}); }}
                >
                  {showAddEmployee ? '✕ Cancel' : '+ Add Employee'}
                </button>
              </div>
            </div>

            {/* Add Employee Form */}
            {showAddEmployee && (
              <form onSubmit={handleAddEmployee} style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary)' }}>New Employee Account</h3>

                <div className="grid-2">
                  <label>
                    Full Name <span style={{ color: '#dc2626' }}>*</span>
                    <input
                      type="text" placeholder="e.g. John Smith"
                      value={empForm.name}
                      onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                    />
                    {empFormErrors.name && <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>{empFormErrors.name}</span>}
                  </label>

                  <label>
                    Email Address <span style={{ color: '#dc2626' }}>*</span>
                    <input
                      type="email" placeholder="john.smith@company.com"
                      value={empForm.email}
                      onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    />
                    {empFormErrors.email && <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>{empFormErrors.email}</span>}
                  </label>

                  <label>
                    Password <span style={{ color: '#dc2626' }}>*</span>
                    <input
                      type="password" placeholder="Min. 6 characters"
                      value={empForm.password}
                      onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })}
                    />
                    {empFormErrors.password && <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>{empFormErrors.password}</span>}
                  </label>

                  <label>
                    Employee Code <span style={{ color: '#dc2626' }}>*</span>
                    <input
                      type="text" placeholder="e.g. EMP-1042"
                      value={empForm.employeeCode}
                      onChange={(e) => setEmpForm({ ...empForm, employeeCode: e.target.value })}
                    />
                    {empFormErrors.employeeCode && <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>{empFormErrors.employeeCode}</span>}
                  </label>

                  <label>
                    Role
                    <select value={empForm.role} onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}>
                      {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </label>

                  <label>
                    Department
                    <select value={empForm.departmentId} onChange={(e) => setEmpForm({ ...empForm, departmentId: e.target.value })}>
                      <option value="">-- No Department --</option>
                      {orgData.departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </label>

                  <label>
                    Designation / Job Title
                    <select value={empForm.jobTitleId} onChange={(e) => setEmpForm({ ...empForm, jobTitleId: e.target.value })}>
                      <option value="">-- No Designation --</option>
                      {orgData.jobTitles.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}
                    </select>
                  </label>

                  <label>
                    Phone Number
                    <input
                      type="text" placeholder="+1-555-0100"
                      value={empForm.phoneNumber}
                      onChange={(e) => setEmpForm({ ...empForm, phoneNumber: e.target.value })}
                    />
                  </label>

                  <label>
                    Joining Date
                    <input
                      type="date"
                      value={empForm.joiningDate}
                      onChange={(e) => setEmpForm({ ...empForm, joiningDate: e.target.value })}
                    />
                  </label>

                  <label>
                    Employment Status
                    <select value={empForm.employmentStatus} onChange={(e) => setEmpForm({ ...empForm, employmentStatus: e.target.value })}>
                      {EMPLOYMENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </label>

                  <label>
                    Account Status
                    <select value={empForm.status} onChange={(e) => setEmpForm({ ...empForm, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                </div>

                <div className="button-group" style={{ marginTop: '1rem' }}>
                  <button type="submit" className="button" disabled={empSaving}>
                    {empSaving ? 'Creating...' : '✓ Create Employee'}
                  </button>
                  <button type="button" className="button-secondary" onClick={() => { setShowAddEmployee(false); setEmpFormErrors({}); }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Search / Filter Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by name, email, or code…"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                style={{ flex: '1', minWidth: '200px' }}
              />
              <select
                value={empDeptFilter}
                onChange={(e) => setEmpDeptFilter(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="">All Departments</option>
                {orgData.departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>

            {/* Employee Table */}
            {filteredEmployees.length === 0 ? (
              <p className="empty-state">
                {employees.length === 0
                  ? 'No employees yet. Click "+ Add Employee" to get started.'
                  : 'No employees match the current filter.'}
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Code</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Phone</th>
                      <th>Joining Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => (
                      <tr key={emp._id}>
                        <td><strong>{emp.user?.name || '—'}</strong></td>
                        <td style={{ fontSize: '0.82rem' }}>{emp.user?.email || '—'}</td>
                        <td><code style={{ fontSize: '0.8rem' }}>{emp.employeeCode}</code></td>
                        <td>{emp.department?.name || '—'}</td>
                        <td>{emp.jobTitle?.title || '—'}</td>
                        <td>{emp.phoneNumber || '—'}</td>
                        <td>{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '—'}</td>
                        <td>
                          <span className={`badge badge-${emp.employmentStatus === 'TERMINATED' ? 'not-completed' : 'completed'}`}>
                            {emp.employmentStatus?.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          {emp.employmentStatus !== 'TERMINATED' && (
                            <button
                              type="button"
                              className="button-danger button-sm"
                              onClick={() => handleTerminateEmployee(emp._id, emp.user?.name)}
                            >
                              Terminate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Showing {filteredEmployees.length} of {employees.length} employees
                </p>
              </div>
            )}
          </section>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: REVIEWS (original functionality preserved)            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'reviews' && (
        <section className="card">
          <div className="card-header">
            <h2>Organization-Wide Self-Reviews</h2>
            <button className="button button-secondary button-sm" onClick={fetchData}>↻ Refresh</button>
          </div>

          {reviews.length === 0 ? (
            <p className="empty-state">No reviews registered across the organization.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Cycle &amp; Year</th>
                    <th>Status</th>
                    <th>Assessment Status</th>
                    <th>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((rev) => (
                    <tr key={rev._id}>
                      <td>
                        <strong>{rev.employee?.name || 'Unknown'}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rev.employee?.email}</div>
                      </td>
                      <td>{rev.cycle} {rev.year}</td>
                      <td>
                        <span className={`badge badge-${rev.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                          {rev.status}
                        </span>
                      </td>
                      <td>
                        {rev.assessment ? (
                          <span className="badge badge-completed">
                            Assessed by {rev.assessment.reviewer?.name || 'Reviewer'}
                          </span>
                        ) : (
                          <span className="badge badge-pending">Pending Assessment</span>
                        )}
                      </td>
                      <td>
                        <select
                          style={{ display: 'inline-block', width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          value={rev.status}
                          onChange={(e) => handleUpdateStatus(rev._id, e.target.value)}
                        >
                          <option value="Completed">Completed</option>
                          <option value="Not Completed">Not Completed</option>
                          <option value="HR Assisted">HR Assisted</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: ASSESSMENTS (HR Validation)                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'assessments' && (
        <section className="card">
          <div className="card-header">
            <h2>Reviewer Assessments — HR Validation</h2>
            <button className="button button-secondary button-sm" onClick={fetchData}>↻ Refresh</button>
          </div>

          {assessments.length === 0 ? (
            <p className="empty-state">No assessments submitted yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Reviewer</th>
                    <th>Overall Score</th>
                    <th>Recommendation</th>
                    <th>HR Status</th>
                    <th>HR Comments</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a) => {
                    const hrStatus = a.hrValidation?.status || 'pending';
                    return (
                      <tr key={a._id}>
                        <td>
                          <strong>{a.selfReview?.employee?.name || '—'}</strong>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {a.selfReview?.employee?.email}
                          </div>
                        </td>
                        <td>{a.reviewer?.name || '—'}</td>
                        <td>
                          {a.overallScore != null
                            ? <strong>{a.overallScore.toFixed(1)} / 5</strong>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>
                          }
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem' }}>{a.recommendation || '—'}</span>
                        </td>
                        <td>
                          <span className={`badge badge-${hrStatus === 'approved' ? 'completed' : hrStatus === 'returned' ? 'not-completed' : 'pending'}`}>
                            {hrStatus.charAt(0).toUpperCase() + hrStatus.slice(1)}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', maxWidth: '200px' }}>
                          {a.hrValidation?.comments || '—'}
                        </td>
                        <td>
                          {!a.isFinalized ? (
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                style={{ padding: '0.25rem 0.6rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                onClick={() => handleValidateAssessment(a._id, 'approved')}
                              >
                                ✅ Approve
                              </button>
                              <button
                                type="button"
                                style={{ padding: '0.25rem 0.6rem', background: '#d97706', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                onClick={() => handleValidateAssessment(a._id, 'returned')}
                              >
                                ↩️ Return
                              </button>
                            </div>
                          ) : (
                            <span className="badge badge-completed" style={{ fontSize: '0.75rem' }}>Finalized</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: CALIBRATION                                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'calibration' && (
        <section className="card">
          <div className="card-header">
            <h2>Organization Calibration</h2>
            <button className="button button-secondary button-sm" onClick={fetchData}>↻ Refresh</button>
          </div>

          {assessments.length === 0 ? (
            <p className="empty-state">No assessments submitted yet for calibration.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Manager</th>
                    <th>Goal Score</th>
                    <th>Competency Score</th>
                    <th>Proposed Rating</th>
                    <th>Calibrated Rating</th>
                    <th>Final Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a) => (
                    <tr key={a._id}>
                      <td>
                        <strong>{a.selfReview?.employee?.name || '—'}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.selfReview?.employee?.email}</div>
                      </td>
                      <td>{a.reviewer?.name || '—'}</td>
                      <td>{a.goalScore?.toFixed(1) || '—'}</td>
                      <td>{a.competencyAverage?.toFixed(1) || '—'}</td>
                      <td>{a.recommendation || '—'}</td>
                      <td>
                        {a.calibratedRating ? (
                          <strong style={{ color: 'var(--primary)' }}>{a.calibratedRating.toFixed(1)}</strong>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        {a.finalRating ? (
                          <span className="badge badge-active">{a.finalRating}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="button button-sm"
                          onClick={() => handleCalibrate(a)}
                        >
                          ⚖️ Calibrate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: DEVELOPMENT PLANS (original functionality preserved)  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'plans' && (
        <>
          <section className="card">
            <div className="card-header">
              <h2>Development Plans</h2>
              <button
                type="button"
                className="button"
                onClick={() => setShowPlanModal(!showPlanModal)}
              >
                {showPlanModal ? 'Close Plan Form' : '+ New Development Plan'}
              </button>
            </div>

            {/* Create Plan Form (preserved exactly) */}
            {showPlanModal && (
              <div style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>Assign New Development Plan</h3>
                <form onSubmit={handleCreatePlan}>
                  <div className="grid-2">
                    <label>
                      Select Employee
                      <select
                        required
                        value={planForm.employee}
                        onChange={(e) => setPlanForm({ ...planForm, employee: e.target.value })}
                      >
                        <option value="">-- Choose employee --</option>
                        {users
                          .filter((u) => u.role === 'Employee' || u.role === 'EMPLOYEE')
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                      </select>
                    </label>

                    <label>
                      Cycle
                      <select
                        value={planForm.cycle}
                        onChange={(e) => setPlanForm({ ...planForm, cycle: e.target.value })}
                      >
                        <option value="April">April Cycle</option>
                        <option value="September">September Cycle</option>
                      </select>
                    </label>
                  </div>

                  <label>
                    Development Priorities
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. Communication, System Architecture, Leadership skills"
                      value={planForm.priorities}
                      onChange={(e) => setPlanForm({ ...planForm, priorities: e.target.value })}
                    />
                  </label>

                  <label>
                    Target Milestones &amp; Action Items (One per line)
                    <textarea
                      rows={3}
                      placeholder="Complete Cloud Certification&#10;Lead bi-weekly architectural review"
                      value={planForm.goals}
                      onChange={(e) => setPlanForm({ ...planForm, goals: e.target.value })}
                    />
                  </label>

                  <div className="grid-2">
                    <label>
                      Follow-up Date
                      <input
                        type="date"
                        value={planForm.followUpDate}
                        onChange={(e) => setPlanForm({ ...planForm, followUpDate: e.target.value })}
                      />
                    </label>
                    <label>
                      Follow-up Status
                      <select
                        value={planForm.followUpStatus}
                        onChange={(e) => setPlanForm({ ...planForm, followUpStatus: e.target.value })}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </label>
                  </div>

                  <div className="button-group">
                    <button type="submit">Save &amp; Assign Plan</button>
                    <button type="button" className="button-secondary" onClick={() => setShowPlanModal(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Plans Table (preserved exactly) */}
            {plans.length === 0 ? (
              <p className="empty-state">No development plans have been assigned yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Cycle</th>
                      <th>Priorities</th>
                      <th>Action Items</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((p) => (
                      <Fragment key={p._id}>
                      <tr>
                        <td><strong>{p.employee?.name || 'N/A'}</strong></td>
                        <td>{p.cycle}</td>
                        <td>{p.priorities || '—'}</td>
                        <td>{p.goals?.join('; ') || '—'}</td>
                        <td>
                          <span className={`badge badge-${p.followUpStatus?.toLowerCase().replace(/\s+/g, '-')}`}>
                            {p.followUpStatus}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="button-danger button-sm"
                            onClick={() => handleDeletePlan(p._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      <tr><td colSpan="6"><AttachmentPanel endpoint={`/reviews/development-plans/${p._id}/attachments`} title="Plan evidence & documents" /></td></tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
