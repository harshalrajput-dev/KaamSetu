import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { useToast } from "../../hooks/useToast.js";
import { workerApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { formatDate } from "../../utils/format.js";

const SKILLS = ["Plumber", "Electrician", "Painter", "Mason", "General Labour", "Carpenter", "Other"];
const emptyForm = { name: "", contactNumber: "", skills: [], isAvailable: true, email: "", password: "" };

export default function NakaWorkers() {
  const { t } = useTranslation();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [attendanceFor, setAttendanceFor] = useState(null);
  const [statsFor, setStatsFor] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [sanctionFor, setSanctionFor] = useState(null);
  const [sanctionBusy, setSanctionBusy] = useState(false);
  const [sanctionForm, setSanctionForm] = useState({ action: "warn", days: 7, note: "" });
  const [loginFor, setLoginFor] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");

  const load = useCallback(async (q) => {
    setLoading(true);
    try {
      const res = await workerApi.list({ search: q, limit: 100, isActive: true });
      setItems(res.data.data.items);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load("");
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (w) => {
    setEditing(w);
    setForm({ name: w.name, contactNumber: w.contactNumber, skills: w.skills || [], isAvailable: w.isAvailable });
    setError("");
    setShowForm(true);
  };

  const toggleSkill = (skill) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[0-9]{10,15}$/.test(form.contactNumber)) return setError(t("validation.validPhone"));
    setBusy(true);
    try {
      if (editing) {
        await workerApi.update(editing._id, {
          name: form.name,
          contactNumber: form.contactNumber,
          skills: form.skills,
          isAvailable: form.isAvailable,
        });
      } else {
        const payload = {
          name: form.name,
          contactNumber: form.contactNumber,
          skills: form.skills,
          isAvailable: form.isAvailable,
        };
        if (form.email && form.password) {
          payload.email = form.email;
          payload.password = form.password;
        }
        await workerApi.create(payload);
      }
      toast.success(t("naka.workerSaved"));
      setShowForm(false);
      load(search);
    } catch (err) {
      setError(apiErrorMessage(err, t("common.somethingWrong")));
    } finally {
      setBusy(false);
    }
  };

  const openLogin = (w) => {
    setLoginFor(w);
    setLoginForm({ email: "", password: "" });
    setLoginError("");
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!/^(?=.*\S)[^@]+@[^@]+\.[^@]+$/.test(loginForm.email)) {
      return setLoginError(t("validation.validEmail"));
    }
    if (loginForm.password.length < 6) {
      return setLoginError(t("validation.minPassword"));
    }
    setLoginBusy(true);
    try {
      await workerApi.setAccount(loginFor._id, loginForm);
      toast.success(loginFor.loginUser ? t("naka.loginReset") : t("naka.loginCreated"));
      setLoginFor(null);
      load(search);
    } catch (err) {
      setLoginError(apiErrorMessage(err, t("common.somethingWrong")));
    } finally {
      setLoginBusy(false);
    }
  };

  const toggleAvailability = async (w) => {
    try {
      await workerApi.update(w._id, { isAvailable: !w.isAvailable });
      load(search);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const deactivate = async () => {
    try {
      await workerApi.remove(confirmId);
      toast.success(t("naka.workerDeactivated"));
      setConfirmId(null);
      load(search);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const markAttendance = async (present) => {
    try {
      await workerApi.attendance(attendanceFor._id, { present });
      toast.success(t("naka.attendanceSaved"));
      setAttendanceFor(null);
      load(search);
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
      load(search);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSanctionBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("naka.workersTitle")}
        subtitle={t("naka.workersSubtitle")}
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
              load(search);
            }}
          >
            <div className="col-10 col-md-6">
              <input
                className="form-control"
                placeholder={t("common.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
            <EmptyState
              icon="people"
              message={t("naka.noWorkers")}
              action={
                <button className="btn btn-primary" onClick={openAdd}>
                  {t("naka.addWorker")}
                </button>
              }
            />
          ) : (
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>{t("naka.workerName")}</th>
                    <th>{t("common.phone")}</th>
                    <th className="d-none d-md-table-cell">{t("naka.skills")}</th>
                    <th>{t("naka.availability")}</th>
                    <th className="d-none d-lg-table-cell">{t("common.date")}</th>
                    <th className="text-end">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((w) => (
                    <tr key={w._id}>
                      <td className="fw-semibold">
                        {w.name}
                        {w.loginUser ? (
                          <span className="badge text-bg-success-subtle text-success-emphasis ms-2">
                            <i className="bi bi-person-check me-1" />
                            {t("naka.hasLogin")}
                          </span>
                        ) : (
                          <span className="badge text-bg-secondary-subtle text-secondary-emphasis ms-2">
                            {t("naka.noLogin")}
                          </span>
                        )}
                      </td>
                      <td>{w.contactNumber}</td>
                      <td className="d-none d-md-table-cell">
                        {w.skills?.length
                          ? w.skills.map((s) => (
                              <span key={s} className="badge text-bg-light border me-1">
                                {t(`services.${s}`, { defaultValue: s })}
                              </span>
                            ))
                          : "-"}
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${w.isAvailable ? "btn-success" : "btn-outline-secondary"}`}
                          onClick={() => toggleAvailability(w)}
                        >
                          {w.isAvailable ? t("common.available") : t("common.unavailable")}
                        </button>
                        {w.isBlocked ? (
                          <span className="badge text-bg-danger ms-1">{t("naka.blocked")}</span>
                        ) : w.suspendedUntil ? (
                          <span className="badge text-bg-warning ms-1">{t("naka.suspended")}</span>
                        ) : null}
                        {w.noShowCount ? (
                          <span className="badge text-bg-light border ms-1">
                            {t("naka.noShowCount")}: {w.noShowCount}
                          </span>
                        ) : null}
                      </td>
                      <td className="d-none d-lg-table-cell">{formatDate(w.createdAt)}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary" onClick={() => openEdit(w)} title={t("common.edit")}>
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => setAttendanceFor(w)}
                            title={t("naka.markAttendance")}
                          >
                            <i className="bi bi-calendar-check" />
                          </button>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => openLogin(w)}
                            title={t("naka.workerLogin")}
                          >
                            <i className="bi bi-key" />
                          </button>
                          <button
                            className="btn btn-outline-info"
                            onClick={() => openStats(w)}
                            title={t("naka.workerStats")}
                          >
                            <i className="bi bi-bar-chart" />
                          </button>
                          <button
                            className="btn btn-outline-warning"
                            onClick={() => openSanction(w)}
                            title={t("naka.sanction")}
                          >
                            <i className="bi bi-shield-exclamation" />
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => setConfirmId(w._id)}
                            title={t("common.delete")}
                          >
                            <i className="bi bi-person-dash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <label className="form-label">{t("naka.workerName")}</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">{t("common.phone")}</label>
                  <input
                    className="form-control"
                    inputMode="numeric"
                    value={form.contactNumber}
                    onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                    required
                  />
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
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="availSwitch"
                    checked={form.isAvailable}
                    onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="availSwitch">
                    {t("naka.availability")}
                  </label>
                </div>

                {!editing ? (
                  <div className="border rounded p-3 bg-light-soft">
                    <div className="fw-semibold mb-2 small">
                      <i className="bi bi-key me-1" />
                      {t("naka.loginOptional")}
                    </div>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <label className="form-label small mb-1">{t("common.email")}</label>
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small mb-1">{t("auth.password")}</label>
                        <input
                          type="password"
                          className="form-control form-control-sm"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                    <div className="form-text">{t("naka.loginHint")}</div>
                  </div>
                ) : null}
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

      <ConfirmDialog
        show={Boolean(confirmId)}
        message={t("common.confirmDelete")}
        onConfirm={deactivate}
        onCancel={() => setConfirmId(null)}
      />

      {attendanceFor ? (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("naka.markAttendance")}</h5>
                <button type="button" className="btn-close" onClick={() => setAttendanceFor(null)} />
              </div>
              <div className="modal-body">
                <p className="mb-3 fw-semibold">{attendanceFor.name}</p>
                <div className="d-flex gap-2">
                  <button className="btn btn-success flex-fill" onClick={() => markAttendance(true)}>
                    {t("naka.present")}
                  </button>
                  <button className="btn btn-outline-danger flex-fill" onClick={() => markAttendance(false)}>
                    {t("naka.absent")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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

      {loginFor ? (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={submitLogin}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {t("naka.workerLogin")} - {loginFor.name}
                </h5>
                <button type="button" className="btn-close" onClick={() => setLoginFor(null)} />
              </div>
              <div className="modal-body d-grid gap-3">
                {loginError ? <div className="alert alert-danger py-2 mb-0">{loginError}</div> : null}
                <p className="text-muted small mb-0">
                  {loginFor.loginUser ? t("naka.loginResetHint") : t("naka.loginCreateHint")}
                </p>
                <div>
                  <label className="form-label">{t("common.email")}</label>
                  <input
                    type="email"
                    className="form-control"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">{t("auth.password")}</label>
                  <input
                    type="password"
                    className="form-control"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    autoComplete="new-password"
                    required
                  />
                  <div className="form-text">{t("naka.loginPhoneHint")}: {loginFor.contactNumber}</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setLoginFor(null)}>
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn btn-success" disabled={loginBusy}>
                  {loginBusy ? <Spinner label={t("common.saving")} /> : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
