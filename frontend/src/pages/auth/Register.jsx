import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthShell from "../../components/AuthShell.jsx";
import PasswordInput from "../../components/PasswordInput.jsx";
import Spinner from "../../components/Spinner.jsx";
import useAuth from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { apiErrorMessage } from "../../services/api.js";

const initial = {
  name: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  address: "",
  area: "",
  city: "Surat",
};

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const serviceParam = searchParams.get("service");

  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^[0-9]{10,15}$/.test(form.phone)) {
      setError(t("validation.validPhone"));
      return;
    }
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
      const payload = {
        name: form.name,
        phone: form.phone,
        password: form.password,
        address: form.address,
        area: form.area,
        city: form.city,
      };
      if (form.email) payload.email = form.email;
      await register(payload);
      toast.success(t("auth.registerSuccess"));
      const dest = serviceParam
        ? `/dashboard/bookings/new?service=${encodeURIComponent(serviceParam)}`
        : "/dashboard";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, t("common.somethingWrong")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubtitle")}
      footer={
        <>
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="fw-semibold text-decoration-none">
            {t("auth.loginHere")}
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
          <label className="form-label">{t("common.name")}</label>
          <input className="form-control" value={form.name} onChange={update("name")} required autoComplete="name" />
        </div>
        <div>
          <label className="form-label">{t("common.phone")}</label>
          <input
            className="form-control"
            inputMode="numeric"
            value={form.phone}
            onChange={update("phone")}
            required
            autoComplete="tel"
          />
        </div>
        <div>
          <label className="form-label">
            {t("common.email")} <span className="text-muted small">({t("common.optional")})</span>
          </label>
          <input type="email" className="form-control" value={form.email} onChange={update("email")} autoComplete="email" />
        </div>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">{t("auth.password")}</label>
            <PasswordInput
              value={form.password}
              onChange={update("password")}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">{t("auth.confirmPassword")}</label>
            <PasswordInput
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              autoComplete="new-password"
              required
            />
          </div>
        </div>
        <div>
          <label className="form-label">
            {t("common.address")} <span className="text-muted small">({t("common.optional")})</span>
          </label>
          <input className="form-control" value={form.address} onChange={update("address")} autoComplete="street-address" />
        </div>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">{t("common.area")}</label>
            <input className="form-control" value={form.area} onChange={update("area")} />
          </div>
          <div className="col-md-6">
            <label className="form-label">{t("common.city")}</label>
            <input className="form-control" value={form.city} onChange={update("city")} />
          </div>
        </div>
        <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
          {busy ? <Spinner label={t("common.loading")} /> : t("common.register")}
        </button>
      </form>
    </AuthShell>
  );
}
