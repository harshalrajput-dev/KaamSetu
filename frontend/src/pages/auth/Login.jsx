import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthShell from "../../components/AuthShell.jsx";
import PasswordInput from "../../components/PasswordInput.jsx";
import Spinner from "../../components/Spinner.jsx";
import useAuth from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { apiErrorMessage } from "../../services/api.js";
import { dashboardPathFor } from "../../utils/roleHome.js";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(form.identifier, form.password);
      toast.success(t("auth.loginSuccess"));
      const from = location.state?.from;
      if (from) return navigate(from, { replace: true });
      return navigate(dashboardPathFor(user.role), { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, t("common.somethingWrong")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="fw-semibold text-decoration-none">
            {t("auth.registerHere")}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="d-grid gap-3" noValidate>
        {error ? (
          <div className="alert alert-danger py-2 mb-0" role="alert">
            <i className="bi bi-exclamation-circle me-1" /> {error}
          </div>
        ) : null}
        <div>
          <label className="form-label">{t("auth.identifier")}</label>
          <div className="input-group has-icon">
            <span className="input-group-text">
              <i className="bi bi-person" aria-hidden="true" />
            </span>
            <input
              className="form-control"
              placeholder={t("auth.identifierPlaceholder")}
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              required
              autoComplete="username"
            />
          </div>
        </div>
        <div>
          <div className="d-flex justify-content-between">
            <label className="form-label">{t("auth.password")}</label>
            <Link to="/forgot-password" className="small text-decoration-none">
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <PasswordInput
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
            required
          />
        </div>
        <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
          {busy ? <Spinner label={t("common.loading")} /> : t("common.login")}
        </button>
      </form>
    </AuthShell>
  );
}
