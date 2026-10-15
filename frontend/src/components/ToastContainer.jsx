import { useToast } from "../hooks/useToast.js";

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();
  if (!toasts.length) return null;

  return (
    <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast show align-items-center text-bg-${t.type} border-0 mb-2`}
          role="alert"
        >
          <div className="d-flex">
            <div className="toast-body">{t.message}</div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              onClick={() => dismiss(t.id)}
              aria-label="Close"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
