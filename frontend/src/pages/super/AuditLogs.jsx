import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Pagination from "../../components/Pagination.jsx";
import { useToast } from "../../hooks/useToast.js";
import { auditApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { formatDateTime } from "../../utils/format.js";

export default function AuditLogs() {
  const { t } = useTranslation();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");

  const load = useCallback(
    async (p, act) => {
      setLoading(true);
      try {
        const res = await auditApi.list({ page: p, limit: 20, action: act || undefined });
        setItems(res.data.data.items);
        setMeta({ page: res.data.data.page, pages: res.data.data.pages, total: res.data.data.total });
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    load(page, action);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, action]);

  return (
    <div>
      <PageHeader title={t("audit.title")} subtitle={t("audit.subtitle")} />

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-12 col-md-4">
              <input
                className="form-control"
                placeholder={t("audit.filterAction")}
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <Spinner fullscreen label={t("common.loading")} />
          ) : items.length === 0 ? (
            <EmptyState icon="shield-check" message={t("audit.none")} />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>{t("audit.action")}</th>
                      <th>{t("audit.actor")}</th>
                      <th className="d-none d-md-table-cell">{t("audit.entity")}</th>
                      <th className="d-none d-lg-table-cell">{t("common.details")}</th>
                      <th>{t("audit.time")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((log) => (
                      <tr key={log._id}>
                        <td className="fw-semibold">{log.action}</td>
                        <td>
                          {log.actor?.name || "-"}
                          <div className="small text-muted">{log.actor?.role || "-"}</div>
                        </td>
                        <td className="d-none d-md-table-cell">{log.entityType || "-"}</td>
                        <td className="d-none d-lg-table-cell small text-muted text-truncate" style={{ maxWidth: 240 }}>
                          {log.meta && Object.keys(log.meta).length ? JSON.stringify(log.meta) : "-"}
                        </td>
                        <td>{formatDateTime(log.createdAt)}</td>
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
