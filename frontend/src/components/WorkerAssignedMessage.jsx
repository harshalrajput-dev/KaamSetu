import { useTranslation } from "react-i18next";
import { assetUrl } from "../utils/format.js";

/**
 * Prominent "worker assigned" message card shown to customers.
 *
 * `worker` must already be normalised (see utils/booking.js). The card renders
 * the worker name, phone number and a one-tap "Call Worker" (tel:) button, plus
 * the notification message. `compact` trims it down for table rows.
 */
export default function WorkerAssignedMessage({
  worker,
  bookingId,
  compact = false,
  className = "",
}) {
  const { t } = useTranslation();

  const name = worker?.name || t("booking.workerFallbackName");
  const phone = worker?.phone || "";
  const skills = Array.isArray(worker?.skills) ? worker.skills : [];
  const photo = worker?.photo || "";
  const size = compact ? 48 : 64;
  const hasDetails = Boolean(worker?.name || worker?.phone);

  return (
    <div
      className={`card border-0 shadow-sm border-start border-success border-4 bg-success-subtle ${className}`}
    >
      <div className={`card-body d-flex flex-wrap align-items-center gap-3 ${compact ? "py-2" : ""}`}>
        {photo ? (
          <img
            src={assetUrl(photo)}
            alt={name}
            className="rounded-circle border border-success flex-shrink-0"
            width={size}
            height={size}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <span
            className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: size, height: size }}
          >
            <i className={`bi bi-person-check-fill ${compact ? "fs-5" : "fs-3"}`} />
          </span>
        )}

        <div className="flex-grow-1 min-w-0">
          <div className="fw-semibold text-success-emphasis d-flex align-items-center gap-2 flex-wrap">
            <span>
              <i className="bi bi-megaphone-fill me-1" />
              {t("booking.workerAssignedTitle")}
            </span>
            {bookingId ? (
              <span className="badge text-bg-light border">{bookingId}</span>
            ) : null}
          </div>

          <div className="mt-1 fw-semibold text-dark">
            <i className="bi bi-person-badge me-1" />
            {name}
            {phone ? (
              <a className="ms-2 text-decoration-none" href={`tel:${phone}`}>
                <i className="bi bi-telephone me-1" />
                {phone}
              </a>
            ) : null}
          </div>

          {hasDetails ? (
            !compact ? (
              <div className="small text-muted mt-1">
                {t("booking.workerAssignedMessage", { name, phone })}
                <span className="ms-2 fst-italic">({t("booking.workerAssignedBy")})</span>
              </div>
            ) : (
              <div className="small text-muted text-truncate">
                {t("booking.workerAssignedMessage", { name, phone })}
              </div>
            )
          ) : null}

          {!compact && skills.length ? (
            <div className="mt-2">
              {skills.map((s) => (
                <span key={s} className="badge text-bg-light border me-1">
                  {t(`services.${s}`, { defaultValue: s })}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {phone ? (
          <a className="btn btn-success flex-shrink-0" href={`tel:${phone}`}>
            <i className="bi bi-telephone-fill me-1" /> {t("booking.callWorker")}
          </a>
        ) : null}
      </div>
    </div>
  );
}
