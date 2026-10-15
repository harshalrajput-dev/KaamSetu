import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import useAuth from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { authApi } from "../../services/endpoints.js";
import { apiErrorMessage } from "../../services/api.js";
import { formatDateTime } from "../../utils/format.js";

export default function Profile() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: user?.address || "",
    area: user?.area || "",
    city: user?.city || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[0-9]{10,15}$/.test(form.phone)) return setError(t("validation.validPhone"));
    setBusy(true);
    try {
      const res = await authApi.updateProfile(form);
      setUser(res.data.data.user);
      toast.success(t("common.success"));
    } catch (err) {
      setError(apiErrorMessage(err, t("common.somethingWrong")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title={t("nav.myProfile")} subtitle={user?.email || user?.phone} />
      <div className="row g-3">
        <div className="col-lg-8">
          <form className="card border-0 shadow-sm" onSubmit={onSubmit} noValidate>
            <div className="card-body d-grid gap-3">
              {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">{t("common.name")}</label>
                  <input className="form-control" value={form.name} onChange={update("name")} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t("common.phone")}</label>
                  <input className="form-control" inputMode="numeric" value={form.phone} onChange={update("phone")} required />
                </div>
              </div>
              <div>
                <label className="form-label">{t("auth.emailOptional")}</label>
                <input type="email" className="form-control" value={form.email} onChange={update("email")} />
              </div>
              <div>
                <label className="form-label">{t("common.address")}</label>
                <input className="form-control" value={form.address} onChange={update("address")} />
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
              <div>
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? <Spinner label={t("common.saving")} /> : t("common.save")}
                </button>
              </div>
            </div>
          </form>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-semibold">{t("roles." + user?.role)}</h6>
              <ul className="list-unstyled small text-muted mb-0">
                <li>
                  <i className="bi bi-envelope me-1" /> {user?.email || "-"}
                </li>
                <li>
                  <i className="bi bi-telephone me-1" /> {user?.phone || "-"}
                </li>
                {user?.naka?.name ? (
                  <li>
                    <i className="bi bi-geo-alt me-1" /> {user.naka.name}
                  </li>
                ) : null}
                <li className="mt-2">
                  <i className="bi bi-clock-history me-1" /> {formatDateTime(user?.lastLoginAt)}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
