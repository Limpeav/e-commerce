import { Building, CheckCircle, MapPin, Phone, User } from "lucide-react";
import GoogleMapPicker from "../../GoogleMapPicker";
import CheckoutError from "./CheckoutError";
import { CAMBODIA_DIAL_CODE } from "../../../utils/checkout";
import { useLanguage } from "../../../context/useLanguage";

const ShippingAddressSection = ({
  isDark,
  shippingAddress,
  onInputChange,
  onLocationSelect,
  error,
  errorRef,
}) => {
  const { t } = useLanguage();
  const mapAddress = [shippingAddress.street, shippingAddress.address, shippingAddress.city]
    .filter(Boolean)
    .join(", ");
  const selectedLatitude = Number(shippingAddress.latitude);
  const selectedLongitude = Number(shippingAddress.longitude);
  const hasSelectedLocation =
    shippingAddress.latitude !== null &&
    shippingAddress.latitude !== "" &&
    shippingAddress.longitude !== null &&
    shippingAddress.longitude !== "" &&
    Number.isFinite(selectedLatitude) &&
    Number.isFinite(selectedLongitude);

  return (
    <div className={`rounded-[2.5rem] border p-8 md:p-10 transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)]" : "bg-white border-stone-100 shadow-xl shadow-primary/5"}`}>
    <h2 className="text-xl font-bold text-text-main mb-8 flex items-center gap-4 font-display">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-primary border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
        <MapPin className="w-5 h-5" />
      </div>
      {t("checkout.shippingAddress")}
    </h2>

    <div className="space-y-6">
      <div className="group">
        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1">
          {t("checkout.fullName")}
        </label>
        <div className="relative">
          <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-500" : "text-stone-400"}`} />
          <input
            type="text"
            name="fullName"
            value={shippingAddress.fullName}
            onChange={onInputChange}
            placeholder={t("checkout.enterFullName")}
            className={`w-full pl-12 pr-6 py-3.5 border rounded-xl font-medium text-text-main min-h-[54px] ${
              isDark
                ? "bg-slate-800 border-slate-700 placeholder:text-slate-500"
                : "bg-stone-50 border-stone-200 placeholder:text-stone-400"
            }`}
          />
        </div>
      </div>

      <div className="group">
        <div className={`pt-2 ${isDark ? "border-slate-800" : "border-stone-100"}`}>
          <div className="flex items-center justify-between mb-4">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t("checkout.pinLocation")}
              <span className="text-red-500">*</span>
            </label>
            {hasSelectedLocation && (
              <span className="text-[10px] text-green-600 font-bold flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full border border-green-100 uppercase tracking-wide">
                <CheckCircle className="w-3 h-3" />
                {t("checkout.locationSelected")}
              </span>
            )}
          </div>
          <div className={`rounded-2xl overflow-hidden border shadow-sm ${isDark ? "border-slate-700" : "border-stone-200"}`}>
            <GoogleMapPicker
              onSelectLocation={onLocationSelect}
              isDark={isDark}
              initialLocation={
                hasSelectedLocation
                  ? { lat: selectedLatitude, lng: selectedLongitude }
                  : null
              }
              address={mapAddress}
            />
          </div>
        </div>
      </div>

      <CheckoutError error={error} errorRef={errorRef} isDark={isDark} />

      <div className="group">
        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1">
          {t("checkout.street")} <span className="normal-case font-medium">({t("checkout.optional")})</span>
        </label>
        <div className="relative">
          <Building className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-500" : "text-stone-400"}`} />
          <input
            type="text"
            name="street"
            autoComplete="new-password"
            aria-autocomplete="none"
            data-form-type="other"
            value={shippingAddress.street}
            onChange={onInputChange}
            placeholder={t("checkout.streetPlaceholder")}
            className={`w-full pl-12 pr-6 py-3.5 border rounded-xl font-medium text-text-main min-h-[54px] ${
              isDark
                ? "bg-slate-800 border-slate-700 placeholder:text-slate-500"
                : "bg-stone-50 border-stone-200 placeholder:text-stone-400"
            }`}
          />
        </div>
      </div>

      <div className="group">
        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1">
          {t("checkout.address")} <span className="normal-case font-medium">({t("checkout.optional")})</span>
        </label>
        <div className="relative">
          <Building className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-500" : "text-stone-400"}`} />
          <input
            type="text"
            name="address"
            value={shippingAddress.address}
            onChange={onInputChange}
            placeholder={t("checkout.addressPlaceholder")}
            className={`w-full pl-12 pr-6 py-3.5 border rounded-xl font-medium text-text-main min-h-[54px] ${
              isDark
                ? "bg-slate-800 border-slate-700 placeholder:text-slate-500"
                : "bg-stone-50 border-stone-200 placeholder:text-stone-400"
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1">
            {t("checkout.cityProvince")} <span className="normal-case font-medium">({t("checkout.optional")})</span>
          </label>
          <input
            type="text"
            name="city"
            value={shippingAddress.city}
            onChange={onInputChange}
            placeholder={t("checkout.cityProvincePlaceholder")}
            className={`w-full px-6 py-3.5 border rounded-xl font-medium text-text-main min-h-[54px] ${
              isDark
                ? "bg-slate-800 border-slate-700 placeholder:text-slate-500"
                : "bg-stone-50 border-stone-200 placeholder:text-stone-400"
            }`}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1">
            {t("checkout.phoneNumber")}
          </label>
          <div className="relative">
            <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-500" : "text-stone-400"}`} />
            <span className={`absolute left-12 top-1/2 -translate-y-1/2 text-sm font-bold ${isDark ? "text-slate-200" : "text-text-main"}`}>
              {CAMBODIA_DIAL_CODE}
            </span>
            <input
              type="tel"
              name="phone"
              value={shippingAddress.phone}
              onChange={onInputChange}
              placeholder="12 345 678"
              inputMode="numeric"
              className={`w-full pl-28 pr-6 py-3.5 border rounded-xl font-medium text-text-main min-h-[54px] ${
                isDark
                  ? "bg-slate-800 border-slate-700 placeholder:text-slate-500"
                  : "bg-stone-50 border-stone-200 placeholder:text-stone-400"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ShippingAddressSection;
