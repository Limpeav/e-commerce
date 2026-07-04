import { Calendar, CheckCircle, CreditCard } from "lucide-react";

const formatPaidAt = (paidAt) => {
    if (!paidAt) {
        return "Not paid yet";
    }

    return new Date(paidAt).toLocaleString();
};

const getStatusClasses = (paymentStatus, isPaid) => {
    if (isPaid || paymentStatus === "Paid") {
        return "border-green-200 bg-green-50 text-green-700";
    }

    if (paymentStatus === "Failed") {
        return "border-red-200 bg-red-50 text-red-700";
    }

    return "border-yellow-200 bg-yellow-50 text-yellow-700";
};

const PaymentInfoCard = ({
    paymentMethod,
    paymentStatus,
    isPaid,
    paidAt,
    isDelivery = false,
}) => {
    const statusClasses = getStatusClasses(paymentStatus, isPaid);

    return (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="flex items-center text-lg font-semibold text-[var(--color-text-main)]">
                    <CreditCard className="mr-2 h-5 w-5 text-[var(--color-primary)]" />
                    Payment Information
                </h2>
                <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-bold ${statusClasses}`}>
                    <CheckCircle className="mr-1.5 h-4 w-4" />
                    {paymentStatus || "Pending"}
                </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                        Method
                    </p>
                    <p className="mt-1 font-bold text-[var(--color-text-main)]">
                        {paymentMethod || "N/A"}
                    </p>
                </div>

                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
                    <p className="flex items-center text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                        <Calendar className="mr-1.5 h-4 w-4" />
                        {isDelivery ? "Collection Time" : "Paid At"}
                    </p>
                    <p className="mt-1 font-bold text-[var(--color-text-main)]">
                        {formatPaidAt(paidAt)}
                    </p>
                </div>
            </div>
        </section>
    );
};

export default PaymentInfoCard;
