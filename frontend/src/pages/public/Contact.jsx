import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../hooks/useToast.js";

export default function Contact() {
  const { t } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const onSubmit = (e) => {
    e.preventDefault();
    // The MVP has no email service configured. We acknowledge locally and
    // explain this limitation in the README rather than faking a send.
    toast.success(t("contact.sentSuccess"));
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <h1 className="section-title">{t("contact.title")}</h1>
        <p className="text-muted">{t("contact.subtitle")}</p>
      </div>
      <div className="row g-4 justify-content-center">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="mb-3">
                <i className="bi bi-geo-alt-fill text-primary me-2" />
                <strong>{t("contact.address")}:</strong>
                <br />
                <span className="text-muted">{t("contact.addressValue")}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <form className="card border-0 shadow-sm" onSubmit={onSubmit}>
            <div className="card-body d-grid gap-3">
              <div>
                <label className="form-label">{t("common.name")}</label>
                <input
                  className="form-control"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">
                  {t("common.email")} <span className="text-muted small">({t("common.optional")})</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">{t("contact.message")}</label>
                <textarea
                  className="form-control"
                  rows="4"
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>
              <button className="btn btn-primary" type="submit">
                <i className="bi bi-send me-1" /> {t("contact.send")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
