import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bike, Clock, Heart, User } from 'lucide-react';

export const BottomNav = () => {
  const navItems = [
    { to: '/', label: 'Ride', icon: Bike, end: true },
    { to: '/rides', label: 'Activity', icon: Clock },
    { to: '/places', label: 'Favorites', icon: Heart },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-slate-950 text-white border-t border-slate-800 shadow-2xl">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all duration-150 ${
                isActive
                  ? 'text-[#F9D342] font-black scale-105'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-5 h-5 mb-0.5 transition-transform ${
                    isActive ? 'stroke-[2.5px] text-[#F9D342]' : 'stroke-[1.8px]'
                  }`}
                />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
