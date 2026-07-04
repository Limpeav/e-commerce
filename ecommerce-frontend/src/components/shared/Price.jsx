import { useCurrency } from "../../context/CurrencyContext";
import { formatDualCurrency } from "../../utils";

const Price = ({ amount, exchangeRate: propRate, showKHR = true, className = "", usdClassName = "", khrClassName = "" }) => {
  const { exchangeRate: contextRate } = useCurrency();
  const rate = propRate ?? contextRate ?? 4100;
  const { usd, khr } = formatDualCurrency(amount, rate);

  return (
    <span className={className}>
      <span className={usdClassName}>{usd}</span>
      {showKHR && khr && (
        <span className={`text-xs opacity-60 ml-1.5 ${khrClassName}`}>
          (≈ {khr})
        </span>
      )}
    </span>
  );
};

export default Price;
