import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import useAuth from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { bookingApi, reportApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { formatDate } from "../../utils/format.js";

export default function NakaDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [statsRes, listRes] = await Promise.all([
          reportApi.dashboard(),
          bookingApi.list({ status: "Pending", limit: 5 }),
        ]);
        if (!active) return;
        setStats(statsRes.data.data);
        setRecent(listRes.data.data.items);
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

  const b = stats?.bookings || {};
  const w = stats?.workers || {};
  const c = stats?.complaints || {};
  const r = stats?.reviews || {};

  return (
    <div>
      <PageHeader
        title={t("naka.dashboardTitle")}
        subtitle={user?.naka?.name}
        actions={
          <Link className="btn btn-primary" to="/naka/bookings/new">
            <i className="bi bi-bell me-1" /> {t("nav.newBookings")}
          </Link>
        }
      />

      {loading ? (
        <Spinner fullscreen label={t("common.loading")} />
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <StatCard icon="hourglass-split" label={t("booking.status.Pending")} value={b.pending ?? 0} color="warning" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="person-check" label={t("booking.status.Assigned")} value={b.assigned ?? 0} color="info" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="hand-thumbs-up" label={t("booking.status.Accepted")} value={b.accepted ?? 0} color="primary" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="tools" label={t("booking.status.In Progress")} value={b.started ?? 0} color="primary" />
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <StatCard icon="check2-circle" label={t("booking.status.Completed")} value={b.completed ?? 0} color="success" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="exclamation-triangle" label={t("complaint.title")} value={c.open ?? 0} color="danger" hint={`${t("common.total")}: ${c.total ?? 0}`} />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="star" label={t("review.average")} value={r.average ?? 0} color="warning" hint={`${t("review.count")}: ${r.count ?? 0}`} />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="person-check-fill" label={t("super.availableWorkers")} value={w.available ?? 0} color="secondary" hint={`${t("super.totalWorkers")}: ${w.total ?? 0}`} />
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <strong>{t("naka.newBookingsTitle")}</strong>
              <Link to="/naka/bookings/new" className="btn btn-sm btn-outline-primary">
                {t("common.view")} <i className="bi bi-arrow-right" />
              </Link>
            </div>
            <div className="card-body p-0">
              {recent.length === 0 ? (
                <EmptyState icon="inbox" message={t("common.noData")} />
              ) : (
                <div className="table-responsive">
                  <table className="table mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>{t("booking.bookingId")}</th>
                        <th>{t("booking.customerName")}</th>
                        <th>{t("booking.serviceCategory")}</th>
                        <th className="d-none d-sm-table-cell">{t("common.date")}</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((bk) => (
                        <tr key={bk._id}>
                          <td className="fw-semibold">{bk.bookingId}</td>
                          <td>{bk.customerName}</td>
                          <td>{t(`services.${bk.service}`, { defaultValue: bk.service })}</td>
                          <td className="d-none d-sm-table-cell">{formatDate(bk.createdAt)}</td>
                          <td className="text-end">
                            <Link className="btn btn-sm btn-outline-primary" to={`/naka/bookings/${bk._id}`}>
                              {t("common.view")}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
