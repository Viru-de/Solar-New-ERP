import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DetailItem {
  label: string;
  value: string;
}

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  details?: DetailItem[];
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  details = [],
  confirmLabel = 'Delete Permanently',
  onConfirm,
  onCancel,
  isProcessing = false
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden scale-100 animate-in zoom-in-95 duration-150">
        <div className="p-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 id="delete-dialog-title" className="text-base font-bold text-slate-900">
                {title}
              </h3>
              <button
                type="button"
                onClick={onCancel}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {description}
            </p>

            {details.length > 0 && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
                {details.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">{item.label}:</span>
                    <span className="text-slate-800 font-bold truncate max-w-[200px]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Deleting...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
