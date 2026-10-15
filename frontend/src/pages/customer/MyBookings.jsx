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

const STATUSES = ["Pending", "Assigned", "Accepted", "In Progress", "Completed", "Cancelled", "Complaint"];

export default function MyBookings() {
  const { t } = useTranslation();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", search: "", page: 1 });

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
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.status]);

  const onSearch = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, page: 1 }));
    load({ ...filters, page: 1 });
  };

  return (
    <div>
      <PageHeader
        title={t("booking.myBookingsTitle")}
        subtitle={t("booking.myBookingsSubtitle")}
        actions={
          <Link className="btn btn-primary" to="/dashboard/bookings/new">
            <i className="bi bi-plus-circle me-1" /> {t("booking.createTitle")}
          </Link>
        }
      />

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <form className="row g-2" onSubmit={onSearch}>
            <div className="col-12 col-md-5">
              <input
                className="form-control"
                placeholder={`${t("common.search")} (${t("booking.bookingId")})`}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="col-8 col-md-4">
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              >
                <option value="">{t("common.all")}</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`booking.status.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-4 col-md-3">
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
            <EmptyState icon="calendar-x" message={t("booking.noBookings")} />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>{t("booking.bookingId")}</th>
                      <th>{t("booking.serviceCategory")}</th>
                      <th className="d-none d-md-table-cell">{t("booking.assignedNaka")}</th>
                      <th>{t("common.status")}</th>
                      <th className="d-none d-sm-table-cell">{t("common.date")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((b) => (
                      <tr key={b._id}>
                        <td className="fw-semibold">{b.bookingId}</td>
                        <td>{t(`services.${b.service}`, { defaultValue: b.service })}</td>
                        <td className="d-none d-md-table-cell">
                          {b.naka?.name || <span className="text-muted">{t("booking.notAssigned")}</span>}
                        </td>
                        <td>
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="d-none d-sm-table-cell">{formatDate(b.createdAt)}</td>
                        <td className="text-end">
                          <Link className="btn btn-sm btn-outline-primary" to={`/dashboard/bookings/${b._id}`}>
                            {t("common.view")}
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
                  onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
