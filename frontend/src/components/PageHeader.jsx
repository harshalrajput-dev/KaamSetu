export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
      <div className="min-w-0">
        <h1 className="h4 section-title mb-1">{title}</h1>
        {subtitle ? <p className="text-muted mb-0 small">{subtitle}</p> : null}
      </div>
      {actions ? <div className="d-flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
