export const formatDualCurrency = (amountUSD, exchangeRate) => {
  const usd = `$${Number(amountUSD || 0).toFixed(2)}`;
  const khr = exchangeRate ? `${Math.round(Number(amountUSD || 0) * exchangeRate).toLocaleString()} ៛` : null;
  return { usd, khr };
};

export const formatDualCurrencyString = (amountUSD, exchangeRate) => {
  const { usd, khr } = formatDualCurrency(amountUSD, exchangeRate);
  return khr ? `${usd} (≈ ${khr})` : usd;
};
