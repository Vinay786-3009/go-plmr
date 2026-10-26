import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const PermissionsPage = () => {
  const navigate = useNavigate();
  const { success, info } = useToast();
  const [requesting, setRequesting] = useState(false);

  const handleAllowPermissions = () => {
    setRequesting(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          localStorage.setItem('goplmr_location_permission', 'granted');
          success('Location permission granted.');
          navigate('/login');
        },
        (err) => {
          console.warn('Geolocation denied or dismissed:', err);
          localStorage.setItem('goplmr_location_permission', 'prompted');
          info('You can still enter pickup locations manually.');
          navigate('/login');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top Graphic Illustration Header (Matching Image 2 Screen 4) */}
      <div className="pt-8 pb-4 px-6 flex flex-col items-center justify-center">
        <div className="relative w-64 h-48 flex items-center justify-center">
          {/* Circular Accent Background */}
          <div className="absolute w-36 h-36 rounded-full bg-amber-100/70 -z-10 animate-pulse"></div>

          {/* SVG Scooter & Taxi Rider Illustration */}
          <svg className="w-48 h-40" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Ground line */}
            <path d="M10 145 H190" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
            
            {/* Trees & Bush background */}
            <circle cx="35" cy="115" r="22" fill="#86EFAC" fillOpacity="0.4" />
            <circle cx="165" cy="118" r="18" fill="#86EFAC" fillOpacity="0.4" />

            {/* Scooter Wheels */}
            <circle cx="50" cy="132" r="15" fill="#1E293B" stroke="#94A3B8" strokeWidth="3" />
            <circle cx="50" cy="132" r="5" fill="#F8FAFC" />
            <circle cx="145" cy="132" r="15" fill="#1E293B" stroke="#94A3B8" strokeWidth="3" />
            <circle cx="145" cy="132" r="5" fill="#F8FAFC" />

            {/* Scooter Body (Bright Rapido / GO PLMR Yellow) */}
            <path d="M48 130 L75 125 L95 105 L135 105 L150 128" fill="#F9D342" stroke="#D97706" strokeWidth="2" />
            <path d="M85 105 L115 105 L115 128 L80 128 Z" fill="#FACC15" />
            <path d="M115 105 L130 75 L125 73" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" />
            
            {/* Scooter Headlight & Windshield */}
            <path d="M130 75 L135 70" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
            <circle cx="137" cy="69" r="4" fill="#FEF08A" />

            {/* Rider Body & Yellow Helmet */}
            <path d="M88 100 L95 72 L115 75 L110 102 Z" fill="#2563EB" /> {/* Blue Shirt */}
            <path d="M110 77 L125 76" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" /> {/* Arm */}
            <circle cx="106" cy="55" r="13" fill="#F9D342" stroke="#B45309" strokeWidth="2" /> {/* Helmet */}
            <path d="M100 56 Q112 56 116 52" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" /> {/* Visor */}
            <path d="M92 102 L100 125" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" /> {/* Pants */}

            {/* Floating Brand Badge */}
            <rect x="76" y="112" width="40" height="12" rx="4" fill="#0F172A" />
            <text x="96" y="121" fill="#F9D342" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">GO PLMR</text>
          </svg>

          {/* Floating Phone & Location Badges */}
          <div className="absolute top-4 left-6 w-9 h-9 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center shadow-md">
            <Phone className="w-4 h-4 fill-current" />
          </div>
          <div className="absolute top-2 right-6 w-9 h-9 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center shadow-md">
            <MapPin className="w-4 h-4 fill-current text-white" />
          </div>
        </div>
      </div>

      {/* Content Section (Matching Image 2 Screen 4) */}
      <div className="flex-1 px-8 pt-2 pb-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight text-center leading-snug">
            India's Beloved Bike Taxi Service
          </h2>
          <p className="text-xs text-slate-500 font-medium text-center mt-2 mb-8 leading-relaxed">
            To have a comfortable ride experience with GO PLMR, please allow us the following permissions
          </p>

          {/* Permissions List */}
          <div className="space-y-6">
            {/* Location Permission */}
            <div className="flex items-start gap-4">
              <div className="mt-0.5 text-slate-900">
                <MapPin className="w-5 h-5 fill-slate-900 text-slate-900" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900">
                  Location: <span className="font-normal text-slate-600">To locate you and get rides easily</span>
                </span>
              </div>
            </div>

            {/* Phone Permission */}
            <div className="flex items-start gap-4">
              <div className="mt-0.5 text-slate-900">
                <Phone className="w-5 h-5 fill-slate-900 text-slate-900" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900">
                  Phone: <span className="font-normal text-slate-600">To verify your account and secure it</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Allow Permissions Button (Matching Image 2 Screen 4) */}
        <div className="pt-8 pb-4">
          <button
            type="button"
            onClick={handleAllowPermissions}
            disabled={requesting}
            className="w-full py-4 rounded-xl bg-[#F9D342] hover:bg-[#ecc432] active:scale-[0.99] text-slate-900 font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>{requesting ? 'Requesting Permissions...' : 'Allow Permissions'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full text-center text-[11px] font-bold text-slate-400 hover:text-slate-600 mt-3"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};
