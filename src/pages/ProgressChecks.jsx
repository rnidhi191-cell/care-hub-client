import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import api from '../api';

const blankForm = { employee: '', developmentPlan: '', dueDate: '', goalProgress: [], developmentProgress: '', achievements: '', challenges: '', supportRequired: '', newGoals: '', employeeComments: '', managerComments: '', status: 'PENDING' };
const dateValue = (date) => date ? new Date(date).toISOString().slice(0, 10) : '';

export default function ProgressChecks() {
  const [checks, setChecks] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const employees = useMemo(() => users.filter((user) => user.role === 'EMPLOYEE'), [users]);
  const eligiblePlans = useMemo(() => plans.filter((plan) => !form.employee || (plan.employee?._id || plan.employee) === form.employee), [plans, form.employee]);
  const load = async () => {
    try {
      setLoading(true);
      const [checksRes, usersRes, plansRes] = await Promise.all([api.get('/progress-checks'), api.get('/auth/users'), api.get('/reviews/development-plans')]);
      setChecks(checksRes.data.data || []); setUsers(usersRes.data.data || []); setPlans(plansRes.data.data || []);
    } catch (error) { Swal.fire({ icon: 'error', text: error.response?.data?.message || 'Could not load progress checks.' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const startCreate = () => { const dueDate = new Date(); dueDate.setMonth(dueDate.getMonth() + 3); setForm({ ...blankForm, dueDate: dateValue(dueDate) }); setEditing(null); setShowForm(true); };
  const startEdit = (check) => {
    setEditing(check);
    setForm({ employee: check.employee?._id || check.employee, developmentPlan: check.developmentPlan?._id || '', dueDate: dateValue(check.dueDate), goalProgress: check.goalProgress || [], developmentProgress: check.developmentProgress || '', achievements: check.achievements || '', challenges: check.challenges || '', supportRequired: check.supportRequired || '', newGoals: (check.newGoals || []).join('\n'), employeeComments: check.employeeComments || '', managerComments: check.managerComments || '', status: check.status });
    setShowForm(true);
  };
  const save = async (event) => {
    event.preventDefault();
    const payload = { ...form, newGoals: form.newGoals.split('\n').map((goal) => goal.trim()).filter(Boolean) };
    try {
      if (editing) await api.put(`/progress-checks/${editing._id}`, payload);
      else await api.post('/progress-checks', payload);
      await Swal.fire({ icon: 'success', title: editing ? 'Progress check updated' : 'Progress check scheduled', timer: 1200, showConfirmButton: false });
      setShowForm(false); setEditing(null); load();
    } catch (error) { Swal.fire({ icon: 'error', text: error.response?.data?.message || 'Could not save progress check.' }); }
  };
  const statusClass = (status) => `badge badge-${status.toLowerCase()}`;

  return <main>
    <div className="page-header"><div><div className="page-eyebrow">Employee development</div><h1>3–6 Month Progress Checks</h1><p>Schedule and record follow-up progress against CARE ratings, goals, and development plans.</p></div><div className="page-actions"><button className="button button-secondary" onClick={load}>Refresh</button><button className="button" onClick={startCreate}>+ Schedule progress check</button></div></div>
    {showForm && <section className="card progress-check-form"><div className="card-header"><div><h2>{editing ? 'Update progress check' : 'Schedule progress check'}</h2><p>CARE context is automatically attached from the employee’s latest review and selected development plan.</p></div><button className="button button-secondary button-sm" onClick={() => setShowForm(false)}>Cancel</button></div><form onSubmit={save}><div className="grid-2"><label>Employee<select required disabled={Boolean(editing)} value={form.employee} onChange={(event) => setForm({ ...form, employee: event.target.value, developmentPlan: '' })}><option value="">Select employee</option>{employees.map((employee) => <option key={employee._id || employee.id} value={employee._id || employee.id}>{employee.name} — {employee.email}</option>)}</select></label><label>Progress-check due date<input required type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label></div><label>Development plan<select value={form.developmentPlan} onChange={(event) => setForm({ ...form, developmentPlan: event.target.value })}><option value="">Use latest development plan</option>{eligiblePlans.map((plan) => <option key={plan._id} value={plan._id}>{plan.cycle} {plan.year} — {plan.priorities || 'Development plan'}</option>)}</select></label>{editing && <><div className="grid-2"><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="PENDING">Pending</option><option value="COMPLETED">Completed</option><option value="OVERDUE">Overdue</option></select></label><label>Development progress<textarea rows="2" value={form.developmentProgress} onChange={(event) => setForm({ ...form, developmentProgress: event.target.value })} /></label></div><h3>Goal progress</h3>{form.goalProgress.map((goal, index) => <div className="grid-3 progress-goal-editor" key={`${goal.goal}-${index}`}><label>Goal<input value={goal.goal} onChange={(event) => setForm({ ...form, goalProgress: form.goalProgress.map((item, i) => i === index ? { ...item, goal: event.target.value } : item) })} /></label><label>Progress %<input type="number" min="0" max="100" value={goal.progress ?? 0} onChange={(event) => setForm({ ...form, goalProgress: form.goalProgress.map((item, i) => i === index ? { ...item, progress: Number(event.target.value) } : item) })} /></label><label>Status<select value={goal.status || 'Not Started'} onChange={(event) => setForm({ ...form, goalProgress: form.goalProgress.map((item, i) => i === index ? { ...item, status: event.target.value } : item) })}><option>Not Started</option><option>In Progress</option><option>Completed</option><option>Blocked</option></select></label></div>)}<button type="button" className="button button-secondary button-sm" onClick={() => setForm({ ...form, goalProgress: [...form.goalProgress, { goal: '', progress: 0, status: 'Not Started', comments: '' }] })}>+ Add goal progress</button><div className="grid-2"><label>Achievements<textarea rows="3" value={form.achievements} onChange={(event) => setForm({ ...form, achievements: event.target.value })} /></label><label>Challenges<textarea rows="3" value={form.challenges} onChange={(event) => setForm({ ...form, challenges: event.target.value })} /></label><label>Support required<textarea rows="3" value={form.supportRequired} onChange={(event) => setForm({ ...form, supportRequired: event.target.value })} /></label><label>New goals (one per line)<textarea rows="3" value={form.newGoals} onChange={(event) => setForm({ ...form, newGoals: event.target.value })} /></label><label>Employee comments<textarea rows="3" value={form.employeeComments} onChange={(event) => setForm({ ...form, employeeComments: event.target.value })} /></label><label>Manager comments<textarea rows="3" value={form.managerComments} onChange={(event) => setForm({ ...form, managerComments: event.target.value })} /></label></div></>}<div className="button-group"><button type="submit">{editing ? 'Save progress check' : 'Schedule check'}</button><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Cancel</button></div></form></section>}
    <section className="card data-card"><div className="card-header"><div><h2>Progress checks</h2><p>Pending checks automatically become overdue after their due date.</p></div></div>{loading ? <p>Loading progress checks...</p> : checks.length === 0 ? <div className="empty-state"><p>No progress checks are scheduled yet.</p></div> : <div className="progress-check-list">{checks.map((check) => <article className="progress-check-card" key={check._id}><div className="card-header"><div><span className={statusClass(check.status)}>{check.status}</span><h3>{check.employee?.name}</h3><p>Due {new Date(check.dueDate).toLocaleDateString('en-GB')} {check.manager?.name ? `· Manager: ${check.manager.name}` : ''}</p></div><button className="button button-secondary button-sm" onClick={() => startEdit(check)}>Update</button></div><div className="grid-3 progress-check-summary"><div><strong>Previous rating</strong><span>{check.previousRating?.score ?? '—'} {check.previousRating?.label || ''}</span></div><div><strong>Development plan</strong><span>{check.developmentPlan?.priorities || 'No plan linked'}</span></div><div><strong>Goals</strong><span>{check.previousGoals?.length || 0} CARE goals</span></div></div>{check.goalProgress?.length > 0 && <div className="progress-goals"><strong>Goal progress</strong>{check.goalProgress.map((goal, index) => <p key={`${goal.goal}-${index}`}>{goal.goal}: {goal.progress}% · {goal.status}</p>)}</div>}<div className="progress-check-notes">{check.achievements && <p><strong>Achievements:</strong> {check.achievements}</p>}{check.challenges && <p><strong>Challenges:</strong> {check.challenges}</p>}{check.supportRequired && <p><strong>Support required:</strong> {check.supportRequired}</p>}</div></article>)}</div>}</section>
  </main>;
}
