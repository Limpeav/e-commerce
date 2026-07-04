import i18n from "i18next";
import { translations } from "./translations";

const storedLanguage = localStorage.getItem("language");
const initialLanguage = storedLanguage === "km" ? "kh" : storedLanguage || "en";

i18n.init({
  resources: {
    en: { translation: translations.en },
    kh: { translation: translations.kh },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
