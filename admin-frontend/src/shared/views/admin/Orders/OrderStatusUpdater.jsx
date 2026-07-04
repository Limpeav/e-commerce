import { Truck, CheckCircle } from "lucide-react";

const OrderStatusUpdater = ({
  orderProgressStatuses,
  currentProgressStatus,
  currentOrderStatus,
  availableOrderActionStatuses,
  updating,
  onStatusUpdate,
}) => (
  <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-sm">
    <h2 className="mb-4 flex items-center text-lg font-semibold text-[var(--color-text-main)]">
      <Truck className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
      Update Order Status
    </h2>
    <div
      className={`mb-5 grid gap-2 ${
        orderProgressStatuses.length === 2
          ? "grid-cols-2"
          : orderProgressStatuses.length === 5
            ? "grid-cols-5"
            : "grid-cols-4"
      }`}
    >
      {orderProgressStatuses.map((status, index) => {
        const isActive = currentProgressStatus === status;
        const isPast =
          orderProgressStatuses.indexOf(currentProgressStatus) >= index &&
          currentOrderStatus !== "Cancelled";

        return (
          <div key={status} className="min-w-0">
            <div
              className={`h-2 rounded-full ${isActive || isPast ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-soft)]"}`}
            />
            <p className="mt-2 truncate text-center text-[11px] font-bold text-[var(--color-text-muted)]">
              {status}
            </p>
          </div>
        );
      })}
    </div>
    <div className="grid gap-2 sm:grid-cols-2">
      {availableOrderActionStatuses.map(({ label, value }) => {
        const isCurrent = currentOrderStatus === value;

        return (
          <button
            key={label}
            onClick={() => onStatusUpdate(value)}
            disabled={updating || isCurrent}
            aria-label={
              isCurrent
                ? `Current order status: ${label}`
                : `Mark order as ${label}`
            }
            title={
              isCurrent
                ? `Current order status: ${label}`
                : `Mark as ${label}`
            }
            className={`inline-flex h-11 w-full items-center justify-center rounded-lg px-4 font-bold transition-colors ${
              isCurrent
                ? "cursor-not-allowed bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]"
                : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
            }`}
          >
            {isCurrent ? (
              <span className="flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mr-2" aria-hidden="true" />
                {label}
              </span>
            ) : (
              `Mark as ${label}`
            )}
          </button>
        );
      })}
    </div>
  </section>
);

export default OrderStatusUpdater;
