import { createContext, useContext, useState, useEffect, useCallback } from "react";

const CurrencyContext = createContext(null);

const EXCHANGE_RATE_CACHE_KEY = "exchange_rate";
const EXCHANGE_RATE_CACHE_DURATION = 5 * 60 * 1000;

export function CurrencyProvider({ children, apiBaseUrl = "/api", fetchOptions = {} }) {
  const [exchangeRate, setExchangeRate] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchExchangeRate = useCallback(async () => {
    try {
      const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
      if (cached) {
        const { rate, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < EXCHANGE_RATE_CACHE_DURATION) {
          setExchangeRate(rate);
          setLoading(false);
          return;
        }
      }

      const { default: axios } = await import("axios");
      const response = await axios.get(`${apiBaseUrl}/payments/exchange-rate`, fetchOptions);
      const rate = response.data?.exchangeRate || response.data?.rate || 4100;
      setExchangeRate(rate);

      localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }));
    } catch {
      setExchangeRate(4100);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchExchangeRate();
  }, [fetchExchangeRate]);

  return (
    <CurrencyContext.Provider value={{ exchangeRate, loading, refetch: fetchExchangeRate }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    return { exchangeRate: 4100, loading: false, refetch: () => {} };
  }
  return context;
}

export default CurrencyContext;
