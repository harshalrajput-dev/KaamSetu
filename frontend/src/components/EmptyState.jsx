import { useTranslation } from "react-i18next";

export default function EmptyState({ icon = "inbox", title, message, action }) {
  const { t } = useTranslation();
  return (
    <div className="text-center py-5 px-3">
      <i className={`bi bi-${icon} text-primary`} style={{ fontSize: "3rem", opacity: 0.5 }} />
      <h5 className="mt-3 mb-1">{title || t("common.noData")}</h5>
      {message ? <p className="text-muted mb-3">{message}</p> : null}
      {action}
    </div>
  );
}
