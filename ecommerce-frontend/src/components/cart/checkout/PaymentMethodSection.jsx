import { CreditCard } from "lucide-react";

const PAYMENT_METHODS = ["BAKONG_KHQR", "Cash on Delivery"];

const PaymentMethodSection = ({ isDark, paymentMethod, onPaymentMethodChange }) => (
  <div className={`rounded-[2.5rem] border p-8 md:p-10 transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)]" : "bg-white border-stone-100 shadow-xl shadow-primary/5"}`}>
    <h2 className="text-xl font-bold text-text-main mb-8 flex items-center gap-4 font-display">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-primary border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
        <CreditCard className="w-5 h-5" />
      </div>
      Payment Method
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {PAYMENT_METHODS.map((method) => (
        <label
          key={method}
          className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition-all group ${paymentMethod === method
            ? "border-primary bg-primary/5 shadow-sm"
            : isDark
              ? "border-slate-700 hover:border-primary/40 hover:bg-slate-800"
              : "border-stone-200 hover:border-primary/30 hover:bg-stone-50"
            }`}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === method ? "border-primary bg-primary" : isDark ? "border-slate-600" : "border-stone-300"}`}>
            {paymentMethod === method && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
          <input
            type="radio"
            name="paymentMethod"
            value={method}
            checked={paymentMethod === method}
            onChange={(event) => onPaymentMethodChange(event.target.value)}
            className="hidden"
          />
          <span className={`font-bold text-sm ${paymentMethod === method ? "text-primary" : isDark ? "text-slate-400" : "text-text-muted"}`}>
            {method}
          </span>
        </label>
      ))}
    </div>
  </div>
);

export default PaymentMethodSection;
