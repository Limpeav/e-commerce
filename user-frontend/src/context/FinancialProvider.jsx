import { useCallback, useEffect, useMemo, useState } from "react";
import { settingsService } from "../services/settingsService";
import { DEFAULT_FINANCIAL_SETTINGS } from "../utils/checkout";
import { FinancialContext } from "./financial-context";

const normalizeSettings = (settings = {}) => ({
  ...DEFAULT_FINANCIAL_SETTINGS,
  ...settings,
  usdToKhrRate:
    Number(settings.usdToKhrRate) > 0
      ? Number(settings.usdToKhrRate)
      : DEFAULT_FINANCIAL_SETTINGS.usdToKhrRate,
});

export function FinancialProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_FINANCIAL_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refreshFinancialSettings = useCallback(async () => {
    try {
      const response = await settingsService.getFinancialSettings();
      setSettings(normalizeSettings(response.data));
    } catch (error) {
      console.error("Failed to load financial settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFinancialSettings();
  }, [refreshFinancialSettings]);

  const value = useMemo(
    () => ({ settings, loading, refreshFinancialSettings }),
    [settings, loading, refreshFinancialSettings]
  );

  return <FinancialContext.Provider value={value}>{children}</FinancialContext.Provider>;
}
