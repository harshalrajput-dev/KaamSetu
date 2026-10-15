import { useTranslation } from "react-i18next";

/**
 * Small helper to render a service name in the active interface language.
 * Falls back to the raw name when no translated label exists.
 */
export function useServiceLabel() {
  const { t } = useTranslation();

  return (name) => {
    const key = `services.${name}`;
    const translated = t(key);
    if (translated !== key) return translated;
    return name;
  };
}

export default useServiceLabel;
