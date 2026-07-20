import { createContext } from "react";

import { DEFAULT_FINANCIAL_SETTINGS } from "../utils/checkout";

export const FinancialContext = createContext({
  settings: DEFAULT_FINANCIAL_SETTINGS,
  loading: true,
  refreshFinancialSettings: async () => {},
});
