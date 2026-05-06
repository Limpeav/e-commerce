import { Building, CheckCircle, MapPin, Phone, User } from "lucide-react";
import GoogleMapPicker from "../../GoogleMapPicker";
import { CAMBODIA_DIAL_CODE, displayValue } from "../../../utils/checkout";

const ShippingAddressSection = ({
  isDark,
  shippingAddress,
  onInputChange,
  onLocationSelect,
}) => (
  <div className={`rounded-[2.5rem] border p-8 md:p-10 transition-colors duration-300 ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)]" : "bg-white border-stone-100 shadow-xl shadow-primary/5"}`}>
    <h2 className="text-xl font-bold text-text-main mb-8 flex items-center gap-4 font-display">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-primary border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
        <MapPin className="w-5 h-5" />
      </div>
      Shipping Address
    </h2>

    <div className="space-y-6">
      <div className="group">
        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1">
          Full Name
        </label>
        <div className="relative">
          <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-500" : "text-stone-400"}`} />
          <input
            type="text"
            name="fullName"
            value={shippingAddress.fullName}
            onChange={onInputChange}
            placeholder="Enter your full name"
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
              Pin Location
              <span className="text-red-500">*</span>
            </label>
            {shippingAddress.latitude && shippingAddress.longitude && (
              <span className="text-[10px] text-green-600 font-bold flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full border border-green-100 uppercase tracking-wide">
                <CheckCircle className="w-3 h-3" />
                Location Selected
              </span>
            )}
          </div>
          <div className={`rounded-2xl overflow-hidden border shadow-sm ${isDark ? "border-slate-700" : "border-stone-200"}`}>
            <GoogleMapPicker
              onSelectLocation={onLocationSelect}
              initialLocation={
                shippingAddress.latitude && shippingAddress.longitude
                  ? { lat: shippingAddress.latitude, lng: shippingAddress.longitude }
                  : null
              }
              address={`${shippingAddress.address}, ${shippingAddress.city}`}
            />
          </div>
        </div>
      </div>

      <div className="group">
        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1">
          Address
        </label>
        <div className={`relative flex items-center w-full pl-12 pr-6 py-3.5 border rounded-xl font-medium text-text-main min-h-[54px] ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-200"}`}>
          <Building className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-500" : "text-stone-400"}`} />
          <span>{displayValue(shippingAddress.address, "Select a location on the map")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1">
            City / Province
          </label>
          <div className={`flex items-center w-full px-6 py-3.5 border rounded-xl font-medium text-text-main min-h-[54px] ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-200"}`}>
            <span>{displayValue(shippingAddress.city, "City / Province will appear here")}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1">
            Phone Number
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

export default ShippingAddressSection;
