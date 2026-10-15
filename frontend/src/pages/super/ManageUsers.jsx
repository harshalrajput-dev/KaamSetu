import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Pagination from "../../components/Pagination.jsx";
import { useToast } from "../../hooks/useToast.js";
import { userApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { formatDate } from "../../utils/format.js";

export default function ManageUsers() {
  const { t } = useTranslation();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (params) => {
    setLoading(true);
    try {
      const res = await userApi.list({ role: "customer", ...params, limit: 10 });
      setItems(res.data.data.items);
      setMeta({ page: res.data.data.page, pages: res.data.data.pages, total: res.data.data.total });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load({ page, search });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const toggleActive = async (u) => {
    try {
      await userApi.setActive(u._id, !u.isActive);
      toast.success(u.isActive ? t("super.accountDeactivated") : t("super.accountActivated"));
      load({ page, search });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const doReset = async () => {
    if (newPassword.length < 6) return toast.error(t("validation.minPassword"));
    setBusy(true);
    try {
      await userApi.resetPassword(resetUser._id, newPassword);
      toast.success(t("super.passwordResetDone"));
      setResetUser(null);
      setNewPassword("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title={t("super.customersTitle")} subtitle={t("super.customersSubtitle")} />

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <form
            className="row g-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              load({ page: 1, search });
            }}
          >
            <div className="col-10 col-md-6">
              <input className="form-control" placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="col-2 col-md-2">
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
            <EmptyState icon="person-lines-fill" />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>{t("common.name")}</th>
                      <th>{t("common.phone")}</th>
                      <th className="d-none d-md-table-cell">{t("common.city")}</th>
                      <th className="d-none d-lg-table-cell">{t("common.date")}</th>
                      <th>{t("common.status")}</th>
                      <th className="text-end">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((u) => (
                      <tr key={u._id}>
                        <td className="fw-semibold">
                          {u.name}
                          {u.email ? <div className="small text-muted">{u.email}</div> : null}
                        </td>
                        <td>{u.phone}</td>
                        <td className="d-none d-md-table-cell">{u.city || "-"}</td>
                        <td className="d-none d-lg-table-cell">{formatDate(u.createdAt)}</td>
                        <td>
                          <span className={`badge text-bg-${u.isActive ? "success" : "secondary"}`}>
                            {u.isActive ? t("common.active") : t("common.inactive")}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-secondary" onClick={() => setResetUser(u)}>
                              <i className="bi bi-key" /> {t("super.resetPassword")}
                            </button>
                            <button
                              className={`btn ${u.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                              onClick={() => toggleActive(u)}
                            >
                              {u.isActive ? t("super.deactivate") : t("super.activate")}
                            </button>
                          </div>
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

      {resetUser ? (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("super.resetPassword")}</h5>
                <button className="btn-close" onClick={() => setResetUser(null)} />
              </div>
              <div className="modal-body">
                <p className="small text-muted">{resetUser.name} • {resetUser.phone}</p>
                <label className="form-label">{t("super.newPasswordForUser")}</label>
                <input
                  type="text"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setResetUser(null)}>
                  {t("common.cancel")}
                </button>
                <button className="btn btn-primary" onClick={doReset} disabled={busy}>
                  {busy ? <Spinner label={t("common.saving")} /> : t("common.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
