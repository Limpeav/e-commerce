const formatDualCurrency = (amountUSD, exchangeRate) => {
  const usd = `$${Number(amountUSD || 0).toFixed(2)}`;
  const khr = exchangeRate ? `${Math.round(Number(amountUSD || 0) * exchangeRate).toLocaleString()} ៛` : null;
  return { usd, khr };
};

const Price = ({ amount, exchangeRate: propRate, showKHR = true, className = "", usdClassName = "", khrClassName = "" }) => {
  const rate = propRate ?? 4100;
  const { usd, khr } = formatDualCurrency(amount, rate);

  return (
    <span className={className}>
      <span className={usdClassName}>{usd}</span>
      {showKHR && khr && (
        <span className={`text-xs opacity-60 ml-1.5 ${khrClassName}`}>
          ({khr})
        </span>
      )}
    </span>
  );
};

export default Price;
