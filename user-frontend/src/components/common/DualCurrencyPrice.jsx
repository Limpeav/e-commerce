import { useFinancialSettings } from "../../context/useFinancialSettings";

const formatUsd = (amount) => `$${(Number(amount) || 0).toFixed(2)}`;

const formatKhr = (amount, exchangeRate) =>
  `៛${Math.round((Number(amount) || 0) * exchangeRate).toLocaleString("en-US")}`;

export default function DualCurrencyPrice({
  amount,
  className = "",
  khrClassName = "",
  separator = " ",
}) {
  const { settings } = useFinancialSettings();
  const exchangeRate = Number(settings.usdToKhrRate) || 4100;

  return (
    <span className={className}>
      <span>{formatUsd(amount)}</span>
      {separator}
      <span className={khrClassName}>({formatKhr(amount, exchangeRate)})</span>
    </span>
  );
}
