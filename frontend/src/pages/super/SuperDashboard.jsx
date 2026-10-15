import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { useToast } from "../../hooks/useToast.js";
import { bookingApi, reportApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { formatDate } from "../../utils/format.js";

export default function SuperDashboard() {
  const { t } = useTranslation();
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
          bookingApi.list({ limit: 8 }),
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

  if (loading) return <Spinner fullscreen label={t("common.loading")} />;

  const b = stats?.bookings || {};
  const w = stats?.workers || {};
  const n = stats?.nakas || {};
  const u = stats?.users || {};

  return (
    <div>
      <PageHeader title={t("super.dashboardTitle")} subtitle={t("roles.super_admin")} />

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard icon="geo-alt" label={t("super.totalNakas")} value={n.total ?? 0} color="primary" hint={`${t("super.activeNakas")}: ${n.active ?? 0}`} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="journal-check" label={t("super.totalBookings")} value={b.total ?? 0} color="info" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="people" label={t("super.totalWorkers")} value={w.total ?? 0} color="secondary" hint={`${t("super.availableWorkers")}: ${w.available ?? 0}`} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="person-lines-fill" label={t("super.totalCustomers")} value={u.customers ?? 0} color="success" hint={`${t("super.totalAdmins")}: ${u.admins ?? 0}`} />
        </div>
      </div>

      <div className="row g-3 mb-4">
        {[
          { key: "pending", label: "Pending", color: "warning", icon: "hourglass-split" },
          { key: "assigned", label: "Assigned", color: "info", icon: "person-check" },
          { key: "accepted", label: "Accepted", color: "primary", icon: "hand-thumbs-up" },
          { key: "started", label: "In Progress", color: "primary", icon: "tools" },
          { key: "completed", label: "Completed", color: "success", icon: "check2-circle" },
          { key: "cancelled", label: "Cancelled", color: "secondary", icon: "x-circle" },
          { key: "complaints", label: "Complaint", color: "danger", icon: "exclamation-triangle" },
        ].map((s) => (
          <div className="col-6 col-lg" key={s.key}>
            <StatCard icon={s.icon} label={t(`booking.status.${s.label}`)} value={b[s.key] ?? 0} color={s.color} />
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard icon="exclamation-circle" label={t("complaint.title")} value={stats?.complaints?.open ?? 0} color="danger" hint={`${t("common.total")}: ${stats?.complaints?.total ?? 0}`} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="star-fill" label={t("review.average")} value={stats?.reviews?.average ?? 0} color="warning" hint={`${t("review.count")}: ${stats?.reviews?.count ?? 0}`} />
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <strong>{t("nav.bookings")}</strong>
          <Link to="/admin/bookings" className="btn btn-sm btn-outline-primary">
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
                    <th className="d-none d-md-table-cell">{t("booking.assignedNaka")}</th>
                    <th>{t("common.status")}</th>
                    <th className="d-none d-sm-table-cell">{t("common.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((bk) => (
                    <tr key={bk._id}>
                      <td>
                        <Link to={`/admin/bookings/${bk._id}`} className="fw-semibold text-decoration-none">
                          {bk.bookingId}
                        </Link>
                      </td>
                      <td>{bk.customerName}</td>
                      <td className="d-none d-md-table-cell">{bk.naka?.name || "-"}</td>
                      <td>
                        <StatusBadge status={bk.status} />
                      </td>
                      <td className="d-none d-sm-table-cell">{formatDate(bk.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
