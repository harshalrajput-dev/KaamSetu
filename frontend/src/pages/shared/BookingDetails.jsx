import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import WorkerAssignedMessage from "../../components/WorkerAssignedMessage.jsx";
import { getAssignedWorker } from "../../utils/booking.js";
import useAuth from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { bookingApi, complaintApi, reviewApi, workerApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { formatDate, formatDateTime, assetUrl } from "../../utils/format.js";

// Mirrors the backend transition table so the UI only offers valid moves.
const TRANSITIONS = {
  Pending: ["Assigned", "Cancelled"],
  Assigned: ["Accepted", "In Progress", "Cancelled"],
  Accepted: ["In Progress", "Cancelled"],
  "In Progress": ["Completed", "Complaint", "Cancelled"],
  Completed: ["Complaint"],
  Complaint: ["In Progress", "Completed", "Cancelled"],
  Cancelled: [],
};

const CONFLICT_STATUSES = ["Pending", "Assigned", "Accepted", "In Progress"];
const COMPLAINT_CATEGORIES = [
  "Worker No-Show",
  "Work Not Completed",
  "Poor Quality",
  "Worker Behaviour",
  "Payment Issue",
  "Other",
];

const baseByRole = {
  customer: "/dashboard",
  naka_admin: "/naka",
  super_admin: "/admin",
};

export default function BookingDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const base = baseByRole[user?.role] || "/dashboard";

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [statusValue, setStatusValue] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Review state (customer).
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  // Complaint state (customer).
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    subject: "",
    category: "Other",
    description: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingApi.get(id);
      const data = res.data.data.booking;
      setBooking(data);
      setStatusValue(data.status);
      if (user?.role === "customer" && data.status === "Completed") {
        try {
          const r = await reviewApi.forBooking(id);
          setReview(r.data.data.review);
        } catch {
          setReview(null);
        }
      }
    } catch (err) {
      toast.error(apiErrorMessage(err));
      navigate(base, { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, base, navigate, toast, user]);

  useEffect(() => {
    load();
  }, [load]);

  const nakaId = booking?.naka?._id || booking?.naka;
  const isMyNaka = user?.role === "naka_admin" && String(user?.naka?._id || user?.naka) === String(nakaId);
  const isAdmin = user?.role === "super_admin" || isMyNaka;
  const canAssign = booking && isAdmin && ["Pending", "Assigned", "Accepted"].includes(booking.status);
  const allowedNext = booking ? TRANSITIONS[booking.status] || [] : [];
  const canUpdateStatus = booking && isAdmin && allowedNext.length > 0;
  const canRecordArrival =
    booking && isAdmin && ["Assigned", "Accepted", "In Progress"].includes(booking.status);

  useEffect(() => {
    if (!canAssign) return;
    (async () => {
      try {
        const params = { status: "available", isActive: true, limit: 100 };
        if (user?.role === "super_admin" && nakaId) params.naka = nakaId;
        const [suggRes, listRes] = await Promise.all([
          bookingApi.suggestedWorkers(booking._id).catch(() => null),
          workerApi.list(params),
        ]);
        setSuggested(suggRes?.data?.data?.items || []);
        setWorkers(listRes.data.data.items || []);
      } catch {
        setSuggested([]);
        setWorkers([]);
      }
    })();
  }, [canAssign, nakaId, user, booking?._id]);

  const toggleWorker = (wid) => {
    setSelectedWorkers((prev) => (prev.includes(wid) ? prev.filter((x) => x !== wid) : [...prev, wid]));
  };

  const applySuggestion = (workerId) => {
    setSelectedWorkers((prev) => (prev.includes(workerId) ? prev : [...prev, workerId]));
  };

  const onAssign = async () => {
    if (!selectedWorkers.length) return toast.error(t("naka.selectWorkers"));
    setBusy(true);
    try {
      await bookingApi.assignWorkers(id, selectedWorkers);
      setSelectedWorkers([]);
      setSuggested([]);
      await load();
      toast.success(t("naka.assignSuccess"));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onUpdateStatus = async () => {
    setBusy(true);
    try {
      await bookingApi.updateStatus(id, { status: statusValue, note });
      setNote("");
      await load();
      toast.success(t("booking.statusUpdated"));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onArrival = async (workerId, arrived) => {
    setBusy(true);
    try {
      await bookingApi.recordArrival(id, { workerId, arrived });
      await load();
      toast.success(t("booking.arrivalRecorded"));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async () => {
    setBusy(true);
    try {
      await bookingApi.updateStatus(id, { status: "Cancelled", cancelReason });
      setShowCancel(false);
      await load();
      toast.success(t("booking.statusUpdated"));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onSubmitReview = async (e) => {
    e.preventDefault();
    setReviewBusy(true);
    try {
      const res = await reviewApi.create({ booking: id, rating, comment: reviewComment });
      setReview(res.data.data.review);
      toast.success(t("booking.reviewSuccess"));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setReviewBusy(false);
    }
  };

  const onSubmitComplaint = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await complaintApi.create({ booking: id, ...complaintForm });
      toast.success(t("booking.complaintRaised"));
      setShowComplaint(false);
      setComplaintForm({ subject: "", category: "Other", description: "" });
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner fullscreen label={t("common.loading")} />;
  if (!booking) return null;

  const customerCanCancel = user?.role === "customer" && CONFLICT_STATUSES.includes(booking.status);
  const customerCanComplain =
    user?.role === "customer" && ["In Progress", "Completed", "Complaint"].includes(booking.status);

  // Assigned worker details, normalised across every payload variation
  // (assignedWorker, worker, assignedWorkers[], flat workerName/workerPhone...).
  const assignedWorker = getAssignedWorker(booking);
  const showWorkerBanner =
    user?.role === "customer" && (Boolean(assignedWorker) || booking.status === "Assigned");

  return (
    <div>
      <PageHeader
        title={`${t("booking.bookingId")}: ${booking.bookingId}`}
        subtitle={`${t(`services.${booking.service}`, { defaultValue: booking.service })} • ${formatDateTime(
          booking.createdAt
        )}`}
        actions={
          <>
            <StatusBadge status={booking.status} />
            <Link className="btn btn-outline-secondary btn-sm" to={`${base}/bookings`}>
              <i className="bi bi-arrow-left" /> {t("common.back")}
            </Link>
          </>
        }
      />

      {showWorkerBanner ? (
        <WorkerAssignedMessage worker={assignedWorker} bookingId={booking.bookingId} className="mb-3" />
      ) : null}

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-white">
              <strong>{t("common.details")}</strong>
            </div>
            <div className="card-body">
              <dl className="row mb-0 g-2">
                <dt className="col-sm-4 text-muted">{t("booking.customerName")}</dt>
                <dd className="col-sm-8">{booking.customerName}</dd>
                <dt className="col-sm-4 text-muted">{t("booking.contactNumber")}</dt>
                <dd className="col-sm-8">{booking.contactNumber}</dd>
                <dt className="col-sm-4 text-muted">{t("booking.serviceCategory")}</dt>
                <dd className="col-sm-8">{t(`services.${booking.service}`, { defaultValue: booking.service })}</dd>
                <dt className="col-sm-4 text-muted">{t("booking.description")}</dt>
                <dd className="col-sm-8" style={{ whiteSpace: "pre-wrap" }}>{booking.description}</dd>
                <dt className="col-sm-4 text-muted">{t("booking.fullAddress")}</dt>
                <dd className="col-sm-8">
                  {booking.address}
                  {booking.area ? `, ${booking.area}` : ""}
                  {booking.city ? `, ${booking.city}` : ""}
                </dd>
                <dt className="col-sm-4 text-muted">{t("booking.requiredWorkers")}</dt>
                <dd className="col-sm-8">{booking.requiredWorkerCount}</dd>
                <dt className="col-sm-4 text-muted">{t("booking.preferredDate")}</dt>
                <dd className="col-sm-8">
                  {booking.preferredDate ? formatDate(booking.preferredDate) : "-"}
                  {booking.preferredTime ? ` (${booking.preferredTime})` : ""}
                </dd>
                <dt className="col-sm-4 text-muted">{t("booking.assignedNaka")}</dt>
                <dd className="col-sm-8">
                  {booking.naka?.name ? (
                    <>
                      {booking.naka.name}
                      {booking.naka.city ? ` - ${booking.naka.city}` : ""}
                    </>
                  ) : (
                    <span className="text-muted">{t("booking.pendingAssignment")}</span>
                  )}
                </dd>
                {booking.photoUrl ? (
                  <>
                    <dt className="col-sm-4 text-muted">{t("booking.photo")}</dt>
                    <dd className="col-sm-8">
                      <a href={assetUrl(booking.photoUrl)} target="_blank" rel="noreferrer">
                        <img src={assetUrl(booking.photoUrl)} alt="problem" className="img-thumbnail" style={{ maxHeight: 160 }} />
                      </a>
                    </dd>
                  </>
                ) : null}
              </dl>
            </div>
          </div>

          {canAssign ? (
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-header bg-white">
                <strong>{t("naka.assignWorkers")}</strong>
              </div>
              <div className="card-body">
                {suggested.length ? (
                  <div className="mb-3">
                    <div className="small text-muted mb-1">
                      <i className="bi bi-magic me-1" />
                      {t("booking.suggestedWorkers")} — {t("booking.suggestedHint")}
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {suggested.slice(0, 5).map((s) => (
                        <button
                          type="button"
                          key={s.worker._id}
                          className={`btn btn-sm ${s.matchesSkill ? "btn-outline-success" : "btn-outline-secondary"}`}
                          onClick={() => applySuggestion(s.worker._id)}
                          title={`${t("booking.matchesSkill")}: ${s.matchesSkill ? t("common.yes") : t("common.no")}`}
                        >
                          {s.worker.name}
                          <span className="badge text-bg-light border ms-1">
                            {t("booking.workload")}: {s.activeJobs}
                          </span>
                        </button>
                      ))}
                    </div>
                    <hr />
                  </div>
                ) : null}

                {workers.length === 0 ? (
                  <p className="text-muted mb-0">{t("naka.noAvailableWorkers")}</p>
                ) : (
                  <div className="row g-2">
                    {workers.map((w) => (
                      <div className="col-md-6" key={w._id}>
                        <label className="border rounded p-2 d-flex align-items-center gap-2 w-100 mb-0">
                          <input
                            type="checkbox"
                            className="form-check-input mt-0"
                            checked={selectedWorkers.includes(w._id)}
                            onChange={() => toggleWorker(w._id)}
                          />
                          <span className="min-w-0">
                            <span className="d-block fw-semibold text-truncate">{w.name}</span>
                            <span className="small text-muted text-truncate d-block">
                              {w.skills?.map((s) => t(`services.${s}`, { defaultValue: s })).join(", ") || "-"}
                            </span>
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  className="btn btn-primary mt-3"
                  onClick={onAssign}
                  disabled={busy || !selectedWorkers.length}
                >
                  {busy ? <Spinner label={t("common.loading")} /> : t("naka.assignWorkers")}
                  {selectedWorkers.length ? ` (${selectedWorkers.length})` : ""}
                </button>
              </div>
            </div>
          ) : null}

          {booking.assignedWorkers?.length ? (
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-header bg-white">
                <strong>{t("booking.assignedWorkers")}</strong>
              </div>
              <ul className="list-group list-group-flush">
                {booking.assignedWorkers.map((w) => {
                  const arrival = (booking.workerArrivals || []).find(
                    (a) => String(a.worker) === String(w._id)
                  );
                  return (
                    <li key={w._id} className="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <span>
                        <span className="fw-semibold">{w.name}</span>
                        {w.contactNumber ? (
                          <a className="text-muted small ms-2" href={`tel:${w.contactNumber}`}>
                            <i className="bi bi-telephone me-1" />
                            {w.contactNumber}
                          </a>
                        ) : null}
                        {arrival ? (
                          <span className={`badge ms-2 text-bg-${arrival.arrived ? "success" : "danger"}`}>
                            {arrival.arrived ? t("booking.arrived") : t("booking.noShow")}
                          </span>
                        ) : null}
                      </span>
                      {canRecordArrival ? (
                        <span className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-success"
                            disabled={busy}
                            onClick={() => onArrival(w._id, true)}
                          >
                            {t("booking.markArrived")}
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            disabled={busy}
                            onClick={() => onArrival(w._id, false)}
                          >
                            {t("booking.markNoShow")}
                          </button>
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {user?.role === "customer" && booking.status === "Completed" ? (
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-header bg-white">
                <strong>{t("booking.reviewTitle")}</strong>
              </div>
              <div className="card-body">
                {review ? (
                  <div>
                    <div className="text-warning fs-5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <i key={i} className={`bi ${i <= review.rating ? "bi-star-fill" : "bi-star"}`} />
                      ))}
                    </div>
                    {review.comment ? <p className="mb-0 mt-2">{review.comment}</p> : null}
                  </div>
                ) : (
                  <form onSubmit={onSubmitReview}>
                    <p className="text-muted small">{t("booking.reviewSubtitle")}</p>
                    <div className="mb-2">
                      <label className="form-label small">{t("booking.rating")}</label>
                      <div className="fs-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <button
                            type="button"
                            key={i}
                            className="btn btn-link p-0 me-1 text-warning"
                            onClick={() => setRating(i)}
                            aria-label={`${i} stars`}
                          >
                            <i className={`bi ${i <= rating ? "bi-star-fill" : "bi-star"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="form-label small">{t("booking.reviewComment")}</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        maxLength={1000}
                      />
                    </div>
                    <button className="btn btn-primary" disabled={reviewBusy}>
                      {reviewBusy ? <Spinner label={t("common.loading")} /> : t("booking.reviewSubmit")}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="col-lg-4">
          {canUpdateStatus ? (
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-header bg-white">
                <strong>{t("naka.updateStatus")}</strong>
              </div>
              <div className="card-body d-grid gap-2">
                <div>
                  <label className="form-label small">{t("naka.currentStatus")}</label>
                  <div>
                    <StatusBadge status={booking.status} />
                  </div>
                </div>
                <div>
                  <label className="form-label small">{t("naka.newStatus")}</label>
                  <select
                    className="form-select"
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value)}
                  >
                    {allowedNext.map((s) => (
                      <option key={s} value={s}>
                        {t(`booking.status.${s}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label small">{t("naka.statusNote")}</label>
                  <input className="form-control" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={onUpdateStatus}
                  disabled={busy || !allowedNext.includes(statusValue)}
                >
                  {busy ? <Spinner label={t("common.loading")} /> : t("naka.updateStatus")}
                </button>
              </div>
            </div>
          ) : null}

          {customerCanCancel ? (
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body d-grid gap-2">
                <button className="btn btn-outline-danger w-100" onClick={() => setShowCancel(true)}>
                  <i className="bi bi-x-circle me-1" /> {t("booking.cancelBooking")}
                </button>
                {customerCanComplain ? (
                  <button className="btn btn-outline-warning w-100" onClick={() => setShowComplaint(true)}>
                    <i className="bi bi-exclamation-triangle me-1" /> {t("booking.raiseComplaint")}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {user?.role === "customer" && !customerCanCancel && customerCanComplain ? (
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body d-grid gap-2">
                <button className="btn btn-outline-warning w-100" onClick={() => setShowComplaint(true)}>
                  <i className="bi bi-exclamation-triangle me-1" /> {t("booking.raiseComplaint")}
                </button>
              </div>
            </div>
          ) : null}

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <strong>{t("booking.timeline")}</strong>
            </div>
            <div className="card-body">
              <ul className="timeline">
                {[...(booking.statusHistory || [])].reverse().map((h, i) => (
                  <li key={i}>
                    <StatusBadge status={h.status} />
                    <div className="small text-muted mt-1">{formatDateTime(h.changedAt)}</div>
                    {h.note ? <div className="small">{h.note}</div> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        show={showCancel}
        title={t("booking.cancelBooking")}
        message={
          <div>
            <p>{t("booking.cancelConfirm")}</p>
            <input
              className="form-control"
              placeholder={t("booking.cancelReasonPlaceholder")}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
        }
        confirmLabel={t("booking.cancelBooking")}
        onConfirm={onCancel}
        onCancel={() => setShowCancel(false)}
        busy={busy}
      />

      {showComplaint ? (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={onSubmitComplaint}>
              <div className="modal-header">
                <h5 className="modal-title">{t("booking.raiseComplaint")}</h5>
                <button type="button" className="btn-close" onClick={() => setShowComplaint(false)} />
              </div>
              <div className="modal-body d-grid gap-3">
                <div>
                  <label className="form-label">{t("complaint.subject")}</label>
                  <input
                    className="form-control"
                    value={complaintForm.subject}
                    onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                    required
                    maxLength={160}
                  />
                </div>
                <div>
                  <label className="form-label">{t("complaint.category")}</label>
                  <select
                    className="form-select"
                    value={complaintForm.category}
                    onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                  >
                    {COMPLAINT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {t(`complaint.categoryOptions.${c}`, { defaultValue: c })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">{t("complaint.description")}</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={complaintForm.description}
                    onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                    required
                    maxLength={2000}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowComplaint(false)}>
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
