import { CreditCard } from "lucide-react";
import { getPaymentStatusColor } from "../../../utils/orderUtils";

const PaymentInfoCard = ({ paymentMethod, paymentStatus, isPaid, paidAt, isDelivery }) => {
  const content = (
    <div className={`grid gap-3 ${isDelivery ? "" : "sm:grid-cols-2"}`}>
      <div className="rounded-lg bg-[var(--color-surface-soft)] p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Method</p>
        <p className="mt-1 font-bold text-[var(--color-text-main)]">{paymentMethod || "N/A"}</p>
      </div>
      <div className="rounded-lg bg-[var(--color-surface-soft)] p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Status</p>
        <span
          className={`mt-2 inline-flex rounded-md border px-2.5 py-1 text-sm font-bold ${getPaymentStatusColor(paymentStatus)}`}
        >
          {paymentStatus}
        </span>
      </div>
      {isPaid && paidAt && (
        <div className={`rounded-lg bg-[var(--color-surface-soft)] p-4 ${isDelivery ? "" : "sm:col-span-2"}`}>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Paid At</p>
          <p className="mt-1 font-bold text-[var(--color-text-main)]">
            {new Date(paidAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );

  if (isDelivery) {
    return (
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-sm">
        <h2 className="mb-4 flex items-center text-lg font-semibold text-[var(--color-text-main)]">
          <CreditCard className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
          Payment Information
        </h2>
        {content}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-sm">
      <h2 className="mb-4 flex items-center text-lg font-semibold text-[var(--color-text-main)]">
        <CreditCard className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
        Payment Information
      </h2>
      {content}
    </section>
  );
};

export default PaymentInfoCard;
