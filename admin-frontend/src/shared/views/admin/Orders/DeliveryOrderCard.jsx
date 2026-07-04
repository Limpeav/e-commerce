import { MapPin, Phone, Navigation, Eye } from "lucide-react";
import Price from "../../../components/common/Price";
import {
  getStatusColor, getStatusStyle, getPaymentColor,
  formatDeliveryAddress, formatPhoneNumber, getMapUrl,
  normalizeOrderStatus,
} from "../../../utils/orderUtils";

const DeliveryOrderCard = ({ order, onNavigate, onOpenMap }) => {
  const mapUrl = getMapUrl(order.shippingAddress);
  const phone = order.shippingAddress?.phone;
  const status = normalizeOrderStatus(order.orderStatus);

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => onNavigate(order._id)}
        className="block w-full p-4 text-left"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-sm font-black text-gray-950">#{order._id.slice(-8)}</p>
            <p className="mt-1 truncate text-lg font-black text-gray-950">
              {order.shippingAddress?.fullName || order.user?.name || "Customer"}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${getStatusColor(order.orderStatus)}`}
            style={getStatusStyle(order.orderStatus)}
          >
            {status}
          </span>
        </div>

        <div className="space-y-2 text-sm font-semibold text-gray-600">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <span className="line-clamp-2">{formatDeliveryAddress(order.shippingAddress)}</span>
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            {formatPhoneNumber(phone)}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[11px] font-bold uppercase text-gray-500">Total</p>
            <Price amount={order.totalPrice} className="text-lg font-black text-gray-950" usdClassName="text-gray-950" />
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[11px] font-bold uppercase text-gray-500">Payment</p>
            <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-black ${getPaymentColor(order.paymentStatus)}`}>
              {order.paymentStatus || "Pending"}
            </p>
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 border-t border-gray-100">
        {mapUrl ? (
          <button
            type="button"
            onClick={() => onOpenMap(order.shippingAddress)}
            className="inline-flex h-14 items-center justify-center gap-2 border-r border-gray-100 text-sm font-black text-blue-700"
          >
            <Navigation className="h-5 w-5" />
            View Map
          </button>
        ) : (
          <div className="inline-flex h-14 items-center justify-center gap-2 border-r border-gray-100 text-sm font-black text-gray-400">
            <Navigation className="h-5 w-5" />
            View Map
          </div>
        )}
        <button
          type="button"
          onClick={() => onNavigate(order._id)}
          className="inline-flex h-14 items-center justify-center gap-2 text-sm font-black text-gray-950"
        >
          <Eye className="h-5 w-5" />
          Open
        </button>
      </div>
    </article>
  );
};

export default DeliveryOrderCard;
