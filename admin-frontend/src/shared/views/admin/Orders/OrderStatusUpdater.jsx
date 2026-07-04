import { CheckCircle, Package } from "lucide-react";

const getStepClasses = (status, currentStatus, progressStatuses) => {
    const currentIndex = progressStatuses.indexOf(currentStatus);
    const statusIndex = progressStatuses.indexOf(status);
    const isActive = statusIndex <= currentIndex && currentIndex >= 0;

    return isActive
        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
        : "border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]";
};

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
            <Package className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
            Update Order Status
        </h2>

        <div className="mb-5 grid gap-2 sm:grid-cols-3">
            {orderProgressStatuses.map((status) => (
                <div
                    key={status}
                    className={`flex h-12 items-center justify-center rounded-lg border px-3 text-sm font-bold ${getStepClasses(
                        status,
                        currentProgressStatus,
                        orderProgressStatuses
                    )}`}
                >
                    {status}
                </div>
            ))}
        </div>

        <div className="grid gap-2">
            {availableOrderActionStatuses.map(({ label, value }) => {
                const isCurrent = currentOrderStatus === value;

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onStatusUpdate(value)}
                        disabled={updating || isCurrent}
                        title={isCurrent ? `Current order status: ${label}` : `Mark order as ${label}`}
                        className={`inline-flex h-11 w-full items-center justify-center rounded-lg px-4 font-bold transition-colors ${
                            isCurrent
                                ? "cursor-not-allowed bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]"
                                : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                        } disabled:opacity-70`}
                    >
                        {isCurrent ? (
                            <span className="flex items-center justify-center">
                                <CheckCircle className="mr-2 h-5 w-5" aria-hidden="true" />
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
