import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Pagination from "../../components/Pagination.jsx";
import { useToast } from "../../hooks/useToast.js";
import { bookingApi, nakaApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { formatDate } from "../../utils/format.js";

const STATUSES = ["Pending", "Assigned", "Accepted", "In Progress", "Completed", "Cancelled", "Complaint"];
const SERVICES = ["Plumber", "Electrician", "Painter", "Mason", "General Labour", "Carpenter", "Other"];

export default function ManageBookings() {
  const { t } = useTranslation();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [nakas, setNakas] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: "", service: "", naka: "", search: "" });

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
    load({ page, ...filters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    (async () => {
      try {
        const res = await nakaApi.list({ limit: 100 });
        setNakas(res.data.data.items);
      } catch {
        setNakas([]);
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader title={t("super.bookingsTitle")} />

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <form
            className="row g-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              load({ page: 1, ...filters });
            }}
          >
            <div className="col-12 col-md-3">
              <input className="form-control" placeholder={t("common.search")} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <div className="col-6 col-md-2">
              <select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">{t("common.status")}</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`booking.status.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <select className="form-select" value={filters.service} onChange={(e) => setFilters({ ...filters, service: e.target.value })}>
                <option value="">{t("booking.serviceCategory")}</option>
                {SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {t(`services.${s}`, { defaultValue: s })}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-8 col-md-3">
              <select className="form-select" value={filters.naka} onChange={(e) => setFilters({ ...filters, naka: e.target.value })}>
                <option value="">{t("common.all")} - {t("super.nakaName")}</option>
                {nakas.map((n) => (
                  <option key={n._id} value={n._id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-4 col-md-2">
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
            <EmptyState icon="journal-x" />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>{t("booking.bookingId")}</th>
                      <th>{t("booking.customerName")}</th>
                      <th className="d-none d-md-table-cell">{t("booking.serviceCategory")}</th>
                      <th className="d-none d-lg-table-cell">{t("booking.assignedNaka")}</th>
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
                        <td className="d-none d-md-table-cell">{t(`services.${b.service}`, { defaultValue: b.service })}</td>
                        <td className="d-none d-lg-table-cell">{b.naka?.name || "-"}</td>
                        <td>
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="d-none d-sm-table-cell">{formatDate(b.createdAt)}</td>
                        <td className="text-end">
                          <Link className="btn btn-sm btn-outline-primary" to={`/admin/bookings/${b._id}`}>
                            {t("common.view")}
                          </Link>
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
    </div>
  );
}
