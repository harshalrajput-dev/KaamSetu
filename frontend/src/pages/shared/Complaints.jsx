import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Pagination from "../../components/Pagination.jsx";
import useAuth from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { bookingApi, complaintApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { formatDateTime } from "../../utils/format.js";

const CATEGORIES = [
  "Worker No-Show",
  "Work Not Completed",
  "Poor Quality",
  "Worker Behaviour",
  "Payment Issue",
  "Other",
];
const STATUSES = ["Open", "In Review", "Escalated", "Resolved", "Rejected"];

const emptyForm = { booking: "", subject: "", category: "Other", description: "" };

export default function Complaints() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const isCustomer = user?.role === "customer";

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [active, setActive] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [bookings, setBookings] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [resolution, setResolution] = useState("");

  const load = useCallback(
    async (p, status) => {
      setLoading(true);
      try {
        const res = await complaintApi.list({ page: p, limit: 10, status: status || undefined });
        setItems(res.data.data.items);
        setMeta({ page: res.data.data.page, pages: res.data.data.pages, total: res.data.data.total });
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    load(page, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const openForm = async () => {
    setForm(emptyForm);
    setError("");
    setShowForm(true);
    try {
      const res = await bookingApi.list({ limit: 100 });
      setBookings(res.data.data.items || []);
    } catch {
      setBookings([]);
    }
  };

  const submitNew = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await complaintApi.create({
        booking: form.booking || undefined,
        subject: form.subject,
        category: form.category,
        description: form.description,
      });
      toast.success(t("complaint.created"));
      setShowForm(false);
      setPage(1);
      load(1, statusFilter);
    } catch (err) {
      setError(apiErrorMessage(err, t("common.somethingWrong")));
    } finally {
      setBusy(false);
    }
  };

  const applyUpdate = async (id, payload, successKey) => {
    setBusy(true);
    try {
      const res = await complaintApi.update(id, payload);
      toast.success(t(successKey));
      setActive(res.data.data.complaint);
      load(page, statusFilter);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const escalate = async (id) => {
    setBusy(true);
    try {
      const res = await complaintApi.escalate(id, {});
      toast.success(t("complaint.escalated"));
      setActive(res.data.data.complaint);
      load(page, statusFilter);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const isAdmin = user?.role === "super_admin" || user?.role === "naka_admin";
  const canAct =
    active &&
    isAdmin &&
    !["Resolved", "Rejected"].includes(active.status) &&
    !(user?.role === "naka_admin" && active.status === "Escalated");

  return (
    <div>
      <PageHeader
        title={isCustomer ? t("complaint.myTitle") : t("complaint.title")}
        subtitle={isCustomer ? t("complaint.mySubtitle") : t("complaint.subtitle")}
        actions={
          isCustomer ? (
            <button className="btn btn-primary" onClick={openForm}>
              <i className="bi bi-plus-lg me-1" /> {t("complaint.new")}
            </button>
          ) : null
        }
      />

      {!isCustomer ? (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t("common.all")}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`complaint.status.${s}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <Spinner fullscreen label={t("common.loading")} />
          ) : items.length === 0 ? (
            <EmptyState icon="exclamation-circle" message={isCustomer ? t("complaint.noneMine") : t("complaint.none")} />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>{t("complaint.subject")}</th>
                      <th className="d-none d-md-table-cell">{t("complaint.category")}</th>
                      <th className="d-none d-lg-table-cell">{t("complaint.linkedBooking")}</th>
                      <th>{t("common.status")}</th>
                      <th className="d-none d-sm-table-cell">{t("common.date")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((c) => (
                      <tr key={c._id}>
                        <td className="fw-semibold">{c.subject}</td>
                        <td className="d-none d-md-table-cell">
                          {t(`complaint.categoryOptions.${c.category}`, { defaultValue: c.category })}
                        </td>
                        <td className="d-none d-lg-table-cell">{c.booking?.bookingId || "-"}</td>
                        <td>
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="d-none d-sm-table-cell">{formatDateTime(c.createdAt)}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setActive(c);
                              setResolution(c.resolutionNote || "");
                            }}
                          >
                            {t("common.view")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-3 pb-3">
                <Pagination page={meta.page} pages={meta.pages} total={meta.total} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* New complaint modal (customer) */}
      {showForm ? (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <form className="modal-content" onSubmit={submitNew}>
              <div className="modal-header">
                <h5 className="modal-title">{t("complaint.new")}</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)} />
              </div>
              <div className="modal-body d-grid gap-3">
                {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}
                <div>
                  <label className="form-label">{t("complaint.linkedBooking")}</label>
                  <select
                    className="form-select"
                    value={form.booking}
                    onChange={(e) => setForm({ ...form, booking: e.target.value })}
                  >
                    <option value="">{t("complaint.noBooking")}</option>
                    {bookings.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.bookingId} - {t(`services.${b.service}`, { defaultValue: b.service })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">{t("complaint.subject")}</label>
                  <input
                    className="form-control"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                    maxLength={160}
                  />
                </div>
                <div>
                  <label className="form-label">{t("complaint.category")}</label>
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
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
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    maxLength={2000}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? <Spinner label={t("common.saving")} /> : t("common.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Complaint detail modal */}
      {active ? (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{active.subject}</h5>
                <button type="button" className="btn-close" onClick={() => setActive(null)} />
              </div>
              <div className="modal-body">
                <div className="d-flex gap-2 mb-3">
                  <StatusBadge status={active.status} />
                  <span className="badge text-bg-light border">
                    {t(`complaint.categoryOptions.${active.category}`, { defaultValue: active.category })}
                  </span>
                  {active.booking?.bookingId ? (
                    <span className="badge text-bg-light border">{active.booking.bookingId}</span>
                  ) : null}
                </div>
                <p style={{ whiteSpace: "pre-wrap" }}>{active.description}</p>
                {active.resolutionNote ? (
                  <div className="alert alert-success py-2">
                    <strong>{t("complaint.resolution")}:</strong> {active.resolutionNote}
                  </div>
                ) : null}

                <h6 className="mt-3">{t("booking.timeline")}</h6>
                <ul className="timeline">
                  {[...(active.history || [])].reverse().map((h, i) => (
                    <li key={i}>
                      <StatusBadge status={h.status} />
                      <div className="small text-muted mt-1">{formatDateTime(h.at)}</div>
                      {h.note ? <div className="small">{h.note}</div> : null}
                    </li>
                  ))}
                </ul>

                {canAct ? (
                  <div className="mt-3 d-grid gap-2">
                    <label className="form-label small mb-0">{t("complaint.resolution")}</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                    />
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-sm btn-outline-warning"
                        disabled={busy}
                        onClick={() => applyUpdate(active._id, { status: "In Review", resolutionNote: resolution }, "complaint.statusUpdated")}
                      >
                        {t("complaint.setInReview")}
                      </button>
                      <button
                        className="btn btn-sm btn-success"
                        disabled={busy}
                        onClick={() => applyUpdate(active._id, { status: "Resolved", resolutionNote: resolution }, "complaint.statusUpdated")}
                      >
                        {t("complaint.resolve")}
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        disabled={busy}
                        onClick={() => applyUpdate(active._id, { status: "Rejected", resolutionNote: resolution }, "complaint.statusUpdated")}
                      >
                        {t("complaint.reject")}
                      </button>
                      {active.status !== "Escalated" ? (
                        <button className="btn btn-sm btn-dark" disabled={busy} onClick={() => escalate(active._id)}>
                          {t("complaint.escalate")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setActive(null)}>
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
