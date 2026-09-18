import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import api from '../api';
import { selectCurrentUser } from '../store/slices/authSlice';

const emptyForm = {
  title: '', cycleName: 'April', year: new Date().getFullYear(), startDate: '', endDate: '',
  selfReviewDeadline: '', reviewerDeadline: '', hrValidationDeadline: '', calibrationStartDate: '',
  calibrationEndDate: '', discussionStartDate: '', discussionEndDate: '', finalizationDate: '', acknowledgementDeadline: '',
};

const dateValue = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');
const displayDate = (value) => value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function ReviewCycles() {
  const user = useSelector(selectCurrentUser);
  const canManage = ['ADMIN', 'HR'].includes(user?.role?.toUpperCase());
  const [cycles, setCycles] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [assignmentCycle, setAssignmentCycle] = useState(null);
  const [assignments, setAssignments] = useState([]);

  const employees = useMemo(() => people.filter((person) => person.role === 'EMPLOYEE'), [people]);
  const managers = useMemo(() => people.filter((person) => person.role === 'MANAGER'), [people]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const requests = [api.get('/review-cycles')];
      if (canManage) requests.push(api.get('/auth/users'));
      const [cyclesRes, usersRes] = await Promise.all(requests);
      setCycles(cyclesRes.data?.data || []);
      if (usersRes) setPeople(usersRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Unable to load review cycles');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };
  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSaveCycle = async (event) => {
    event.preventDefault();
    try {
      if (editingId) await api.put(`/review-cycles/${editingId}`, form);
      else await api.post('/review-cycles', form);
      await Swal.fire({ icon: 'success', title: editingId ? 'Cycle updated' : 'Cycle created', timer: 1200, showConfirmButton: false });
      resetForm();
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Could not save cycle', text: err.response?.data?.message || 'Check the cycle details and dates.' });
    }
  };

  const startEdit = (cycle) => {
    const next = { ...emptyForm };
    Object.keys(next).forEach((field) => { next[field] = ['year'].includes(field) ? cycle[field] : DATE_FIELDS.includes(field) ? dateValue(cycle[field]) : cycle[field] || ''; });
    setForm(next); setEditingId(cycle._id); setShowForm(true);
  };

  const openAssignments = (cycle) => {
    setAssignmentCycle(cycle);
    setAssignments(cycle.assignments.map((item) => ({ employee: item.employee?._id || item.employee, reviewer: item.reviewer?._id || item.reviewer || '' })));
  };

  const saveAssignments = async () => {
    try {
      await api.put(`/review-cycles/${assignmentCycle._id}/assignments`, { assignments });
      await Swal.fire({ icon: 'success', title: 'Assignments saved', timer: 1200, showConfirmButton: false });
      setAssignmentCycle(null); setAssignments([]); fetchData();
    } catch (err) { Swal.fire({ icon: 'error', title: 'Could not save assignments', text: err.response?.data?.message || 'Check each employee and reviewer.' }); }
  };

  const changeStatus = async (cycle, action) => {
    const verb = action === 'launch' ? 'launch' : 'close';
    const result = await Swal.fire({ title: `${verb[0].toUpperCase()}${verb.slice(1)} this cycle?`, text: action === 'launch' ? 'Assigned employees can now begin their reviews.' : 'No additional cycle changes will be allowed.', icon: 'warning', showCancelButton: true, confirmButtonText: `Yes, ${verb}` });
    if (!result.isConfirmed) return;
    try { await api.put(`/review-cycles/${cycle._id}/${action}`); fetchData(); }
    catch (err) { Swal.fire({ icon: 'error', text: err.response?.data?.message || `Could not ${verb} cycle.` }); }
  };

  return (
    <main>
      <div className="page-header">
        <div><div className="page-eyebrow">Performance operations</div><h1>Review Cycles</h1><p>{canManage ? 'Create, schedule, assign, and monitor each CARE review cycle.' : 'Track the review cycles and employees assigned to you.'}</p></div>
        {canManage && <div className="page-actions"><button className="button" onClick={() => { resetForm(); setShowForm(true); }}>+ Create review cycle</button></div>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {canManage && showForm && (
        <section className="card cycle-form-card">
          <div className="card-header"><div><h2>{editingId ? 'Edit review cycle' : 'New review cycle'}</h2><p>Set the period and CARE workflow deadlines before assigning people.</p></div><button type="button" className="button button-secondary button-sm" onClick={resetForm}>Cancel</button></div>
          <form onSubmit={handleSaveCycle}>
            <div className="grid-2"><label>Cycle title<input name="title" required value={form.title} onChange={updateForm} placeholder="e.g. April 2026 Performance Review" /></label><label>Cycle and year<div className="grid-2 cycle-inline-fields"><select name="cycleName" value={form.cycleName} onChange={updateForm}><option value="April">April</option><option value="September">September</option></select><input name="year" type="number" min="2000" value={form.year} onChange={updateForm} required /></div></label></div>
            <h3>Review period and deadlines</h3>
            <div className="grid-2">{DATE_FIELDS.map((field) => <label key={field}>{DATE_LABELS[field]}<input name={field} type="date" required={REQUIRED_DATE_FIELDS.includes(field)} value={form[field]} onChange={updateForm} /></label>)}</div>
            <div className="button-group"><button type="submit">{editingId ? 'Save changes' : 'Create draft cycle'}</button><button type="button" className="button button-secondary" onClick={resetForm}>Cancel</button></div>
          </form>
        </section>
      )}

      {canManage && assignmentCycle && (
        <section className="card cycle-form-card">
          <div className="card-header"><div><h2>Assign people: {assignmentCycle.title}</h2><p>Each employee can have one assigned manager for this review cycle.</p></div><button type="button" className="button button-secondary button-sm" onClick={() => setAssignmentCycle(null)}>Close</button></div>
          <div className="assignment-list">{assignments.map((assignment, index) => <div className="assignment-row" key={`${assignment.employee}-${index}`}><select value={assignment.employee} onChange={(e) => setAssignments((items) => items.map((item, i) => i === index ? { ...item, employee: e.target.value } : item))}><option value="">Select employee</option>{employees.map((employee) => <option key={employee.id || employee._id} value={employee.id || employee._id}>{employee.name} — {employee.email}</option>)}</select><select value={assignment.reviewer} onChange={(e) => setAssignments((items) => items.map((item, i) => i === index ? { ...item, reviewer: e.target.value } : item))}><option value="">Select manager</option>{managers.map((manager) => <option key={manager.id || manager._id} value={manager.id || manager._id}>{manager.name}</option>)}</select><button type="button" className="button-danger button-sm" onClick={() => setAssignments((items) => items.filter((_, i) => i !== index))}>Remove</button></div>)}</div>
          <div className="button-group"><button type="button" className="button button-secondary" onClick={() => setAssignments((items) => [...items, { employee: '', reviewer: '' }])}>+ Add employee</button><button type="button" onClick={saveAssignments} disabled={!assignments.length}>Save assignments</button></div>
        </section>
      )}

      <section className="card data-card">
        <div className="card-header"><div><h2>{canManage ? 'Cycle management' : 'My assigned cycles'}</h2><p>Completion figures are calculated from the existing CARE reviews and assessments.</p></div><button type="button" className="button button-secondary button-sm" onClick={fetchData}>Refresh</button></div>
      {loading ? <p>Loading review cycles...</p> : cycles.length === 0 ? <div className="empty-state"><p>{canManage ? 'Create your first draft review cycle to begin.' : 'No employees have been assigned to your review cycles yet.'}</p></div> : <div className="cycle-list">{cycles.map((cycle) => <article className="cycle-card" key={cycle._id}><div className="cycle-card__heading"><div><span className={`badge cycle-status cycle-status--${cycle.status.toLowerCase()}`}>{cycle.status}</span><h3>{cycle.title}</h3><p>{cycle.cycleName} {cycle.year} · {displayDate(cycle.startDate)} – {displayDate(cycle.endDate)}</p></div>{canManage && <div className="button-group"><button className="button button-secondary button-sm" onClick={() => startEdit(cycle)} disabled={cycle.status !== 'DRAFT'}>Edit</button><button className="button button-secondary button-sm" onClick={() => openAssignments(cycle)} disabled={cycle.status !== 'DRAFT'}>Assignments</button>{cycle.status === 'DRAFT' && <button className="button button-sm" onClick={() => changeStatus(cycle, 'launch')}>Launch</button>}{cycle.status === 'ACTIVE' && <button className="button-danger button-sm" onClick={() => changeStatus(cycle, 'close')}>Close cycle</button>}</div>}</div><div className="cycle-deadlines"><span>Self review <strong>{displayDate(cycle.selfReviewDeadline)}</strong></span><span>Reviewer <strong>{displayDate(cycle.reviewerDeadline)}</strong></span><span>HR validation <strong>{displayDate(cycle.hrValidationDeadline)}</strong></span><span>Calibration <strong>{displayDate(cycle.calibrationStartDate)} – {displayDate(cycle.calibrationEndDate)}</strong></span><span>Discussion <strong>{displayDate(cycle.discussionStartDate)} – {displayDate(cycle.discussionEndDate)}</strong></span><span>Finalization <strong>{displayDate(cycle.finalizationDate)}</strong></span><span>Acknowledgement <strong>{displayDate(cycle.acknowledgementDeadline)}</strong></span></div><div className="cycle-monitoring"><div><strong>{cycle.monitoring.assignedEmployees}</strong><span>Assigned</span></div><div><strong>{cycle.monitoring.selfReviewsCompleted}</strong><span>Self-reviews</span></div><div><strong>{cycle.monitoring.reviewerAssessmentsCompleted}</strong><span>Assessments</span></div><div><strong>{cycle.monitoring.finalizedRatings}</strong><span>Finalized</span></div><div><strong>{cycle.monitoring.acknowledgementsCompleted}</strong><span>Acknowledged</span></div></div>{cycle.monitoring.assignmentProgress?.length > 0 && <div className="cycle-progress"><strong>{canManage ? 'Assignment completion' : 'My assigned employees'}</strong><div className="cycle-progress__table"><table><thead><tr><th>Employee</th><th>Reviewer</th><th>Self-review</th><th>Assessment</th><th>Finalized</th><th>Acknowledged</th></tr></thead><tbody>{cycle.monitoring.assignmentProgress.map((item) => <tr key={item.employee?._id || item.employee}><td>{item.employee?.name || 'Employee'}</td><td>{item.reviewer?.name || 'Unassigned'}</td><td>{item.selfReviewCompleted ? item.selfReviewStatus : 'Not started'}</td><td>{item.reviewerAssessmentCompleted ? 'Complete' : 'Pending'}</td><td>{item.finalized ? 'Complete' : 'Pending'}</td><td>{item.acknowledged ? 'Complete' : 'Pending'}</td></tr>)}</tbody></table></div></div>}</article>)}</div>}
      </section>
    </main>
  );
}

const DATE_FIELDS = ['startDate', 'endDate', 'selfReviewDeadline', 'reviewerDeadline', 'hrValidationDeadline', 'calibrationStartDate', 'calibrationEndDate', 'discussionStartDate', 'discussionEndDate', 'finalizationDate', 'acknowledgementDeadline'];
const REQUIRED_DATE_FIELDS = DATE_FIELDS.slice(0, 5);
const DATE_LABELS = { startDate: 'Review period starts', endDate: 'Review period ends', selfReviewDeadline: 'Self-review deadline', reviewerDeadline: 'Reviewer deadline', hrValidationDeadline: 'HR validation deadline', calibrationStartDate: 'Calibration starts', calibrationEndDate: 'Calibration ends', discussionStartDate: 'Discussion starts', discussionEndDate: 'Discussion ends', finalizationDate: 'Finalization date', acknowledgementDeadline: 'Acknowledgement deadline' };
