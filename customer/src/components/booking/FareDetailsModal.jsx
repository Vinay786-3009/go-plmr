import React, { useState } from 'react';
import { X, Check, CreditCard, Banknote, ShieldCheck, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { CATEGORIES } from './CategorySelector';

export const FareDetailsModal = ({
  isOpen,
  onClose,
  category,
  fare,
  pickup,
  dropoff,
  onConfirmBooking,
  loading = false,
}) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');

  if (!isOpen || !fare || !category) return null;

  const currentCategory = CATEGORIES.find((c) => c.id === category) || CATEGORIES[1];

  const handleConfirm = () => {
    onConfirmBooking({
      vehicleCategory: category,
      fare,
      paymentMethod,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <currentCategory.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{currentCategory.name}</h3>
              <p className="text-xs text-slate-500">{currentCategory.tagline}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Summary */}
        <div className="my-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
          <div className="flex items-start gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1 flex-shrink-0"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pickup</span>
              <span className="text-xs font-semibold text-slate-800 line-clamp-1">{pickup?.address}</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600 mt-1 flex-shrink-0"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dropoff</span>
              <span className="text-xs font-semibold text-slate-800 line-clamp-1">{dropoff?.address}</span>
            </div>
          </div>

          <div className="mt-1 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Distance: <b>{fare.distanceKm} km</b></span>
            <span>Est. Time: <b>~{fare.durationMinutes} mins</b></span>
          </div>
        </div>

        {/* Fare Breakdown Table */}
        <div className="my-2 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col gap-2">
          <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
            Fare Estimate Breakdown
          </h4>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Base Fare</span>
            <span>₹{fare.baseFare}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Distance Rate ({fare.distanceKm} km)</span>
            <span>₹{fare.distanceFare}</span>
          </div>
          {fare.timeFare > 0 && (
            <div className="flex justify-between text-xs text-slate-600">
              <span>Time Fare</span>
              <span>₹{fare.timeFare}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-slate-600">
            <span>Booking / Service Fee</span>
            <span>₹{fare.bookingFee}</span>
          </div>
          <div className="pt-2 border-t border-emerald-200/60 flex justify-between items-baseline font-extrabold text-slate-900">
            <span className="text-sm">Total Estimated Fare</span>
            <span className="text-xl text-emerald-700">₹{fare.totalFare}</span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="my-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Cash on Trip</span>
              {paymentMethod === 'cash' && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600" />}
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('upi')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                paymentMethod === 'upi'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Direct UPI</span>
              {paymentMethod === 'upi' && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600" />}
            </button>
          </div>
        </div>

        {/* Guarantee Note */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>No hidden fees. Standard GO PLMR verified local rates.</span>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Requesting GO PLMR Ride...</span>
            </>
          ) : (
            <>
              <span>Confirm & Book {currentCategory.name}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
