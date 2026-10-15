import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Pagination from "../../components/Pagination.jsx";
import { useToast } from "../../hooks/useToast.js";
import { userApi, nakaApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";

const emptyForm = { name: "", phone: "", email: "", password: "", naka: "" };

export default function ManageNakaAdmins() {
  const { t } = useTranslation();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [nakas, setNakas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (params) => {
    setLoading(true);
    try {
      const res = await userApi.list({ role: "naka_admin", ...params, limit: 10 });
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

  useEffect(() => {
    (async () => {
      try {
        const res = await nakaApi.list({ limit: 100, isActive: true });
        setNakas(res.data.data.items);
      } catch {
        setNakas([]);
      }
    })();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.naka) return setError(t("super.selectNaka"));
    setBusy(true);
    try {
      const res = await nakaApi.createAdmin(form.naka, {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        password: form.password,
      });
      toast.success(t("auth.registerSuccess"));
      setShowForm(false);
      setForm(emptyForm);
      void res;
      load({ page, search });
    } catch (err) {
      setError(apiErrorMessage(err, t("common.somethingWrong")));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      await userApi.setActive(u._id, !u.isActive);
      toast.success(u.isActive ? t("super.accountDeactivated") : t("super.accountActivated"));
      load({ page, search });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title={t("super.nakaAdminsTitle")}
        subtitle={t("super.nakaAdminsSubtitle")}
        actions={
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setError(""); setShowForm(true); }}>
            <i className="bi bi-plus-lg me-1" /> {t("super.addNakaAdmin")}
          </button>
        }
      />

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
            <EmptyState icon="person-badge" />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>{t("common.name")}</th>
                      <th>{t("common.phone")}</th>
                      <th className="d-none d-md-table-cell">{t("super.nakaName")}</th>
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
                        <td className="d-none d-md-table-cell">{u.naka?.name || "-"}</td>
                        <td>
                          <span className={`badge text-bg-${u.isActive ? "success" : "secondary"}`}>
                            {u.isActive ? t("common.active") : t("common.inactive")}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            className={`btn btn-sm ${u.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                            onClick={() => toggleActive(u)}
                          >
                            {u.isActive ? t("super.deactivate") : t("super.activate")}
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

      {showForm ? (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <form className="modal-content" onSubmit={save}>
              <div className="modal-header">
                <h5 className="modal-title">{t("super.addNakaAdmin")}</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)} />
              </div>
              <div className="modal-body d-grid gap-3">
                {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}
                <div>
                  <label className="form-label">{t("super.selectNaka")}</label>
                  <select className="form-select" value={form.naka} onChange={(e) => setForm({ ...form, naka: e.target.value })} required>
                    <option value="">{t("super.selectNaka")}</option>
                    {nakas.map((n) => (
                      <option key={n._id} value={n._id}>
                        {n.name} - {n.city}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">{t("common.name")}</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">{t("common.phone")}</label>
                    <input className="form-control" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{t("common.email")}</label>
                    <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">{t("auth.password")}</label>
                  <input type="password" className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="new-password" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? <Spinner label={t("common.saving")} /> : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
