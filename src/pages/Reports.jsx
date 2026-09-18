import { useEffect, useMemo, useState } from 'react';
import api from '../api';

const REPORTS = [
  ['completion', 'Review Completion'], ['department-performance', 'Department Performance'], ['rating-distribution', 'Rating Distribution'], ['goal-achievement', 'Goal Achievement'], ['development-plan', 'Development Plan'], ['manager-completion', 'Manager Completion'], ['review-history', 'Review History'], ['calibration', 'Calibration'], ['overdue-review', 'Overdue Review'], ['progress-check', 'Progress Check'],
];
const label = (key) => REPORTS.find(([id]) => id === key)?.[1] || key;
const format = (value) => value == null || value === '' ? '—' : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value instanceof Date ? value.toLocaleDateString() : String(value);

export default function Reports() {
  const [report, setReport] = useState('completion');
  const [filters, setFilters] = useState({ cycle: '', year: '', department: '' });
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setLoading(true); const params = { report, ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) }; const response = await api.get('/reports', { params }); setData(response.data.data || []); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [report]);
  useEffect(() => { api.get('/v1/organization').then((response) => setDepartments(response.data.data?.departments || [])).catch(() => {}); }, []);
  const columns = useMemo(() => [...new Set(data.flatMap((row) => Object.keys(row)))], [data]);
  const csv = () => { const escape = (value) => `"${format(value).replaceAll('"', '""')}"`; const text = [columns.join(','), ...data.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n'); const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8;' })); const a = document.createElement('a'); a.href = url; a.download = `${report}-report.csv`; a.click(); URL.revokeObjectURL(url); };
  return <main><div className="page-header"><div><div className="page-eyebrow">Analytics</div><h1>CARE Reports</h1><p>Live reports derived from CARE reviews, ratings, development plans, cycles, and progress checks.</p></div><div className="page-actions"><button className="button button-secondary" onClick={csv} disabled={!data.length}>Export CSV / Excel</button><button className="button button-secondary" onClick={() => window.print()}>Export PDF</button></div></div><section className="card report-filters"><div className="grid-2"><label>Report<select value={report} onChange={(event) => setReport(event.target.value)}>{REPORTS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><label>Cycle<select value={filters.cycle} onChange={(event) => setFilters({ ...filters, cycle: event.target.value })}><option value="">All cycles</option><option>April</option><option>September</option></select></label><label>Year<input type="number" placeholder="All years" value={filters.year} onChange={(event) => setFilters({ ...filters, year: event.target.value })} /></label><label>Department<select value={filters.department} onChange={(event) => setFilters({ ...filters, department: event.target.value })}><option value="">All departments</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}</select></label></div><button className="button" onClick={load}>Apply filters</button></section><section className="card data-card"><div className="card-header"><div><h2>{label(report)}</h2><p>{data.length} result{data.length === 1 ? '' : 's'}</p></div></div>{loading ? <p>Loading report…</p> : !data.length ? <div className="empty-state"><p>No data matches these filters.</p></div> : <div className="report-table"><table><thead><tr>{columns.map((column) => <th key={column}>{column.replaceAll(/([A-Z])/g, ' $1')}</th>)}</tr></thead><tbody>{data.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column}>{format(row[column])}</td>)}</tr>)}</tbody></table></div>}</section></main>;
}
