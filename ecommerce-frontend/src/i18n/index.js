import i18n from "i18next";
import { translations } from "./translations";

i18n.init({
  resources: {
    en: { translation: translations.en },
    km: { translation: translations.km },
  },
  lng: localStorage.getItem("language") || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
