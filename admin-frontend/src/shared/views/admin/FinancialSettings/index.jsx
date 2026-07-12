import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, DollarSign, Percent, Save, Truck } from "lucide-react";
import AlertMessage from "../../../components/ui/AlertMessage";
import { adminService } from "../../../services/adminService";

const defaultSettings = {
  usdToKhrRate: "4100",
  khrToUsdRate: "0.000244",
  taxPercentage: "8",
  deliveryFee: "0",
};

const toInputValue = (value, fallback) =>
  Number.isFinite(Number(value)) ? String(value) : fallback;

const parseMoneyNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const FinancialSettings = () => {
  const [form, setForm] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const preview = useMemo(() => {
    const subtotal = 100;
    const tax = subtotal * (parseMoneyNumber(form.taxPercentage) / 100);
    const delivery = parseMoneyNumber(form.deliveryFee);
    const total = subtotal + tax + delivery;
    const riel = total * parseMoneyNumber(form.usdToKhrRate);

    return {
      subtotal,
      tax,
      delivery,
      total,
      riel,
    };
  }, [form.deliveryFee, form.taxPercentage, form.usdToKhrRate]);

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await adminService.getFinancialSettings();
        if (!mounted) return;

        setForm({
          usdToKhrRate: toInputValue(response.data.usdToKhrRate, defaultSettings.usdToKhrRate),
          khrToUsdRate: toInputValue(response.data.khrToUsdRate, defaultSettings.khrToUsdRate),
          taxPercentage: toInputValue(response.data.taxPercentage, defaultSettings.taxPercentage),
          deliveryFee: toInputValue(response.data.deliveryFee, defaultSettings.deliveryFee),
        });
      } catch (error) {
        if (!mounted) return;
        setMessage({
          type: "error",
          title: "Could not load financial settings",
          text: error.response?.data?.message || error.message,
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;

    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setMessage(null);
  };

  const handleUseInverseRate = () => {
    const usdToKhrRate = parseMoneyNumber(form.usdToKhrRate);
    if (usdToKhrRate <= 0) return;

    setForm((currentForm) => ({
      ...currentForm,
      khrToUsdRate: (1 / usdToKhrRate).toFixed(6),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await adminService.updateFinancialSettings({
        usdToKhrRate: parseMoneyNumber(form.usdToKhrRate),
        khrToUsdRate: parseMoneyNumber(form.khrToUsdRate),
        taxPercentage: parseMoneyNumber(form.taxPercentage),
        deliveryFee: parseMoneyNumber(form.deliveryFee),
      });

      setForm({
        usdToKhrRate: toInputValue(response.data.usdToKhrRate, defaultSettings.usdToKhrRate),
        khrToUsdRate: toInputValue(response.data.khrToUsdRate, defaultSettings.khrToUsdRate),
        taxPercentage: toInputValue(response.data.taxPercentage, defaultSettings.taxPercentage),
        deliveryFee: toInputValue(response.data.deliveryFee, defaultSettings.deliveryFee),
      });
      setMessage({
        type: "success",
        title: "Financial settings saved",
        text: "Checkout totals and Bakong KHR conversion will use these values.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        title: "Could not save financial settings",
        text: error.response?.data?.message || error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-900 transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-primary)]">
            Store Controls
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-main)]">
            Financial Settings
          </h1>
        </div>

        {message && (
          <div className="mb-6">
            <AlertMessage {...message} />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                <ArrowLeftRight className="h-4 w-4 text-blue-600" />
                Dollar to Riel Rate
              </span>
              <input
                name="usdToKhrRate"
                value={form.usdToKhrRate}
                onChange={handleChange}
                className={fieldClass}
                inputMode="decimal"
                placeholder="4100"
                disabled={loading || saving}
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                <ArrowLeftRight className="h-4 w-4 text-emerald-600" />
                Riel to Dollar Rate
              </span>
              <div className="flex gap-2">
                <input
                  name="khrToUsdRate"
                  value={form.khrToUsdRate}
                  onChange={handleChange}
                  className={fieldClass}
                  inputMode="decimal"
                  placeholder="0.000244"
                  disabled={loading || saving}
                />
                <button
                  type="button"
                  onClick={handleUseInverseRate}
                  className="shrink-0 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading || saving || parseMoneyNumber(form.usdToKhrRate) <= 0}
                >
                  Auto
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                <Percent className="h-4 w-4 text-violet-600" />
                Tax Percentage
              </span>
              <input
                name="taxPercentage"
                value={form.taxPercentage}
                onChange={handleChange}
                className={fieldClass}
                inputMode="decimal"
                placeholder="8"
                disabled={loading || saving}
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                <Truck className="h-4 w-4 text-orange-600" />
                Delivery Fee
              </span>
              <input
                name="deliveryFee"
                value={form.deliveryFee}
                onChange={handleChange}
                className={fieldClass}
                inputMode="decimal"
                placeholder="0"
                disabled={loading || saving}
              />
            </label>
          </div>

          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-bold text-gray-700">Checkout Preview</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
              <span>Subtotal: ${preview.subtotal.toFixed(2)}</span>
              <span>Tax: ${preview.tax.toFixed(2)}</span>
              <span>Delivery: ${preview.delivery.toFixed(2)}</span>
              <span>Total: ${preview.total.toFixed(2)}</span>
              <span>KHR: {Math.round(preview.riel).toLocaleString()} Riel</span>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading || saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinancialSettings;
