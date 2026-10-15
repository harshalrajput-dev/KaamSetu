import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../i18n.js";

/**
 * Compact, keyboard-accessible language dropdown.
 * Uses local state instead of Bootstrap's JS bundle (not loaded in this app).
 */
export default function LanguageSwitcher({ className = "", buttonClassName = "" }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = (i18n.resolvedLanguage || i18n.language || "gu").slice(0, 2);
  const currentLang =
    SUPPORTED_LANGUAGES.find((lng) => lng.code === current) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className={`dropdown language-switcher ${className}`} ref={ref}>
      <button
        type="button"
        className={`btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 language-toggle ${
          buttonClassName
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("common.language")}
        onClick={() => setOpen((o) => !o)}
      >
        <i className="bi bi-translate" aria-hidden="true" />
        <span className="language-current">{currentLang.label}</span>
        <i className="bi bi-chevron-down small" aria-hidden="true" />
      </button>

      {open ? (
        <ul className="dropdown-menu show language-menu shadow" role="listbox" aria-label={t("common.language")}>
          {SUPPORTED_LANGUAGES.map((lng) => {
            const active = current === lng.code;
            return (
              <li key={lng.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`dropdown-item d-flex align-items-center justify-content-between ${
                    active ? "active" : ""
                  }`}
                  onClick={() => choose(lng.code)}
                >
                  <span>{lng.label}</span>
                  {active ? <i className="bi bi-check-lg" aria-hidden="true" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
