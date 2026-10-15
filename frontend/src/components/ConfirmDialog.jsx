import { useTranslation } from "react-i18next";

export default function ConfirmDialog({ show, title, message, confirmLabel, onConfirm, onCancel, busy }) {
  const { t } = useTranslation();
  if (!show) return null;

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title || t("common.confirm")}</h5>
            <button type="button" className="btn-close" onClick={onCancel} aria-label="Close" />
          </div>
          <div className="modal-body">
            {typeof message === "string" || message == null ? (
              <p className="mb-0">{message || t("common.confirmDelete")}</p>
            ) : (
              message
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={busy}>
              {t("common.cancel")}
            </button>
            <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
              {confirmLabel || t("common.confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
