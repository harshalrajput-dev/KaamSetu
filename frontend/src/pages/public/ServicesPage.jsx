import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuth from "../../hooks/useAuth.js";
import { serviceApi } from "../../services/endpoints.js";
import { serviceIcon } from "../../utils/serviceIcon.js";
import EmptyState from "../../components/EmptyState.jsx";

const FALLBACK_SERVICES = [
  { name: "Plumber" },
  { name: "Electrician" },
  { name: "Painter" },
  { name: "Carpenter" },
  { name: "Mason" },
  { name: "General Labour" },
  { name: "Other" },
];

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ServicesPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, role } = useAuth();
  const [searchParams] = useSearchParams();
  const highlighted = searchParams.get("service");

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const lng = (i18n.resolvedLanguage || i18n.language || "gu").slice(0, 2);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await serviceApi.listPublic();
      const items = res.data.data.items || [];
      setServices(items.length ? items : FALLBACK_SERVICES);
    } catch {
      setError(t("services.loadError"));
      setServices(FALLBACK_SERVICES);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const labelFor = (s) => s[`label${capitalize(lng)}`] || t(`services.${s.name}`, { defaultValue: s.name });
  const descFor = (s) =>
    s.description || t(`serviceInfo.${s.name}.description`, { defaultValue: t("services.cardFallback") });
  const iconFor = (s) => (s.icon && !serviceIcon(s.name) ? s.icon : serviceIcon(s.name));

  const bookingLink = (name) =>
    isAuthenticated && role === "customer"
      ? `/dashboard/bookings/new?service=${encodeURIComponent(name)}`
      : `/register?service=${encodeURIComponent(name)}`;

  return (
    <div>
      <section className="services-hero">
        <div className="container py-5">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <span className="badge rounded-pill services-eyebrow mb-3">
                <i className="bi bi-grid-3x3-gap-fill me-2" aria-hidden="true" />
                {t("nav.services")}
              </span>
              <h1 className="services-title mb-3">{t("home.servicesTitle")}</h1>
              <p className="services-subtitle mb-0">{t("services.pageSubtitle")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-5">
        {error ? (
          <div className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2">
            <span>
              <i className="bi bi-exclamation-triangle me-2" aria-hidden="true" />
              {error}
            </span>
            <button className="btn btn-sm btn-outline-warning" onClick={load}>
              <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
              {t("services.retry")}
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="service-grid" aria-hidden="true">
            {Array.from({ length: 7 }).map((_, i) => (
              <div className="card service-card premium border-0" key={i}>
                <div className="service-media placeholder-glow">
                  <span className="placeholder col-6 bg-secondary-subtle" style={{ height: "2rem" }} />
                </div>
                <div className="card-body placeholder-glow">
                  <div className="placeholder col-7 mb-3" />
                  <div className="placeholder col-12 mb-2" />
                  <div className="placeholder col-10 mb-4" />
                  <div className="placeholder col-12" style={{ height: "2.25rem" }} />
                </div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <EmptyState icon="grid" message={t("services.empty")} />
        ) : (
          <div className="service-grid">
            {services.map((s) => (
              <article
                key={s.name}
                className={`card service-card premium border-0 h-100 ${
                  highlighted === s.name ? "is-highlighted" : ""
                }`}
              >
                <div className="service-media">
                  <i className={`bi bi-${iconFor(s)}`} aria-hidden="true" />
                </div>
                <div className="card-body d-flex flex-column">
                  <h3 className="service-name">{labelFor(s)}</h3>
                  <p className="service-desc text-muted">{descFor(s)}</p>
                  <Link className="btn btn-primary btn-sm service-cta mt-auto" to={bookingLink(s.name)}>
                    <i className="bi bi-calendar-plus me-2" aria-hidden="true" />
                    {t("services.bookCta")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
