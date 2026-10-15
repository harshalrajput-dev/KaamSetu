import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { workerSelfApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import { formatDate, formatDateTime, assetUrl } from "../../utils/format.js";

export default function WorkerJobDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [absenceOpen, setAbsenceOpen] = useState(false);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workerSelfApi.job(id);
      setJob(res.data.data.booking);
    } catch (err) {
      toast.error(apiErrorMessage(err));
      navigate("/worker/jobs", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, successKey) => {
    setBusy(true);
    try {
      await fn();
      toast.success(t(successKey));
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const accept = () => run(() => workerSelfApi.respond(id, { decision: "accept" }), "worker.accepted");
  const decline = () => {
    if (!window.confirm(t("worker.declineConfirm"))) return;
    run(() => workerSelfApi.respond(id, { decision: "decline" }), "worker.declined").then(() =>
      navigate("/worker/jobs")
    );
  };
  const start = () => run(() => workerSelfApi.setStatus(id, { status: "In Progress" }), "worker.started");
  const complete = () => run(() => workerSelfApi.setStatus(id, { status: "Completed" }), "worker.completed");

  const submitAbsence = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await workerSelfApi.reportAbsence(id, { reason });
      toast.success(t("worker.reported"));
      setAbsenceOpen(false);
      navigate("/worker/jobs");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner fullscreen label={t("common.loading")} />;
  if (!job) return null;

  const canRespond = job.status === "Assigned" || job.status === "Accepted";

  return (
    <div>
      <PageHeader
        title={`${t("worker.jobDetails")} · ${job.bookingId}`}
        subtitle={t(`services.${job.service}`, { defaultValue: job.service })}
        actions={
          <Link className="btn btn-outline-secondary" to="/worker/jobs">
            <i className="bi bi-arrow-left me-1" /> {t("common.back")}
          </Link>
        }
      />

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <StatusBadge status={job.status} />
            <span className="text-muted small">{formatDate(job.createdAt)}</span>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <div className="text-muted small">{t("worker.customer")}</div>
              <div className="fw-semibold">{job.customerName}</div>
            </div>
            <div className="col-md-6">
              <div className="text-muted small">{t("worker.contact")}</div>
              <div className="fw-semibold">{job.contactNumber}</div>
            </div>
            <div className="col-md-6">
              <div className="text-muted small">{t("worker.location")}</div>
              <div className="fw-semibold">
                {[job.address, job.area, job.city].filter(Boolean).join(", ")}
              </div>
            </div>
            <div className="col-md-6">
              <div className="text-muted small">{t("booking.preferredDate")} / {t("booking.preferredTime")}</div>
              <div className="fw-semibold">
                {[job.preferredDate, job.preferredTime].filter(Boolean).join(" · ") || "-"}
              </div>
            </div>
            <div className="col-12">
              <div className="text-muted small">{t("worker.problem")}</div>
              <div className="fw-semibold" style={{ whiteSpace: "pre-wrap" }}>{job.description}</div>
            </div>
            {job.photoUrl ? (
              <div className="col-12">
                <a href={assetUrl(job.photoUrl)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                  <i className="bi bi-image me-1" /> {t("booking.photo")}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-4">
        {job.status === "Assigned" ? (
          <>
            <button className="btn btn-success" disabled={busy} onClick={accept}>
              <i className="bi bi-check2 me-1" /> {t("worker.accept")}
            </button>
            <button className="btn btn-outline-danger" disabled={busy} onClick={decline}>
              {t("worker.decline")}
            </button>
          </>
        ) : null}
        {job.status === "Accepted" ? (
          <button className="btn btn-primary" disabled={busy} onClick={start}>
            <i className="bi bi-play-fill me-1" /> {t("worker.start")}
          </button>
        ) : null}
        {job.status === "In Progress" ? (
          <button className="btn btn-success" disabled={busy} onClick={complete}>
            <i className="bi bi-check2-circle me-1" /> {t("worker.complete")}
          </button>
        ) : null}
        {canRespond ? (
          <button className="btn btn-outline-warning" disabled={busy} onClick={() => setAbsenceOpen(true)}>
            <i className="bi bi-exclamation-triangle me-1" /> {t("worker.reportIssue")}
          </button>
        ) : null}
      </div>

      {job.statusHistory?.length ? (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <strong>{t("booking.timeline")}</strong>
          </div>
          <div className="card-body">
            <ul className="timeline">
              {job.statusHistory.map((h, i) => (
                <li key={i}>
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <StatusBadge status={h.status} />
                    <span className="text-muted small">{formatDateTime(h.changedAt || h.createdAt)}</span>
                  </div>
                  {h.note ? <div className="small text-muted mt-1">{h.note}</div> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {absenceOpen ? (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={submitAbsence}>
              <div className="modal-header">
                <h5 className="modal-title">{t("worker.reportIssue")}</h5>
                <button type="button" className="btn-close" onClick={() => setAbsenceOpen(false)} />
              </div>
              <div className="modal-body">
                <label className="form-label">{t("worker.reportReason")}</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setAbsenceOpen(false)}>
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn btn-warning" disabled={busy}>
                  {busy ? <Spinner label={t("common.saving")} /> : t("common.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
