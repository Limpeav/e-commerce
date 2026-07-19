export const formatDualCurrency = (amountUSD, exchangeRate) => {
  const usd = Number(amountUSD || 0);
  const rate = Number(exchangeRate || 4100);
  const khr = Math.round(usd * rate);

  return {
    usd: `$${usd.toFixed(2)}`,
    khr: `${khr.toLocaleString("en-US")} KHR`,
  };
};

export const formatDualCurrencyString = (amountUSD, exchangeRate) => {
  const { usd, khr } = formatDualCurrency(amountUSD, exchangeRate);
  return `${usd} (≈ ${khr})`;
};
