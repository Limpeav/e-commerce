import { useContext } from "react";
import { createRequiredContextHook } from "../../../shared-frontend/context/createRequiredContextHook.js";
import { LanguageContext } from "./language-context";

export const useLanguage = createRequiredContextHook(
  useContext,
  LanguageContext,
  "useLanguage",
  "LanguageProvider"
);
