import React from 'react';
import { X, Check, Banknote, QrCode, ShieldCheck, AlertCircle } from 'lucide-react';

export const PaymentMethodsModal = ({
  isOpen,
  onClose,
  totalAmount = 0,
  selectedPayment = 'cash',
  onSelectPayment,
}) => {
  if (!isOpen) return null;

  const supportedMethods = [
    {
      id: 'cash',
      name: 'Cash on Drop-off',
      description: 'Pay driver in cash upon arriving at your destination',
      icon: Banknote,
      iconColor: 'bg-emerald-100 text-emerald-700',
      isRecommended: true,
    },
    {
      id: 'upi',
      name: 'Direct Driver UPI / QR Scan',
      description: 'Scan the driver’s QR code or pay via PhonePe / GPay / Paytm after the ride',
      icon: QrCode,
      iconColor: 'bg-sky-100 text-sky-700',
      isRecommended: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Trip Payment Method
            </span>
            <div className="text-xl font-black text-slate-900 flex items-baseline gap-1 mt-0.5">
              <span>Estimated Fare:</span>
              <span className="text-emerald-700">₹{totalAmount}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close Payment Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supported Methods */}
        <div className="mt-4 space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Available Payment Options
          </span>

          {supportedMethods.map((method) => {
            const isSelected = selectedPayment === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => {
                  onSelectPayment(method.id);
                  onClose();
                }}
                className={`w-full flex items-start justify-between p-3.5 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method.iconColor}`}>
                    <method.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{method.name}</span>
                      {method.isRecommended && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {method.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center pt-1">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Safety & Transparent Policy Notice (Compliance with Rule #9) */}
        <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <b>100% Secure Payment:</b> Pay your driver only after safely reaching your destination. GO PLMR will never ask for your UPI PIN, banking passwords, or card security codes.
          </p>
        </div>
      </div>
    </div>
  );
};
