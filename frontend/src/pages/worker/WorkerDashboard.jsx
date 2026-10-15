import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import useAuth from "../../hooks/useAuth.js";
import { workerSelfApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import { formatDate } from "../../utils/format.js";

export default function WorkerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, jobsRes] = await Promise.all([
        workerSelfApi.stats(),
        workerSelfApi.jobs({ status: "Assigned,Accepted,In Progress", limit: 5 }),
      ]);
      setStats(statsRes.data.data);
      setJobs(jobsRes.data.data.items);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const displayName = user?.worker?.name || user?.name || "";

  return (
    <div>
      <PageHeader
        title={`${t("common.welcome")}, ${displayName}`}
        subtitle={t("worker.dashboardSubtitle")}
        actions={
          <Link className="btn btn-primary" to="/worker/jobs">
            <i className="bi bi-list-check me-1" /> {t("nav.myJobs")}
          </Link>
        }
      />

      {stats?.isBlocked || stats?.suspendedUntil ? (
        <div className="alert alert-danger">
          <i className="bi bi-shield-exclamation me-2" />
          {stats?.isBlocked ? t("worker.accountBlocked") : t("worker.accountSuspended")}
        </div>
      ) : null}

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard icon="hourglass-split" label={t("worker.activeJobs")} value={stats?.activeJobs ?? 0} color="primary" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="check2-circle" label={t("worker.completedJobs")} value={stats?.completedJobs ?? 0} color="success" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            icon="star-fill"
            label={t("worker.rating")}
            value={stats?.rating?.average ?? 0}
            color="warning"
            hint={`${t("worker.reviewsCount")}: ${stats?.rating?.count ?? 0}`}
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            icon="person-badge"
            label={t("worker.availability")}
            value={stats?.isAvailable ? t("common.available") : t("common.unavailable")}
            color={stats?.isAvailable ? "success" : "secondary"}
          />
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <strong>{t("worker.activeJobs")}</strong>
          <Link to="/worker/jobs" className="btn btn-sm btn-outline-primary">
            {t("common.view")} <i className="bi bi-arrow-right" aria-hidden="true" />
          </Link>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <Spinner fullscreen label={t("common.loading")} />
          ) : jobs.length === 0 ? (
            <EmptyState icon="clipboard-x" message={t("worker.noJobs")} />
          ) : (
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>{t("booking.bookingId")}</th>
                    <th>{t("booking.serviceCategory")}</th>
                    <th className="d-none d-md-table-cell">{t("worker.customer")}</th>
                    <th>{t("common.status")}</th>
                    <th className="d-none d-lg-table-cell">{t("common.date")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job._id}>
                      <td className="fw-semibold">{job.bookingId}</td>
                      <td>{t(`services.${job.service}`, { defaultValue: job.service })}</td>
                      <td className="d-none d-md-table-cell">{job.customerName}</td>
                      <td>
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="d-none d-lg-table-cell">{formatDate(job.createdAt)}</td>
                      <td className="text-end">
                        <Link className="btn btn-sm btn-outline-primary" to={`/worker/jobs/${job._id}`}>
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
    </div>
  );
}
