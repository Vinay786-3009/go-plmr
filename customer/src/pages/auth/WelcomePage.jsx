import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const WelcomePage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const navigate = useNavigate();

  const handleNext = () => {
    navigate('/permissions');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top 45% Yellow Header (Matching Image 2 Screen 1) */}
      <div className="bg-[#F9D342] h-[45vh] min-h-[260px] p-6 pb-8 flex flex-col justify-end text-slate-900">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
          Welcome to GO PLMR
        </h1>
        <p className="text-xs sm:text-sm text-slate-800 font-semibold mt-1">
          Choose a language to get started
        </p>
      </div>

      {/* Lower White Portion */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="mt-4">
          <label className="text-xs font-bold text-slate-400 block mb-2">
            Select Language
          </label>
          <div className="relative border-b-2 border-slate-300 focus-within:border-slate-900 pb-1">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="English">English</option>
              <option value="Telugu">తెలుగు (Telugu)</option>
              <option value="Hindi">हिन्दी (Hindi)</option>
              <option value="Tamil">தமிழ் (Tamil)</option>
              <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">
              ▼
            </span>
          </div>
        </div>

        {/* Bottom Bar: Permission Note & Black Pill NEXT Button (From Image 2 Screen 1) */}
        <div className="pt-8 pb-4 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            Location permission granted
          </span>

          <button
            onClick={handleNext}
            className="bg-black hover:bg-slate-900 active:scale-95 text-white font-black text-xs px-8 py-3.5 rounded-full shadow-md uppercase tracking-wider transition-all"
          >
            NEXT
          </button>
        </div>
      </div>
    </div>
  );
};
