import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { workerSelfApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import { formatDate } from "../../utils/format.js";

function Stars({ value = 0 }) {
  const rounded = Math.round(value);
  return (
    <span className="text-warning" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={`bi ${n <= rounded ? "bi-star-fill" : "bi-star"} me-1`} aria-hidden="true" />
      ))}
    </span>
  );
}

export default function WorkerReviews() {
  const { t } = useTranslation();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [rating, setRating] = useState({ count: 0, average: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workerSelfApi.reviews({ limit: 50 });
      setItems(res.data.data.items);
      setRating(res.data.data.rating || { count: 0, average: 0 });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title={t("worker.reviewsTitle")} subtitle={t("worker.reviewsSubtitle")} />

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body d-flex flex-wrap align-items-center gap-4">
          <div>
            <div className="display-6 fw-bold">{rating.average || 0}</div>
            <Stars value={rating.average} />
          </div>
          <div className="text-muted">
            {t("worker.reviewsCount")}: <strong className="text-body">{rating.count}</strong>
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
            <ul className="list-group list-group-flush">
              {items.map((r) => (
                <li className="list-group-item py-3" key={r._id}>
                  <div className="d-flex flex-wrap justify-content-between gap-2 mb-1">
                    <Stars value={r.rating} />
                    <span className="text-muted small">{formatDate(r.createdAt)}</span>
                  </div>
                  <div className="small text-muted mb-1">
                    {t("review.by")}: {r.customer?.name || "-"}
                  </div>
                  <div>{r.comment || t("review.noComment")}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
