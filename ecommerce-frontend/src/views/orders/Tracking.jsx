import { useState } from 'react';
import { Package, Truck, MapPin, CheckCircle } from 'lucide-react';

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState('');
  const [trackingData, setTrackingData] = useState(null);

  const handleTrackOrder = () => {
    if (orderNumber.trim()) {
      // Mock tracking data - replace with actual API call
      setTrackingData({
        orderNumber: orderNumber,
        status: 'shipped',
        estimatedDelivery: '2024-01-20',
        trackingHistory: [
          {
            date: '2024-01-15',
            time: '10:30 AM',
            status: 'Order Placed',
            location: 'Warehouse - New York',
            icon: <Package className="w-5 h-5 text-blue-600" />
          },
          {
            date: '2024-01-16',
            time: '2:45 PM',
            status: 'Order Processed',
            location: 'Warehouse - New York',
            icon: <CheckCircle className="w-5 h-5 text-green-600" />
          },
          {
            date: '2024-01-17',
            time: '9:15 AM',
            status: 'Shipped',
            location: 'Distribution Center - New Jersey',
            icon: <Truck className="w-5 h-5 text-orange-600" />
          }
        ]
      });
    }
  };

  return (
    <div className="min-h-screen bg-bg-base py-12 pt-32 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-black text-text-main mb-4 font-display tracking-tight leading-none">
            Orbital Tracking
          </h1>
          <p className="text-text-muted font-bold text-sm uppercase tracking-[0.2em] opacity-40">
            Real-time Logistics Sync
          </p>
        </div>

        {/* Tracking Input */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-primary/5 p-10 mb-12 border border-stone-100">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative group">
              <Package className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Enter Registry Index (e.g., ORD-2024-001)"
                className="w-full pl-14 pr-6 py-4.5 bg-stone-50 border-2 border-stone-100 rounded-[2rem] focus:outline-none focus:border-primary transition-all text-text-main font-bold placeholder-stone-300"
              />
            </div>
            <button
              onClick={handleTrackOrder}
              className="bg-text-main text-white px-10 py-4.5 rounded-[2rem] hover:bg-primary transition-all shadow-2xl shadow-primary/10 font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 flex items-center justify-center gap-3"
            >
              Track Order
            </button>
          </div>
        </div>

        {/* Tracking Results */}
        {trackingData && (
          <div className="space-y-10 animate-slideUp">
            {/* Current Status */}
            <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-primary/5 p-10 border border-stone-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Truck className="w-32 h-32 text-text-main" />
              </div>
              <h2 className="text-[10px] font-black text-text-main mb-10 flex items-center gap-3 uppercase tracking-[0.3em] relative z-10">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                Telemetry Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                <div>
                  <p className="text-[10px] font-black text-primary/40 mb-3 uppercase tracking-[0.3em]">Registry Index</p>
                  <p className="font-mono text-sm font-black text-text-main bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-100 inline-block">#{trackingData.orderNumber.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary/40 mb-3 uppercase tracking-[0.3em]">Current Protocol</p>
                  <p className="font-black text-secondary text-sm uppercase tracking-widest bg-secondary/5 px-4 py-2 rounded-full border border-secondary/10 inline-block">{trackingData.status}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary/40 mb-3 uppercase tracking-[0.3em]">Expected Arrival</p>
                  <p className="font-black text-text-main text-sm">{new Date(trackingData.estimatedDelivery).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Tracking History */}
            <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-primary/5 p-10 border border-stone-100">
              <h2 className="text-[10px] font-black text-text-main mb-10 flex items-center gap-3 uppercase tracking-[0.3em]">
                <MapPin className="w-4 h-4 text-primary" />
                Transit Logs
              </h2>
              <div className="space-y-8 relative">
                {/* Vertical Line */}
                <div className="absolute left-[26px] top-2 bottom-2 w-0.5 bg-stone-100"></div>

                {trackingData.trackingHistory.map((event, index) => (
                  <div key={index} className="flex items-start gap-8 relative group">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-stone-100 group-hover:scale-110 transition-transform relative z-10 ring-8 ring-white">
                      {event.icon}
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                        <p className="font-black text-text-main uppercase tracking-widest text-sm">{event.status}</p>
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                          {new Date(event.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase()} // {event.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-primary/60 uppercase tracking-widest">
                        <MapPin className="w-3 h-3" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
