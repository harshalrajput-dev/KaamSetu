export default function Spinner({ label, fullscreen = false, size = "" }) {
  if (fullscreen) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5">
        <div className={`spinner-border text-primary ${size}`} role="status" />
        {label ? <p className="text-muted mt-3 mb-0">{label}</p> : null}
      </div>
    );
  }
  return (
    <span className="d-inline-flex align-items-center gap-2">
      <span className={`spinner-border spinner-border-sm text-primary ${size}`} role="status" />
      {label ? <span>{label}</span> : null}
    </span>
  );
}
