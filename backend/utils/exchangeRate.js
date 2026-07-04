export const calcAmountKHR = (amountUSD, exchangeRate) =>
  Math.round(Number(amountUSD || 0) * Number(exchangeRate || 0));

export const formatKHR = (amountKHR) =>
  amountKHR ? amountKHR.toLocaleString() : "0";

export const DEFAULT_RATE = 4100;
