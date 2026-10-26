import React from 'react';
import { Bike, Car, Users, Zap, Shield } from 'lucide-react';

export const CATEGORIES = [
  {
    id: 'bike',
    name: 'GO Bike',
    tagline: 'Fastest for 1 person',
    capacity: '1 Rider',
    icon: Bike,
    color: 'from-amber-500 to-orange-500',
    popular: false,
  },
  {
    id: 'auto',
    name: 'GO Auto',
    tagline: 'Palamaner Local Favorite',
    capacity: '1-3 Riders',
    icon: Zap, // Will display Auto indicator
    color: 'from-emerald-500 to-teal-600',
    popular: true,
  },
  {
    id: 'cab',
    name: 'GO Cab',
    tagline: 'Comfort & AC Car',
    capacity: '4 Riders',
    icon: Car,
    color: 'from-sky-500 to-indigo-600',
    popular: false,
  },
];

export const CategorySelector = ({
  selectedCategory,
  onSelectCategory,
  fares = {},
  durationMinutes = 10,
}) => {
  return (
    <div className="flex flex-col gap-2.5 my-3">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Available Rides in Palamaner
        </h4>
        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
          Real-time Fare
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const fareInfo = fares[cat.id];
          const price = fareInfo?.totalFare;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                isSelected
                  ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              {/* Category Icon & Details */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ${
                    cat.id === 'bike'
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                      : cat.id === 'auto'
                      ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                      : 'bg-gradient-to-tr from-sky-600 to-indigo-600'
                  }`}
                >
                  <cat.icon className="w-6 h-6" />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{cat.name}</span>
                    {cat.popular && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">{cat.tagline}</span>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span>{cat.capacity}</span>
                    <span>•</span>
                    <span>~{durationMinutes} mins</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xs font-semibold text-slate-500">₹</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    {price !== undefined ? price : '—'}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400">Est. Total</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
