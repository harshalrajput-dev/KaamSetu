import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import { useToast } from "../../hooks/useToast.js";
import { reportApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";

function BarList({ title, rows, labelFor }) {
  const { t } = useTranslation();
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white">
        <strong>{title}</strong>
      </div>
      <div className="card-body">
        {rows.length === 0 ? (
          <p className="text-muted mb-0 small">{t("common.noData")}</p>
        ) : (
          rows.map((r) => (
            <div className="mb-3" key={String(r._id)}>
              <div className="d-flex justify-content-between small mb-1">
                <span>{labelFor(r._id)}</span>
                <span className="fw-semibold">{r.count}</span>
              </div>
              <div className="progress" style={{ height: 8 }}>
                <div className="progress-bar" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Reports() {
  const { t } = useTranslation();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await reportApi.bookings();
        if (active) setData(res.data.data);
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

  return (
    <div>
      <PageHeader title={t("super.reportsTitle")} subtitle={t("super.reportsSubtitle")} />
      <div className="row g-3">
        <div className="col-lg-4">
          <BarList
            title={t("super.byStatus")}
            rows={data?.byStatus || []}
            labelFor={(s) => t(`booking.status.${s}`, { defaultValue: s })}
          />
        </div>
        <div className="col-lg-4">
          <BarList
            title={t("super.byService")}
            rows={data?.byService || []}
            labelFor={(s) => t(`services.${s}`, { defaultValue: s })}
          />
        </div>
        <div className="col-lg-4">
          <BarList title={t("super.byCity")} rows={data?.byCity || []} labelFor={(c) => c} />
        </div>
      </div>
    </div>
  );
}
