import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map(toast => {
        const getStyles = () => {
          switch (toast.type) {
            case 'success':
              return { bg: 'bg-emerald-600 text-white', icon: CheckCircle2 };
            case 'error':
              return { bg: 'bg-rose-600 text-white', icon: AlertCircle };
            case 'warning':
              return { bg: 'bg-amber-600 text-white', icon: AlertTriangle };
            default:
              return { bg: 'bg-slate-900 text-white', icon: Info };
          }
        };

        const { bg, icon: Icon } = getStyles();

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 ${bg}`}
          >
            <div className="flex items-center gap-2.5 mr-2">
              <Icon className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium leading-snug">{toast.text}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const Toast = ToastContainer;
