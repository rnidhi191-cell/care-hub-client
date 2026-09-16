export default function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = status.toUpperCase().replace(/\s+/g, '_');

  const config = {
    // Workflow States
    DRAFT: { label: 'Draft', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
    SELF_REVIEW: { label: 'Self Review', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    REVIEWER_ASSESSMENT: { label: 'Manager Review', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
    HR_VALIDATION: { label: 'HR Validation', bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' },
    CALIBRATION: { label: 'Calibration', bg: '#fae8ff', color: '#86198f', border: '#f5d0fe' },
    PERFORMANCE_DISCUSSION: { label: 'Discussion', bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' },
    FINALIZED: { label: 'Finalized', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    ACKNOWLEDGEMENT: { label: 'Awaiting Ack', bg: '#fffbeb', color: '#92400e', border: '#fef3c7' },
    COMPLETED: { label: 'Completed', bg: '#dcfce7', color: '#166534', border: '#86efac' },
    RETURNED: { label: 'Returned', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    OVERDUE: { label: 'Overdue', bg: '#ffe4e6', color: '#be123c', border: '#fecdd3' },
    REOPENED: { label: 'Reopened', bg: '#ffedd5', color: '#9a3412', border: '#fed7aa' },
    CANCELLED: { label: 'Cancelled', bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' },

    // Statuses
    ACTIVE: { label: 'Active', bg: '#dcfce7', color: '#166534', border: '#86efac' },
    INACTIVE: { label: 'Inactive', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    HR_ASSISTED: { label: 'HR Assisted', bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' },
    NOT_STARTED: { label: 'Not Started', bg: '#f8fafc', color: '#64748b', border: '#cbd5e1' },
    IN_PROGRESS: { label: 'In Progress', bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  };

  const style = config[normalized] || {
    label: status,
    bg: '#f1f5f9',
    color: '#475569',
    border: '#cbd5e1',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.55rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  );
}

