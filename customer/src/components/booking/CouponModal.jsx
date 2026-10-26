import React, { useState } from 'react';
import { X, Tag, Check, ArrowRight } from 'lucide-react';

export const CouponModal = ({ isOpen, onClose, onApplyCoupon, currentDiscount = 0 }) => {
  const [couponCode, setCouponCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const availableCoupons = [
    { code: 'GOPLMR', discountPct: 20, desc: '20% Flat Discount for Palamaner Riders (Max ₹30)' },
    { code: 'WELCOME50', discountPct: 50, desc: '50% Off on your first ride with GO PLMR (Max ₹50)' },
    { code: 'PALAMANER', discountPct: 15, desc: 'Special 15% local discount across town' },
  ];

  const handleApply = (code) => {
    const found = availableCoupons.find((c) => c.code === code.trim().toUpperCase());
    if (found) {
      onApplyCoupon(found);
      onClose();
    } else {
      setErrorMsg('Invalid coupon code. Try GOPLMR or WELCOME50.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-t-3xl max-w-md w-full p-6 shadow-2xl flex flex-col max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-250">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-black text-slate-900">Apply Coupon Code</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase());
              setErrorMsg('');
            }}
            placeholder="ENTER COUPON CODE"
            className="input-field font-mono font-bold tracking-wider"
          />
          <button
            onClick={() => handleApply(couponCode)}
            className="btn-yellow px-5 text-xs font-black uppercase flex-shrink-0"
          >
            Apply
          </button>
        </div>

        {errorMsg && (
          <span className="text-xs text-rose-600 font-semibold mt-1.5">{errorMsg}</span>
        )}

        {/* Available Coupons list */}
        <div className="mt-5 space-y-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Available Offers
          </span>

          {availableCoupons.map((coupon) => (
            <div
              key={coupon.code}
              className="p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 flex items-center justify-between transition-colors bg-slate-50/50"
            >
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900 tracking-wider">
                  {coupon.code}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">{coupon.desc}</span>
              </div>
              <button
                type="button"
                onClick={() => handleApply(coupon.code)}
                className="px-3 py-1 rounded-full bg-slate-900 text-white hover:bg-black text-[11px] font-bold"
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
