import React, { useState } from 'react';
import { Bike, Zap, Car, ChevronRight, ArrowRight, Loader2, Info } from 'lucide-react';
import { FareDetailsModal } from './FareDetailsModal';

export const CATEGORIES = [
  {
    id: 'bike',
    name: 'Ride',
    tagline: 'Fastest bike taxi for 1 rider',
    capacity: '1 Rider',
    icon: Bike,
    color: 'bg-amber-400 text-slate-900',
  },
  {
    id: 'auto',
    name: 'Auto',
    tagline: 'Palamaner 3-wheeler favorite',
    capacity: '1-3 Riders',
    icon: Zap,
    color: 'bg-[#F9D342] text-slate-900',
  },
  {
    id: 'cab',
    name: 'Cab',
    tagline: 'Comfortable 4-seater ride',
    capacity: '4 Riders',
    icon: Car,
    color: 'bg-slate-900 text-white',
  },
];

export const RideSelectionBottomSheet = ({
  selectedCategory,
  onSelectCategory,
  fares = {},
  distanceKm = 1.0,
  durationMinutes = 5,
  paymentMethod = 'cash',
  onOpenPaymentModal,
  onRequestRide,
  loading = false,
  dropoffSelected = false,
}) => {
  const [showFareBreakdown, setShowFareBreakdown] = useState(false);
  const currentFare = fares[selectedCategory];
  const finalPrice = currentFare?.totalFare || 0;

  return (
    <div className="bg-white rounded-t-3xl shadow-2xl border-t border-slate-200/80 p-4 pb-6 flex flex-col z-30 animate-in slide-in-from-bottom duration-250">
      {/* Category Selection Tiles */}
      <div className="space-y-2 mb-3">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const fareInfo = fares[cat.id];
          const price = fareInfo?.totalFare || 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                isSelected
                  ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                  : 'bg-white border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-xs ${cat.color}`}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{cat.name}</span>
                    <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                      {distanceKm} KM • {durationMinutes} min
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">{cat.tagline}</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xs font-bold text-slate-500">₹</span>
                  <span className="text-base font-black text-slate-900">{price}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Row: Payment Method Selector (Supported: Cash / Driver UPI QR) */}
      <button
        type="button"
        onClick={onOpenPaymentModal}
        className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 hover:bg-slate-50 transition-colors mb-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
            ₹
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 capitalize block">
              {paymentMethod === 'upi' ? 'Direct Driver UPI / QR' : 'Cash on Drop-off'}
            </span>
            <span className="text-[10px] text-slate-400">
              {paymentMethod === 'upi' ? 'Pay driver via phone app at destination' : 'Pay physical cash to driver upon arrival'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
          <span>Change</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </button>

      {/* Row: Fare Breakdown Info */}
      {currentFare && (
        <button
          type="button"
          onClick={() => setShowFareBreakdown(true)}
          className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-slate-800 mb-3 flex items-center justify-center gap-1"
        >
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>View fare calculation details</span>
        </button>
      )}

      {/* Yellow Pill Button: Request Ride */}
      <button
        type="button"
        onClick={onRequestRide}
        disabled={loading || !dropoffSelected}
        className="btn-yellow w-full py-4 text-xs font-black uppercase tracking-wider shadow-yellow-glow flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
            <span>Finding Verified Drivers...</span>
          </>
        ) : !dropoffSelected ? (
          <span>Select Destination to Request Ride</span>
        ) : (
          <>
            <span>Request {selectedCategory === 'bike' ? 'Bike Ride' : selectedCategory === 'auto' ? 'Auto' : 'Cab'} (₹{finalPrice})</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Fare Breakdown Modal */}
      {currentFare && (
        <FareDetailsModal
          isOpen={showFareBreakdown}
          onClose={() => setShowFareBreakdown(false)}
          fareData={currentFare}
          category={selectedCategory}
        />
      )}
    </div>
  );
};
