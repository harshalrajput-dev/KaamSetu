import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import WorkerAssignedMessage from "../../components/WorkerAssignedMessage.jsx";
import useAuth from "../../hooks/useAuth.js";
import { bookingApi, reportApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import { formatDate } from "../../utils/format.js";
import { getAssignedWorker } from "../../utils/booking.js";

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [listRes, statsRes] = await Promise.all([
          bookingApi.list({ limit: 5 }),
          reportApi.dashboard(),
        ]);
        if (!active) return;
        setItems(listRes.data.data.items);
        setStats(statsRes.data.data);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [toast]);

  const b = stats?.bookings || { total: 0, pending: 0, completed: 0 };
  const c = stats?.complaints || { open: 0, total: 0 };

  // Bookings that already have a worker assigned (normalised across payloads).
  const assignedItems = items
    .map((bk) => ({ booking: bk, worker: getAssignedWorker(bk) }))
    .filter((entry) => entry.worker || entry.booking.status === "Assigned");

  return (
    <div>
      <PageHeader
        title={`${t("common.welcome")}, ${user?.name}`}
        subtitle={t("booking.myBookingsSubtitle")}
        actions={
          <Link className="btn btn-primary" to="/dashboard/bookings/new">
            <i className="bi bi-plus-circle me-1" /> {t("booking.createTitle")}
          </Link>
        }
      />

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard icon="journal-check" label={t("common.total")} value={b.total} color="primary" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="hourglass-split" label={t("booking.status.Pending")} value={b.pending} color="warning" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="person-check" label={t("booking.status.Assigned")} value={b.assigned} color="info" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="check2-circle" label={t("booking.status.Completed")} value={b.completed} color="success" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="exclamation-triangle" label={t("complaint.myTitle")} value={c.open} color="danger" hint={`${t("common.total")}: ${c.total}`} />
        </div>
      </div>

      {!loading && assignedItems.length ? (
        <div className="mb-4">
          <h6 className="text-muted mb-2">
            <i className="bi bi-person-check me-1" />
            {t("booking.status.Assigned")} — {t("nav.myBookings")}
          </h6>
          <div className="row g-3">
            {assignedItems.map(({ booking: bk, worker }) => (
              <div className="col-12 col-xl-6" key={`card-${bk._id}`}>
                <WorkerAssignedMessage worker={worker} bookingId={bk.bookingId} />
                <div className="text-end mt-1">
                  <Link
                    className="btn btn-sm btn-outline-primary"
                    to={`/dashboard/bookings/${bk._id}`}
                  >
                    {t("booking.viewDetails")} <i className="bi bi-arrow-right" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <strong>{t("nav.myBookings")}</strong>
          <Link to="/dashboard/bookings" className="btn btn-sm btn-outline-primary">
            {t("common.view")} <i className="bi bi-arrow-right" />
          </Link>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <Spinner fullscreen label={t("common.loading")} />
          ) : items.length === 0 ? (
            <EmptyState
              icon="calendar-plus"
              message={t("booking.noBookings")}
              action={
                <Link className="btn btn-primary" to="/dashboard/bookings/new">
                  {t("booking.createFirst")}
                </Link>
              }
            />
          ) : (
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>{t("booking.bookingId")}</th>
                    <th>{t("booking.serviceCategory")}</th>
                    <th>{t("common.status")}</th>
                    <th>{t("common.date")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((bk) => {
                    const worker = getAssignedWorker(bk);
                    const showWorker = Boolean(worker) || bk.status === "Assigned";
                    return (
                      <Fragment key={bk._id}>
                        <tr>
                          <td className="fw-semibold">{bk.bookingId}</td>
                          <td>{t(`services.${bk.service}`, { defaultValue: bk.service })}</td>
                          <td>
                            <StatusBadge status={bk.status} />
                          </td>
                          <td>{formatDate(bk.createdAt)}</td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-1">
                              {worker?.phone ? (
                                <a className="btn btn-sm btn-success" href={`tel:${worker.phone}`}>
                                  <i className="bi bi-telephone-fill me-1" />
                                  {t("booking.callWorker")}
                                </a>
                              ) : null}
                              <Link
                                className="btn btn-sm btn-outline-primary"
                                to={`/dashboard/bookings/${bk._id}`}
                              >
                                {t("booking.viewDetails")}
                              </Link>
                            </div>
                          </td>
                        </tr>
                        {showWorker ? (
                          <tr className="border-0">
                            <td colSpan={5} className="border-0 pt-0">
                              <WorkerAssignedMessage
                                worker={worker}
                                bookingId={bk.bookingId}
                                compact
                                className="mb-2"
                              />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
