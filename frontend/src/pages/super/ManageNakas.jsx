import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Pagination from "../../components/Pagination.jsx";
import { useToast } from "../../hooks/useToast.js";
import { nakaApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";

const emptyForm = { name: "", city: "Surat", area: "", address: "", contactNumber: "", isActive: true };

export default function ManageNakas() {
  const { t } = useTranslation();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (params) => {
    setLoading(true);
    try {
      const res = await nakaApi.list({ ...params, limit: 10 });
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

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };
  const openEdit = (naka) => {
    setEditing(naka);
    setForm({
      name: naka.name,
      city: naka.city,
      area: naka.area || "",
      address: naka.address || "",
      contactNumber: naka.contactNumber || "",
      isActive: naka.isActive,
    });
    setError("");
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editing) await nakaApi.update(editing._id, form);
      else await nakaApi.create(form);
      toast.success(t("super.nakaSaved"));
      setShowForm(false);
      load({ page, search });
    } catch (err) {
      setError(apiErrorMessage(err, t("common.somethingWrong")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("super.nakasTitle")}
        subtitle={t("super.nakasSubtitle")}
        actions={
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="bi bi-plus-lg me-1" /> {t("super.addNaka")}
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
            <EmptyState icon="geo-alt" />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>{t("super.nakaName")}</th>
                      <th>{t("common.city")}</th>
                      <th className="d-none d-md-table-cell">{t("super.nakaAdmin")}</th>
                      <th>{t("common.status")}</th>
                      <th className="text-end">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((naka) => (
                      <tr key={naka._id}>
                        <td className="fw-semibold">
                          {naka.name}
                          {naka.area ? <div className="small text-muted">{naka.area}</div> : null}
                        </td>
                        <td>{naka.city}</td>
                        <td className="d-none d-md-table-cell">
                          {naka.admin?.name || <span className="text-muted">-</span>}
                        </td>
                        <td>
                          <span className={`badge text-bg-${naka.isActive ? "success" : "secondary"}`}>
                            {naka.isActive ? t("common.active") : t("common.inactive")}
                          </span>
                        </td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(naka)}>
                            <i className="bi bi-pencil" /> {t("common.edit")}
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
                <h5 className="modal-title">{editing ? t("super.editNaka") : t("super.addNaka")}</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)} />
              </div>
              <div className="modal-body d-grid gap-3">
                {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}
                <div>
                  <label className="form-label">{t("super.nakaName")}</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">{t("common.city")}</label>
                    <input className="form-control" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{t("common.area")}</label>
                    <input className="form-control" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">{t("common.address")}</label>
                  <input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">{t("common.phone")}</label>
                  <input className="form-control" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="nakaActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  <label className="form-check-label" htmlFor="nakaActive">
                    {t("common.active")}
                  </label>
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
