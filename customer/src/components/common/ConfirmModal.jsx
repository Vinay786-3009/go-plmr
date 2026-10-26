import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'primary'
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-xs text-slate-600 leading-relaxed">{message}</p>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
              confirmVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400'
                : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'
            }`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
