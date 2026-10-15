import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/PageHeader.jsx";
import Spinner from "../../components/Spinner.jsx";
import useAuth from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { bookingApi, serviceApi } from "../../services/endpoints.js";
import { apiErrorMessage, getToken } from "../../services/api.js";

const SERVICE_FALLBACK = [
  "Plumber",
  "Electrician",
  "Painter",
  "Mason",
  "General Labour",
  "Carpenter",
  "Other",
];

export default function CreateBooking() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get("service") || "";

  const [services, setServices] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customerName: user?.name || "",
    contactNumber: user?.phone || "",
    service: preselectedService,
    description: "",
    address: user?.address || "",
    area: user?.area || "",
    city: user?.city || "Surat",
    requiredWorkerCount: 1,
    preferredDate: "",
    preferredTime: "",
  });

  useEffect(() => {
    (async () => {
      let names = SERVICE_FALLBACK;
      try {
        const res = await serviceApi.listPublic();
        const apiNames = res.data.data.items.map((s) => s.name);
        if (apiNames.length) names = apiNames;
      } catch {
        // fall back to the static list below
      }
      setServices(names);
      if (preselectedService && names.includes(preselectedService)) {
        setForm((f) => ({ ...f, service: preselectedService }));
      }
    })();
  }, [preselectedService]);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const uploadPhoto = async () => {
    if (!photo) return "";
    const fd = new FormData();
    fd.append("photo", photo);
    const base = import.meta.env.VITE_API_URL || "";
    const res = await fetch(`${base}/api/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    });
    if (!res.ok) throw new Error("Photo upload failed");
    const json = await res.json();
    return json.data.photoUrl;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.service) return setError(t("validation.selectService"));
    if (!/^[0-9]{10,15}$/.test(form.contactNumber)) return setError(t("validation.validPhone"));
    if (Number(form.requiredWorkerCount) < 1) return setError(t("validation.positiveNumber"));

    setBusy(true);
    try {
      let photoUrl = "";
      if (photo) photoUrl = await uploadPhoto();
      const res = await bookingApi.create({ ...form, photoUrl });
      toast.success(t("booking.createdSuccess"));
      navigate(`/dashboard/bookings/${res.data.data.booking._id}`, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, t("common.somethingWrong")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title={t("booking.createTitle")} subtitle={t("booking.createSubtitle")} />
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <form className="card border-0 shadow-sm" onSubmit={onSubmit} noValidate>
            <div className="card-body d-grid gap-3">
              {error ? (
                <div className="alert alert-danger py-2 mb-0">
                  <i className="bi bi-exclamation-circle me-1" /> {error}
                </div>
              ) : null}

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">{t("booking.customerName")}</label>
                  <input className="form-control" value={form.customerName} onChange={update("customerName")} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t("booking.contactNumber")}</label>
                  <input
                    className="form-control"
                    inputMode="numeric"
                    value={form.contactNumber}
                    onChange={update("contactNumber")}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">{t("booking.serviceCategory")}</label>
                <select className="form-select" value={form.service} onChange={update("service")} required>
                  <option value="">{t("booking.selectService")}</option>
                  {services.map((s) => (
                    <option key={s} value={s}>
                      {t(`services.${s}`, { defaultValue: s })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">{t("booking.description")}</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder={t("booking.descriptionPlaceholder")}
                  value={form.description}
                  onChange={update("description")}
                  required
                />
              </div>

              <div>
                <label className="form-label">{t("booking.fullAddress")}</label>
                <input className="form-control" value={form.address} onChange={update("address")} required />
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">{t("booking.area")}</label>
                  <input className="form-control" value={form.area} onChange={update("area")} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">{t("booking.city")}</label>
                  <input className="form-control" value={form.city} onChange={update("city")} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">{t("booking.requiredWorkers")}</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="form-control"
                    value={form.requiredWorkerCount}
                    onChange={update("requiredWorkerCount")}
                    required
                  />
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    {t("booking.preferredDate")} <span className="text-muted small">({t("common.optional")})</span>
                  </label>
                  <input type="date" className="form-control" value={form.preferredDate} onChange={update("preferredDate")} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    {t("booking.preferredTime")} <span className="text-muted small">({t("common.optional")})</span>
                  </label>
                  <input
                    className="form-control"
                    placeholder={t("booking.preferredTimePlaceholder")}
                    value={form.preferredTime}
                    onChange={update("preferredTime")}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">
                  {t("booking.photo")} <span className="text-muted small">({t("common.optional")})</span>
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="form-control"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                />
                <div className="form-text">{t("booking.photoOptional")}</div>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? <Spinner label={t("common.loading")} /> : t("common.submit")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
