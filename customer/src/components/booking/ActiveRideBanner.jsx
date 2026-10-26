import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight, Loader2, CheckCircle2, User, Car } from 'lucide-react';

export const ActiveRideBanner = ({ ride }) => {
  if (!ride) return null;

  const statusConfig = {
    requested: {
      label: 'Searching for Driver',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Looking for available drivers nearby...',
      showSpinner: true,
    },
    searching: {
      label: 'Searching for Driver',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Broadening search radius in Palamaner...',
      showSpinner: true,
    },
    driver_assigned: {
      label: 'Driver Assigned',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      description: ride.driverName ? `${ride.driverName} is on the way!` : 'A driver has accepted your ride.',
      showSpinner: false,
    },
    driver_arriving: {
      label: 'Driver Arriving',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Driver is reaching your pickup location.',
      showSpinner: false,
    },
    ride_started: {
      label: 'Trip in Progress',
      badgeColor: 'bg-emerald-600 text-white border-transparent',
      description: `Heading towards destination (₹${ride.fare?.totalFare || 0})`,
      showSpinner: false,
    },
  };

  const current = statusConfig[ride.status] || {
    label: ride.status,
    badgeColor: 'bg-slate-100 text-slate-700',
    description: 'Active ride update',
    showSpinner: false,
  };

  return (
    <Link
      to={`/rides/${ride.id}`}
      className="mb-4 block p-4 rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white shadow-xl hover:shadow-2xl transition-all border border-emerald-600/40 group active:scale-[0.99]"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
            Active Trip
          </span>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${current.badgeColor}`}
        >
          {current.label}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex flex-col">
          <span className="text-sm font-extrabold text-white group-hover:text-emerald-100 transition-colors">
            {current.description}
          </span>
          <span className="text-xs text-emerald-200/90 line-clamp-1 mt-0.5">
            Drop: {ride.dropoff?.address}
          </span>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-white/10 group-hover:bg-white/20 text-white flex items-center justify-center flex-shrink-0 transition-colors">
          <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
};
