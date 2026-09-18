import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  ShieldCheck,
  BookOpen,
  UserCheck,
  Settings,
  CalendarDays,
} from 'lucide-react';
import Logo from '../Logo';

export default function Sidebar({ user, isCollapsed, onToggle }) {
  if (!user) return null;

  const role = user.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isHR = role === 'HR';
  const isManager = role === 'MANAGER';
  const isEmployee =
    role === 'EMPLOYEE';

  return (
    <aside
      className="app-sidebar"
      style={{
        width: isCollapsed ? '72px' : '240px',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        borderRight: '1px solid #1e293b',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '1.25rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <Logo compact={isCollapsed} showName={false} />
        <button
          type="button"
          onClick={onToggle}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '0.35rem',
            borderRadius: '4px',
            margin: 0,
          }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '1rem 0.5rem', flex: 1 }}>
        {/* Employee Section */}
        {isEmployee && (
          <div style={{ marginBottom: '1.25rem' }}>
            {!isCollapsed && (
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#64748b',
                  padding: '0.4rem 0.75rem',
                  letterSpacing: '0.05em',
                }}
              >
                Employee Portal
              </div>
            )}
            <NavLink
              to="/employee"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.75rem',
                borderRadius: '6px',
                color: isActive ? '#38bdf8' : '#cbd5e1',
                backgroundColor: isActive ? '#1e293b' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                marginBottom: '0.25rem',
              })}
            >
              <LayoutDashboard size={18} />
              {!isCollapsed && <span>My Dashboard</span>}
            </NavLink>

            <NavLink
              to="/self-review"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.75rem',
                borderRadius: '6px',
                color: isActive ? '#38bdf8' : '#cbd5e1',
                backgroundColor: isActive ? '#1e293b' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                marginBottom: '0.25rem',
              })}
            >
              <FileText size={18} />
              {!isCollapsed && <span>Self-Review (CARE)</span>}
            </NavLink>
          </div>
        )}

        {/* Manager Section */}
        {isManager && (
          <div style={{ marginBottom: '1.25rem' }}>
            {!isCollapsed && (
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#64748b',
                  padding: '0.4rem 0.75rem',
                  letterSpacing: '0.05em',
                }}
              >
                Management
              </div>
            )}
            <NavLink
              to="/reviewer"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.75rem',
                borderRadius: '6px',
                color: isActive ? '#38bdf8' : '#cbd5e1',
                backgroundColor: isActive ? '#1e293b' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                marginBottom: '0.25rem',
              })}
            >
              <UserCheck size={18} />
              {!isCollapsed && <span>Reviewer Portal</span>}
            </NavLink>

            <NavLink
              to="/reviewer/assessment"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.75rem',
                borderRadius: '6px',
                color: isActive ? '#38bdf8' : '#cbd5e1',
                backgroundColor: isActive ? '#1e293b' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                marginBottom: '0.25rem',
              })}
            >
              <ClipboardCheck size={18} />
              {!isCollapsed && <span>Assess Review</span>}
            </NavLink>
            <NavLink
              to="/cycles"
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '6px',
                color: isActive ? '#38bdf8' : '#cbd5e1', backgroundColor: isActive ? '#1e293b' : 'transparent', textDecoration: 'none', fontSize: '0.9rem', fontWeight: isActive ? 600 : 500, marginBottom: '0.25rem',
              })}
            >
              <CalendarDays size={18} />
              {!isCollapsed && <span>Review Cycles</span>}
            </NavLink>
          </div>
        )}
        {/* Admin Section */}
        {isAdmin && (
          <div style={{ marginBottom: '1.25rem' }}>
            {!isCollapsed && (
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#64748b',
                  padding: '0.4rem 0.75rem',
                  letterSpacing: '0.05em',
                }}
              >
                Admin Panel
              </div>
            )}

            <NavLink
              to="/admin"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.75rem',
                borderRadius: '6px',
                color: isActive ? '#38bdf8' : '#cbd5e1',
                backgroundColor: isActive ? '#1e293b' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                marginBottom: '0.25rem',
              })}
            >
              <Settings size={18} />
              {!isCollapsed && <span>Admin Dashboard</span>}
            </NavLink>
            <NavLink
              to="/cycles"
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '6px',
                color: isActive ? '#38bdf8' : '#cbd5e1', backgroundColor: isActive ? '#1e293b' : 'transparent', textDecoration: 'none', fontSize: '0.9rem', fontWeight: isActive ? 600 : 500, marginBottom: '0.25rem',
              })}
            >
              <CalendarDays size={18} />
              {!isCollapsed && <span>Review Cycles</span>}
            </NavLink>
            <NavLink to="/progress-checks" style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '6px', color: isActive ? '#38bdf8' : '#cbd5e1', backgroundColor: isActive ? '#1e293b' : 'transparent', textDecoration: 'none', fontSize: '0.9rem', fontWeight: isActive ? 600 : 500, marginBottom: '0.25rem' })}><ClipboardCheck size={18} />{!isCollapsed && <span>Progress Checks</span>}</NavLink>
            <NavLink to="/reports" style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '6px', color: isActive ? '#38bdf8' : '#cbd5e1', backgroundColor: isActive ? '#1e293b' : 'transparent', textDecoration: 'none', fontSize: '0.9rem', fontWeight: isActive ? 600 : 500, marginBottom: '0.25rem' })}><LayoutDashboard size={18} />{!isCollapsed && <span>Reports</span>}</NavLink>
          </div>
        )}
        {/* HR Section */}
        {isHR && (
          <div style={{ marginBottom: '1.25rem' }}>
            {!isCollapsed && (
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#64748b',
                  padding: '0.4rem 0.75rem',
                  letterSpacing: '0.05em',
                }}
              >
                Administration
              </div>
            )}
            <NavLink
              to="/hr"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.75rem',
                borderRadius: '6px',
                color: isActive ? '#38bdf8' : '#cbd5e1',
                backgroundColor: isActive ? '#1e293b' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                marginBottom: '0.25rem',
              })}
            >
              <ShieldCheck size={18} />
              {!isCollapsed && <span>HR Dashboard</span>}
            </NavLink>
            <NavLink
              to="/cycles"
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '6px',
                color: isActive ? '#38bdf8' : '#cbd5e1', backgroundColor: isActive ? '#1e293b' : 'transparent', textDecoration: 'none', fontSize: '0.9rem', fontWeight: isActive ? 600 : 500, marginBottom: '0.25rem',
              })}
            >
              <CalendarDays size={18} />
              {!isCollapsed && <span>Review Cycles</span>}
            </NavLink>
            <NavLink to="/progress-checks" style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '6px', color: isActive ? '#38bdf8' : '#cbd5e1', backgroundColor: isActive ? '#1e293b' : 'transparent', textDecoration: 'none', fontSize: '0.9rem', fontWeight: isActive ? 600 : 500, marginBottom: '0.25rem' })}><ClipboardCheck size={18} />{!isCollapsed && <span>Progress Checks</span>}</NavLink>
            <NavLink to="/reports" style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: '6px', color: isActive ? '#38bdf8' : '#cbd5e1', backgroundColor: isActive ? '#1e293b' : 'transparent', textDecoration: 'none', fontSize: '0.9rem', fontWeight: isActive ? 600 : 500, marginBottom: '0.25rem' })}><LayoutDashboard size={18} />{!isCollapsed && <span>Reports</span>}</NavLink>
          </div>
        )}

        {/* API Docs link */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid #1e293b', paddingTop: '0.75rem' }}>
          <a
            href="http://localhost:5000/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.75rem',
              borderRadius: '6px',
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.85rem',
            }}
          >
            {/* <BookOpen size={18} /> */}
            
          </a>
        </div>
      </nav>
    </aside>
  );
}
