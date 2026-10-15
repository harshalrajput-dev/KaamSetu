import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { useToast } from "../../hooks/useToast.js";
import { serviceApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";

export default function ManageServices() {
  const { t } = useTranslation();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await serviceApi.listAdmin();
      setItems(res.data.data.items);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (s) => {
    setBusyId(s._id);
    try {
      await serviceApi.update(s._id, { isActive: !s.isActive });
      toast.success(t("common.success"));
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title={t("super.servicesTitle")} subtitle={t("super.servicesSubtitle")} />
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <Spinner fullscreen label={t("common.loading")} />
          ) : items.length === 0 ? (
            <EmptyState icon="grid" message={t("common.noData")} />
          ) : (
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>{t("booking.serviceCategory")}</th>
                    <th className="d-none d-md-table-cell">ગુજરાતી</th>
                    <th className="d-none d-md-table-cell">हिन्दी</th>
                    <th>{t("common.status")}</th>
                    <th className="text-end">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s._id}>
                      <td className="fw-semibold">{s.labelEn || s.name}</td>
                      <td className="d-none d-md-table-cell">{s.labelGu}</td>
                      <td className="d-none d-md-table-cell">{s.labelHi}</td>
                      <td>
                        <span className={`badge text-bg-${s.isActive ? "success" : "secondary"}`}>
                          {s.isActive ? t("common.enabled") : t("common.disabled")}
                        </span>
                      </td>
                      <td className="text-end">
                        <button className={`btn btn-sm ${s.isActive ? "btn-outline-danger" : "btn-outline-success"}`} onClick={() => toggle(s)} disabled={busyId === s._id}>
                          {busyId === s._id ? <Spinner /> : s.isActive ? t("common.disabled") : t("common.enabled")}
                        </button>
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
