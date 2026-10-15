import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Pagination from "../../components/Pagination.jsx";
import { useToast } from "../../hooks/useToast.js";
import { workerApi, nakaApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";

const SKILLS = ["Plumber", "Electrician", "Painter", "Mason", "General Labour", "Carpenter", "Other"];
const emptyForm = { name: "", contactNumber: "", skills: [], naka: "", isAvailable: true };

export default function ManageWorkers() {
  const { t } = useTranslation();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [nakas, setNakas] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", naka: "" });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [statsFor, setStatsFor] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [sanctionFor, setSanctionFor] = useState(null);
  const [sanctionBusy, setSanctionBusy] = useState(false);
  const [sanctionForm, setSanctionForm] = useState({ action: "warn", days: 7, note: "" });

  const load = useCallback(async (params) => {
    setLoading(true);
    try {
      const res = await workerApi.list({ ...params, limit: 10 });
      setItems(res.data.data.items);
      setMeta({ page: res.data.data.page, pages: res.data.data.pages, total: res.data.data.total });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

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

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };
  const openEdit = (w) => {
    setEditing(w);
    setForm({
      name: w.name,
      contactNumber: w.contactNumber,
      skills: w.skills || [],
      naka: w.naka?._id || w.naka || "",
      isAvailable: w.isAvailable,
    });
    setError("");
    setShowForm(true);
  };

  const toggleSkill = (s) =>
    setForm((f) => ({ ...f, skills: f.skills.includes(s) ? f.skills.filter((x) => x !== s) : [...f.skills, s] }));

  const save = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[0-9]{10,15}$/.test(form.contactNumber)) return setError(t("validation.validPhone"));
    if (!editing && !form.naka) return setError(t("super.selectNaka"));
    setBusy(true);
    try {
      if (editing) await workerApi.update(editing._id, form);
      else await workerApi.create(form);
      toast.success(t("naka.workerSaved"));
      setShowForm(false);
      load({ page, ...filters });
    } catch (err) {
      setError(apiErrorMessage(err, t("common.somethingWrong")));
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async () => {
    try {
      await workerApi.remove(confirmId);
      toast.success(t("naka.workerDeactivated"));
      setConfirmId(null);
      load({ page, ...filters });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const openStats = async (w) => {
    setStatsFor(w);
    setStatsData(null);
    setStatsLoading(true);
    try {
      const res = await workerApi.stats(w._id);
      setStatsData(res.data.data);
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setStatsFor(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const openSanction = (w) => {
    const action = w.isBlocked ? "unblock" : w.suspendedUntil ? "reinstate" : "warn";
    setSanctionForm({ action, days: 7, note: "" });
    setSanctionFor(w);
  };

  const applySanction = async (e) => {
    e.preventDefault();
    setSanctionBusy(true);
    try {
      await workerApi.sanction(sanctionFor._id, sanctionForm);
      toast.success(t("naka.sanctionSaved"));
      setSanctionFor(null);
      load({ page, ...filters });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSanctionBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("super.workersTitle")}
        actions={
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="bi bi-plus-lg me-1" /> {t("naka.addWorker")}
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
              load({ page: 1, ...filters });
            }}
          >
            <div className="col-12 col-md-5">
              <input className="form-control" placeholder={t("common.search")} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <div className="col-8 col-md-4">
              <select className="form-select" value={filters.naka} onChange={(e) => setFilters({ ...filters, naka: e.target.value })}>
                <option value="">{t("common.all")}</option>
                {nakas.map((n) => (
                  <option key={n._id} value={n._id}>
                    {n.name}
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
            <EmptyState icon="people" />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>{t("naka.workerName")}</th>
                      <th>{t("common.phone")}</th>
                      <th className="d-none d-md-table-cell">{t("super.nakaName")}</th>
                      <th className="d-none d-lg-table-cell">{t("naka.skills")}</th>
                      <th>{t("naka.availability")}</th>
                      <th className="text-end">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((w) => (
                      <tr key={w._id}>
                        <td className="fw-semibold">{w.name}</td>
                        <td>{w.contactNumber}</td>
                        <td className="d-none d-md-table-cell">{w.naka?.name || "-"}</td>
                        <td className="d-none d-lg-table-cell">
                          {w.skills?.map((s) => (
                            <span key={s} className="badge text-bg-light border me-1">
                              {t(`services.${s}`, { defaultValue: s })}
                            </span>
                          )) || "-"}
                        </td>
                        <td>
                          <span className={`badge text-bg-${w.isAvailable ? "success" : "secondary"}`}>
                            {w.isAvailable ? t("common.available") : t("common.unavailable")}
                          </span>
                          {w.isBlocked ? (
                            <span className="badge text-bg-danger ms-1">{t("naka.blocked")}</span>
                          ) : w.suspendedUntil ? (
                            <span className="badge text-bg-warning ms-1">{t("naka.suspended")}</span>
                          ) : null}
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" onClick={() => openEdit(w)}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button className="btn btn-outline-info" onClick={() => openStats(w)} title={t("naka.workerStats")}>
                              <i className="bi bi-bar-chart" />
                            </button>
                            <button className="btn btn-outline-warning" onClick={() => openSanction(w)} title={t("naka.sanction")}>
                              <i className="bi bi-shield-exclamation" />
                            </button>
                            <button className="btn btn-outline-danger" onClick={() => setConfirmId(w._id)}>
                              <i className="bi bi-person-dash" />
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

      {showForm ? (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <form className="modal-content" onSubmit={save}>
              <div className="modal-header">
                <h5 className="modal-title">{editing ? t("naka.editWorker") : t("naka.addWorker")}</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)} />
              </div>
              <div className="modal-body d-grid gap-3">
                {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}
                <div>
                  <label className="form-label">{t("super.selectNaka")}</label>
                  <select className="form-select" value={form.naka} onChange={(e) => setForm({ ...form, naka: e.target.value })} disabled={Boolean(editing)}>
                    <option value="">{t("super.selectNaka")}</option>
                    {nakas.map((n) => (
                      <option key={n._id} value={n._id}>
                        {n.name} - {n.city}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">{t("naka.workerName")}</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">{t("common.phone")}</label>
                  <input className="form-control" inputMode="numeric" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">{t("naka.skills")}</label>
                  <div className="d-flex flex-wrap gap-2">
                    {SKILLS.map((s) => (
                      <button
                        type="button"
                        key={s}
                        className={`btn btn-sm ${form.skills.includes(s) ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => toggleSkill(s)}
                      >
                        {t(`services.${s}`, { defaultValue: s })}
                      </button>
                    ))}
                  </div>
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

      <ConfirmDialog show={Boolean(confirmId)} message={t("common.confirmDelete")} onConfirm={deactivate} onCancel={() => setConfirmId(null)} />

      {statsFor ? (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {t("naka.workerStats")} - {statsFor.name}
                </h5>
                <button type="button" className="btn-close" onClick={() => setStatsFor(null)} />
              </div>
              <div className="modal-body">
                {statsLoading ? (
                  <Spinner fullscreen label={t("common.loading")} />
                ) : statsData ? (
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="border rounded p-2">
                        <div className="text-muted small">{t("naka.completedJobs")}</div>
                        <div className="h5 mb-0">{statsData.completedJobs}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border rounded p-2">
                        <div className="text-muted small">{t("naka.activeJobs")}</div>
                        <div className="h5 mb-0">{statsData.activeJobs}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border rounded p-2">
                        <div className="text-muted small">{t("naka.rating")}</div>
                        <div className="h5 mb-0">
                          {statsData.rating?.average ?? 0}
                          {statsData.rating?.count ? (
                            <span className="small text-muted ms-1">({statsData.rating.count})</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border rounded p-2">
                        <div className="text-muted small">{t("naka.noShowCount")}</div>
                        <div className="h5 mb-0">{statsData.noShowCount}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border rounded p-2">
                        <div className="text-muted small">{t("naka.warningCount")}</div>
                        <div className="h5 mb-0">{statsData.warningCount}</div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setStatsFor(null)}>
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {sanctionFor ? (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={applySanction}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {t("naka.sanction")} - {sanctionFor.name}
                </h5>
                <button type="button" className="btn-close" onClick={() => setSanctionFor(null)} />
              </div>
              <div className="modal-body d-grid gap-3">
                <div>
                  <label className="form-label">{t("naka.sanction")}</label>
                  <select
                    className="form-select"
                    value={sanctionForm.action}
                    onChange={(e) => setSanctionForm({ ...sanctionForm, action: e.target.value })}
                  >
                    <option value="warn">{t("naka.warn")}</option>
                    <option value="suspend">{t("naka.suspend")}</option>
                    <option value="block">{t("naka.block")}</option>
                    <option value="unblock">{t("naka.unblock")}</option>
                    <option value="reinstate">{t("naka.reinstate")}</option>
                  </select>
                </div>
                {sanctionForm.action === "suspend" ? (
                  <div>
                    <label className="form-label">{t("naka.suspendDays")}</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={sanctionForm.days}
                      onChange={(e) => setSanctionForm({ ...sanctionForm, days: e.target.value })}
                    />
                  </div>
                ) : null}
                <div>
                  <label className="form-label">{t("naka.sanctionNote")}</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={sanctionForm.note}
                    onChange={(e) => setSanctionForm({ ...sanctionForm, note: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setSanctionFor(null)}>
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn btn-warning" disabled={sanctionBusy}>
                  {sanctionBusy ? <Spinner label={t("common.saving")} /> : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
