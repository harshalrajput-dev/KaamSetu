import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import { workerSelfApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import { KNOWN_SERVICES } from "../../utils/serviceIcon.js";

export default function WorkerProfile() {
  const { t } = useTranslation();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [naka, setNaka] = useState(null);
  const [form, setForm] = useState({ name: "", contactNumber: "", skills: [], isAvailable: true });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await workerSelfApi.me();
        if (!active) return;
        const w = res.data.data.worker;
        setNaka(w.naka || null);
        setForm({
          name: w.name || "",
          contactNumber: w.contactNumber || "",
          skills: w.skills || [],
          isAvailable: Boolean(w.isAvailable),
        });
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

  const toggleSkill = (skill) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[0-9]{10,15}$/.test(form.contactNumber)) return setError(t("validation.validPhone"));
    setBusy(true);
    try {
      await workerSelfApi.updateMe(form);
      toast.success(t("worker.saved"));
    } catch (err) {
      setError(apiErrorMessage(err, t("common.somethingWrong")));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner fullscreen label={t("common.loading")} />;

  return (
    <div>
      <PageHeader title={t("worker.profileTitle")} subtitle={t("worker.profileSubtitle")} />

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              {naka?.name ? (
                <p className="text-muted small mb-3">
                  <i className="bi bi-geo-alt me-1" />
                  {t("booking.assignedNaka")}: <strong className="text-body">{naka.name}</strong>
                </p>
              ) : null}

              <form onSubmit={onSubmit} className="d-grid gap-3" noValidate>
                {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">{t("naka.workerName")}</label>
                    <input
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{t("common.phone")}</label>
                    <input
                      className="form-control"
                      inputMode="numeric"
                      value={form.contactNumber}
                      onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">{t("naka.skills")}</label>
                  <div className="d-flex flex-wrap gap-2">
                    {KNOWN_SERVICES.filter((s) => s !== "Other").map((s) => (
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
                    id="workerAvail"
                    checked={form.isAvailable}
                    onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="workerAvail">
                    {t("naka.availability")}
                  </label>
                </div>

                <div>
                  <button className="btn btn-primary" type="submit" disabled={busy}>
                    {busy ? <Spinner label={t("common.saving")} /> : t("common.save")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
