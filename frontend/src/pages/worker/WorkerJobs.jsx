import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { workerSelfApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import { formatDate } from "../../utils/format.js";

const TABS = [
  { key: "new", status: "Assigned" },
  { key: "active", status: "Accepted,In Progress" },
  { key: "history", status: "Completed,Cancelled" },
];

export default function WorkerJobs() {
  const { t } = useTranslation();
  const toast = useToast();

  const [tab, setTab] = useState("new");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const activeTab = TABS.find((x) => x.key === tab) || TABS[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workerSelfApi.jobs({ status: activeTab.status, limit: 100 });
      setItems(res.data.data.items);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeTab.status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (id, fn, successKey) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(t(successKey));
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const accept = (id) => run(id, () => workerSelfApi.respond(id, { decision: "accept" }), "worker.accepted");
  const decline = (id) => {
    if (!window.confirm(t("worker.declineConfirm"))) return;
    run(id, () => workerSelfApi.respond(id, { decision: "decline" }), "worker.declined");
  };
  const start = (id) =>
    run(id, () => workerSelfApi.setStatus(id, { status: "In Progress" }), "worker.started");
  const complete = (id) =>
    run(id, () => workerSelfApi.setStatus(id, { status: "Completed" }), "worker.completed");

  return (
    <div>
      <PageHeader title={t("worker.myJobsTitle")} subtitle={t("worker.myJobsSubtitle")} />

      <ul className="nav nav-pills gap-2 mb-3">
        {TABS.map((x) => (
          <li className="nav-item" key={x.key}>
            <button
              type="button"
              className={`nav-link ${tab === x.key ? "active" : "bg-white border"}`}
              onClick={() => setTab(x.key)}
            >
              {t(`worker.tab_${x.key}`)}
            </button>
          </li>
        ))}
      </ul>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <Spinner fullscreen label={t("common.loading")} />
          ) : items.length === 0 ? (
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
                    <th className="text-end">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((job) => (
                    <tr key={job._id}>
                      <td className="fw-semibold">{job.bookingId}</td>
                      <td>{t(`services.${job.service}`, { defaultValue: job.service })}</td>
                      <td className="d-none d-md-table-cell">{job.customerName}</td>
                      <td>
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="d-none d-lg-table-cell">{formatDate(job.createdAt)}</td>
                      <td className="text-end">
                        <div className="d-inline-flex flex-wrap gap-1 justify-content-end">
                          {job.status === "Assigned" && tab === "new" ? (
                            <>
                              <button
                                className="btn btn-sm btn-success"
                                disabled={busyId === job._id}
                                onClick={() => accept(job._id)}
                              >
                                {t("worker.accept")}
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                disabled={busyId === job._id}
                                onClick={() => decline(job._id)}
                              >
                                {t("worker.decline")}
                              </button>
                            </>
                          ) : null}
                          {job.status === "Accepted" ? (
                            <button
                              className="btn btn-sm btn-primary"
                              disabled={busyId === job._id}
                              onClick={() => start(job._id)}
                            >
                              {t("worker.start")}
                            </button>
                          ) : null}
                          {job.status === "In Progress" ? (
                            <button
                              className="btn btn-sm btn-success"
                              disabled={busyId === job._id}
                              onClick={() => complete(job._id)}
                            >
                              {t("worker.complete")}
                            </button>
                          ) : null}
                          <Link className="btn btn-sm btn-outline-primary" to={`/worker/jobs/${job._id}`}>
                            {t("common.view")}
                          </Link>
                        </div>
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
