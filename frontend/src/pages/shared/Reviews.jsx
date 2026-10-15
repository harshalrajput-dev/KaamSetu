import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Pagination from "../../components/Pagination.jsx";
import { useToast } from "../../hooks/useToast.js";
import { reviewApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { formatDateTime } from "../../utils/format.js";

function Stars({ value }) {
  return (
    <span className="text-warning" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={`bi ${i <= value ? "bi-star-fill" : "bi-star"}`} />
      ))}
    </span>
  );
}

export default function Reviews() {
  const { t } = useTranslation();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ count: 0, average: 0 });
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(
    async (p) => {
      setLoading(true);
      try {
        const [listRes, sumRes] = await Promise.all([
          reviewApi.list({ page: p, limit: 10 }),
          reviewApi.summary(),
        ]);
        setItems(listRes.data.data.items);
        setMeta({
          page: listRes.data.data.page,
          pages: listRes.data.data.pages,
          total: listRes.data.data.total,
        });
        setSummary(sumRes.data.data);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const toggleVisibility = async (r) => {
    setBusyId(r._id);
    try {
      await reviewApi.setVisibility(r._id, !r.isVisible);
      toast.success(t("review.updated"));
      load(page);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title={t("review.title")} subtitle={t("review.subtitle")} />

      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-muted small">{t("review.average")}</div>
              <div className="h4 mb-0">
                {summary.average || 0} <Stars value={Math.round(summary.average || 0)} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-muted small">{t("review.count")}</div>
              <div className="h4 mb-0">{summary.count || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <Spinner fullscreen label={t("common.loading")} />
          ) : items.length === 0 ? (
            <EmptyState icon="star" message={t("review.none")} />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>{t("booking.bookingId")}</th>
                      <th>{t("review.title")}</th>
                      <th className="d-none d-md-table-cell">{t("review.by")}</th>
                      <th>{t("common.status")}</th>
                      <th className="d-none d-sm-table-cell">{t("common.date")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r) => (
                      <tr key={r._id}>
                        <td className="fw-semibold">{r.booking?.bookingId || "-"}</td>
                        <td style={{ minWidth: 200 }}>
                          <Stars value={r.rating} />
                          <div className="small text-muted">{r.comment || t("review.noComment")}</div>
                        </td>
                        <td className="d-none d-md-table-cell">{r.customer?.name || "-"}</td>
                        <td>
                          <span className={`badge text-bg-${r.isVisible ? "success" : "secondary"}`}>
                            {r.isVisible ? t("review.visible") : t("review.hidden")}
                          </span>
                        </td>
                        <td className="d-none d-sm-table-cell">{formatDateTime(r.createdAt)}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            disabled={busyId === r._id}
                            onClick={() => toggleVisibility(r)}
                          >
                            {r.isVisible ? t("review.hide") : t("review.show")}
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
    </div>
  );
}
