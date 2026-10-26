import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            variant === 'danger'
              ? 'bg-rose-50 text-rose-600'
              : variant === 'warning'
              ? 'bg-amber-50 text-amber-600'
              : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="btn-secondary text-xs px-4 py-2"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`text-xs px-4 py-2 ${
            variant === 'danger'
              ? 'btn-danger'
              : 'btn-primary'
          }`}
        >
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};
