import React, { useState } from 'react';
import { Star, Heart, CheckCircle2 } from 'lucide-react';

export const RideCompleteModal = ({ isOpen, onClose, ride }) => {
  const [rating, setRating] = useState(5);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#48D5E7] rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl flex flex-col items-center relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Floating Pink Hearts (From Image 2 Screen 3) */}
        <div className="absolute top-4 left-6 text-rose-400 opacity-80 animate-bounce">
          <Heart className="w-5 h-5 fill-rose-300 text-rose-400" />
        </div>
        <div className="absolute top-8 right-8 text-rose-400 opacity-80 animate-pulse">
          <Heart className="w-6 h-6 fill-rose-300 text-rose-400" />
        </div>
        <div className="absolute top-36 left-4 text-rose-300 opacity-70">
          <Heart className="w-4 h-4 fill-rose-300 text-rose-300" />
        </div>
        <div className="absolute top-32 right-5 text-rose-300 opacity-70">
          <Heart className="w-5 h-5 fill-rose-300 text-rose-300" />
        </div>

        {/* Smartphone Frame with Happy Rider Illustration (From Image 2 Screen 3) */}
        <div className="relative w-44 h-56 bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl border-4 border-slate-800 my-2">
          {/* Phone Screen Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-3 bg-slate-900 rounded-full z-10"></div>

          {/* Screen Content */}
          <div className="w-full h-full bg-[#FEF08A] rounded-[2rem] overflow-hidden flex flex-col items-center justify-end p-2 relative">
            {/* SVG Happy Rider Girl Illustration */}
            <svg className="w-32 h-44 -mb-2" viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Hair Back */}
              <circle cx="60" cy="48" r="28" fill="#1E293B" />
              {/* Face */}
              <circle cx="60" cy="52" r="20" fill="#FED7AA" />
              {/* Hair Front */}
              <path d="M42 42 C45 30 75 30 78 42 C72 40 48 40 42 42 Z" fill="#1E293B" />
              <path d="M40 45 Q36 65 42 75 Q45 60 44 48 Z" fill="#1E293B" />
              <path d="M80 45 Q84 65 78 75 Q75 60 76 48 Z" fill="#1E293B" />
              {/* Eyes & Smile */}
              <circle cx="53" cy="52" r="2" fill="#0F172A" />
              <circle cx="67" cy="52" r="2" fill="#0F172A" />
              <path d="M55 58 Q60 63 65 58" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
              {/* Cheeks */}
              <circle cx="50" cy="56" r="3" fill="#F43F5E" fillOpacity="0.4" />
              <circle cx="70" cy="56" r="3" fill="#F43F5E" fillOpacity="0.4" />
              {/* Neck & Shirt */}
              <rect x="56" y="70" width="8" height="8" fill="#FED7AA" />
              <path d="M38 78 L82 78 L90 140 L30 140 Z" fill="#E11D48" /> {/* Red Dress with white dots */}
              <circle cx="50" cy="92" r="2" fill="#FFFFFF" />
              <circle cx="68" cy="95" r="2" fill="#FFFFFF" />
              <circle cx="58" cy="110" r="2" fill="#FFFFFF" />
              <circle cx="45" cy="125" r="2" fill="#FFFFFF" />
              <circle cx="72" cy="128" r="2" fill="#FFFFFF" />
              {/* Raised Happy Arm */}
              <path d="M82 82 Q96 70 94 54" stroke="#FED7AA" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Ride Complete Text (Matching Image 2 Screen 3) */}
        <p className="text-xs font-bold text-slate-900 mt-4 mb-2 max-w-[240px] leading-relaxed">
          Your ride is complete! Don't forget to rate us on playstore
        </p>

        {/* Star Rating */}
        <div className="flex justify-center gap-1.5 my-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= rating ? 'fill-amber-300 text-amber-300 drop-shadow-sm' : 'text-white/60'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Amount Paid if available */}
        {ride?.fare?.totalFare && (
          <div className="text-[11px] font-black text-slate-800 bg-white/60 px-3 py-1 rounded-full mb-3">
            Total Fare: ₹{ride.fare.totalFare} ({ride.paymentMethod || 'Cash'})
          </div>
        )}

        {/* Green Pill OKAY Button (Matching Image 2 Screen 3) */}
        <button
          type="button"
          onClick={onClose}
          className="w-36 py-2.5 rounded-full bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white font-black text-xs tracking-wider shadow-lg transition-all mt-1"
        >
          OKAY
        </button>
      </div>
    </div>
  );
};
