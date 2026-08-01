import { useContext } from "react";
import { createRequiredContextHook } from "../../../../shared-frontend/context/createRequiredContextHook.js";
import { ThemeContext } from "./theme-context";

export const useTheme = createRequiredContextHook(
  useContext,
  ThemeContext,
  "useTheme",
  "ThemeProvider"
);
