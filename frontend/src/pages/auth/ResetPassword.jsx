import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthShell from "../../components/AuthShell.jsx";
import Spinner from "../../components/Spinner.jsx";
import { authApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";

export default function ResetPassword() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    token: params.get("token") || "",
    password: "",
    confirmPassword: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError(t("validation.minPassword"));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }
    setBusy(true);
    try {
      await authApi.resetPassword({ token: form.token, password: form.password });
      toast.success(t("auth.resetSuccess"));
      navigate("/login", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, t("common.somethingWrong")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.resetTitle")}
      footer={
        <Link to="/login" className="fw-semibold text-decoration-none">
          {t("auth.loginHere")}
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="d-grid gap-3" noValidate>
        {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}
        <div>
          <label className="form-label">{t("auth.resetToken")}</label>
          <input
            className="form-control"
            value={form.token}
            onChange={(e) => setForm({ ...form, token: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="form-label">{t("auth.newPassword")}</label>
          <input
            type="password"
            className="form-control"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
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
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
            autoComplete="new-password"
          />
        </div>
        <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
          {busy ? <Spinner label={t("common.loading")} /> : t("auth.resetPassword")}
        </button>
      </form>
    </AuthShell>
  );
}
