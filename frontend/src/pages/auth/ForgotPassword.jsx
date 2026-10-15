import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthShell from "../../components/AuthShell.jsx";
import Spinner from "../../components/Spinner.jsx";
import { authApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const toast = useToast();
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [devToken, setDevToken] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setDevToken("");
    setBusy(true);
    try {
      const res = await authApi.forgotPassword({ identifier });
      setMessage(res.data.message);
      if (res.data.data?.resetToken) setDevToken(res.data.data.resetToken);
      toast.success(t("common.success"));
    } catch (err) {
      setError(apiErrorMessage(err, t("common.somethingWrong")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.forgotTitle")}
      subtitle={t("auth.forgotHelp")}
      footer={
        <Link to="/login" className="fw-semibold text-decoration-none">
          {t("auth.loginHere")}
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="d-grid gap-3" noValidate>
        {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}
        {message ? <div className="alert alert-info py-2 mb-0">{message}</div> : null}
        {devToken ? (
          <div className="alert alert-warning py-2 mb-0 small">
            <strong>Dev only:</strong> reset token
            <div className="mt-1 text-break">
              <code>{devToken}</code>
            </div>
            <Link className="d-inline-block mt-2" to={`/reset-password?token=${devToken}`}>
              {t("auth.resetPassword")}
            </Link>
          </div>
        ) : null}
        <div>
          <label className="form-label">{t("auth.identifier")}</label>
          <input
            className="form-control"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
          {busy ? <Spinner label={t("common.loading")} /> : t("common.submit")}
        </button>
      </form>
    </AuthShell>
  );
}
