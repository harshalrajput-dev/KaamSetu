import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Password field with a leading lock icon and a show/hide toggle.
 * Forwards standard input props (value, onChange, autoComplete, ...).
 */
export default function PasswordInput({
  value,
  onChange,
  autoComplete,
  required,
  placeholder,
  id,
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <div className="input-group has-icon">
      <span className="input-group-text">
        <i className="bi bi-lock" aria-hidden="true" />
      </span>
      <input
        id={id}
        type={visible ? "text" : "password"}
        className="form-control"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="btn btn-outline-secondary password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t("common.hidePassword") : t("common.showPassword")}
        aria-pressed={visible}
        tabIndex={-1}
      >
        <i className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
      </button>
    </div>
  );
}
