import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import { useToast } from "../../hooks/useToast.js";
import { authApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";

export default function ChangePassword() {
  const { t } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.newPassword.length < 6) return setError(t("validation.minPassword"));
    if (form.newPassword !== form.confirmPassword) return setError(t("auth.passwordsDoNotMatch"));
    setBusy(true);
    try {
      await authApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success(t("auth.passwordChanged"));
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(apiErrorMessage(err, t("common.somethingWrong")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title={t("nav.changePassword")} />
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <form className="card border-0 shadow-sm" onSubmit={onSubmit} noValidate>
            <div className="card-body d-grid gap-3">
              {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}
              <div>
                <label className="form-label">{t("auth.currentPassword")}</label>
                <input
                  type="password"
                  className="form-control"
                  value={form.currentPassword}
                  onChange={update("currentPassword")}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="form-label">{t("auth.newPassword")}</label>
                <input
                  type="password"
                  className="form-control"
                  value={form.newPassword}
                  onChange={update("newPassword")}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="form-label">{t("auth.confirmPassword")}</label>
                <input
                  type="password"
                  className="form-control"
                  value={form.confirmPassword}
                  onChange={update("confirmPassword")}
                  required
                  autoComplete="new-password"
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? <Spinner label={t("common.saving")} /> : t("common.save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
