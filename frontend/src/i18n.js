import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en/translation.js";
import gu from "./locales/gu/translation.js";
import hi from "./locales/hi/translation.js";

export const SUPPORTED_LANGUAGES = [
  { code: "gu", label: "ગુજરાતી" },
  { code: "hi", label: "हिन्दी" },
  { code: "en", label: "English" },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      gu: { translation: gu },
      hi: { translation: hi },
    },
    fallbackLng: "gu",
    supportedLngs: ["gu", "hi", "en"],
    // Default language is Gujarati.
    lng: localStorage.getItem("kaamsetu_lang") || "gu",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "kaamsetu_lang",
      caches: ["localStorage"],
    },
  });

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("kaamsetu_lang", lng);
  document.documentElement.setAttribute("lang", lng);
});

export default i18n;
