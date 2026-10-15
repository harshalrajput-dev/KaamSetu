import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Pagination from "../../components/Pagination.jsx";
import { useToast } from "../../hooks/useToast.js";
import { bookingApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { formatDate } from "../../utils/format.js";

const MODE_CONFIG = {
  new: {
    titleKey: "naka.newBookingsTitle",
    subtitleKey: "naka.newBookingsSubtitle",
    defaultStatus: "Pending",
  },
  assigned: {
    titleKey: "naka.assignedTitle",
    subtitleKey: "naka.assignedSubtitle",
    statuses: ["Assigned", "Accepted", "In Progress"],
    defaultStatus: "Assigned,Accepted,In Progress",
  },
  history: {
    titleKey: "naka.historyTitle",
    statuses: ["Completed", "Cancelled", "Complaint"],
    defaultStatus: "Completed,Cancelled,Complaint",
  },
};

export default function NakaBookings({ mode = "new" }) {
  const { t } = useTranslation();
  const toast = useToast();
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.new;

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", status: cfg.defaultStatus || "", page: 1 });

  const load = async (params) => {
    setLoading(true);
    try {
      const res = await bookingApi.list({ ...params, limit: 10 });
      setItems(res.data.data.items);
      setMeta({ page: res.data.data.page, pages: res.data.data.pages, total: res.data.data.total });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFilters({ search: "", status: cfg.defaultStatus || "", page: 1 });
    load({ status: cfg.defaultStatus || "", page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const onSearch = (e) => {
    e.preventDefault();
    load({ ...filters, status: filters.status || cfg.defaultStatus || "", page: 1 });
  };

  const hasSelect = Boolean(cfg.statuses);

  return (
    <div>
      <PageHeader title={t(cfg.titleKey)} subtitle={cfg.subtitleKey ? t(cfg.subtitleKey) : undefined} />

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <form className="row g-2" onSubmit={onSearch}>
            <div className="col-12 col-md-6">
              <input
                className="form-control"
                placeholder={t("common.search")}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            {hasSelect ? (
              <div className="col-8 col-md-4">
                <select
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                >
                  <option value={cfg.defaultStatus}>{t("common.all")}</option>
                  {cfg.statuses.map((s) => (
                    <option key={s} value={s}>
                      {t(`booking.status.${s}`)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className={hasSelect ? "col-4 col-md-2" : "col-12 col-md-6"}>
              <button className="btn btn-outline-primary w-100" type="submit">
                <i className="bi bi-search" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <Spinner fullscreen label={t("common.loading")} />
          ) : items.length === 0 ? (
            <EmptyState icon="inbox" message={t("common.noData")} />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>{t("booking.bookingId")}</th>
                      <th>{t("booking.customerName")}</th>
                      <th className="d-none d-md-table-cell">{t("booking.serviceCategory")}</th>
                      <th>{t("common.status")}</th>
                      <th className="d-none d-sm-table-cell">{t("common.date")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((b) => (
                      <tr key={b._id}>
                        <td className="fw-semibold">{b.bookingId}</td>
                        <td>
                          {b.customerName}
                          <div className="small text-muted">{b.contactNumber}</div>
                        </td>
                        <td className="d-none d-md-table-cell">
                          {t(`services.${b.service}`, { defaultValue: b.service })}
                        </td>
                        <td>
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="d-none d-sm-table-cell">{formatDate(b.createdAt)}</td>
                        <td className="text-end">
                          <Link className="btn btn-sm btn-outline-primary" to={`/naka/bookings/${b._id}`}>
                            {t("common.details")}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-3 pb-3">
                <Pagination
                  page={meta.page}
                  pages={meta.pages}
                  total={meta.total}
                  onPageChange={(p) => {
                    setFilters((f) => ({ ...f, page: p }));
                    load({ ...filters, page: p });
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
