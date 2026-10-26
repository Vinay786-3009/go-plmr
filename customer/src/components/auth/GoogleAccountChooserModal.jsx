import React from 'react';
import { X, User, Plus, Bike } from 'lucide-react';

export const GoogleAccountChooserModal = ({ isOpen, onClose, onSelectAccount, customEmail = '' }) => {
  if (!isOpen) return null;

  const accounts = [
    {
      name: 'Attirala Ajith',
      email: customEmail || 'vinay6b@gmail.com',
      avatar: 'A',
    },
    {
      name: 'Chaithanya Gollapalli',
      email: 'chaitanyagcg.01@gmail.com',
      avatar: 'C',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
        {/* Yellow Icon at top (From Image 2 Screen 3) */}
        <div className="w-12 h-12 rounded-full bg-[#F9D342] flex items-center justify-center mb-3 shadow-sm text-slate-900">
          <Bike className="w-6 h-6" />
        </div>

        <h3 className="text-base font-black text-slate-900">Choose an account</h3>
        <p className="text-xs text-slate-500 mt-0.5 mb-5">to continue to GO PLMR</p>

        {/* Accounts List */}
        <div className="w-full space-y-2 border-y border-slate-100 py-3 mb-4">
          {accounts.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => onSelectAccount(acc)}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {acc.avatar}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-800">{acc.name}</span>
                <span className="text-[11px] text-slate-400 truncate">{acc.email}</span>
              </div>
            </button>
          ))}

          <button
            type="button"
            onClick={() => onSelectAccount({ name: 'New Rider', email: 'rider@goplmr.com', avatar: 'R' })}
            className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 text-left transition-colors text-slate-600 font-bold text-xs"
          >
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500">
              <Plus className="w-4 h-4" />
            </div>
            <span>Add another account</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-400 text-center leading-relaxed mb-4">
          To continue, Google will share your name, email address, and profile picture with GO PLMR.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
