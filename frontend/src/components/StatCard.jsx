export default function StatCard({ icon, label, value, color = "primary", hint }) {
  return (
    <div className="card stat-card border-0 h-100 shadow-sm">
      <div className="card-body d-flex align-items-center gap-3">
        <div className={`stat-icon text-bg-${color}`}>
          <i className={`bi bi-${icon}`} />
        </div>
        <div className="min-w-0">
          <div className="text-muted small text-truncate">{label}</div>
          <div className="fs-4 fw-bold">{value}</div>
          {hint ? <div className="text-muted small">{hint}</div> : null}
        </div>
      </div>
    </div>
  );
}
