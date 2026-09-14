// src/components/SmartWorkplace/FloatingNotificationTray.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X, 
  ExternalLink,
  Bell
} from 'lucide-react';
import { useToastStore, ToastItem } from '../../store/useToastStore';

export const FloatingNotificationTray: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onClose: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onClose }) => {
  const getIcon = () => {
    if (toast.type === 'reminder') {
      if (toast.category === 'meeting') {
        return (
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
            <Video className="w-4 h-4" />
          </div>
        );
      }
      if (toast.category === 'deadline') {
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      }
      return (
        <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4" />
        </div>
      );
    }

    switch (toast.type) {
      case 'success':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  const isReminder = toast.type === 'reminder';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 25, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto relative p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all ${
        isReminder
          ? 'bg-[#161920]/95 border-orange-500/40 shadow-orange-500/10'
          : 'bg-[#14171E]/95 border-white/15'
      }`}
    >
      {/* Top Reminder Tag if applicable */}
      {isReminder && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
            <Bell className="w-2.5 h-2.5" />
            Upcoming in 5 Minutes
          </span>
          {toast.platform && (
            <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded ${
              toast.platform === 'google_meet' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : toast.platform === 'zoom'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-white/10 text-slate-300'
            }`}>
              {toast.platform === 'google_meet' ? 'Google Meet' : toast.platform === 'zoom' ? 'Zoom' : 'Sync'}
            </span>
          )}
        </div>
      )}

      {/* Main Content Row */}
      <div className="flex items-start gap-3">
        {getIcon()}

        <div className="flex-1 min-w-0 pr-2">
          <h5 className="text-xs font-semibold text-white tracking-tight leading-snug">
            {toast.title}
          </h5>
          {toast.message && (
            <p className="text-[11px] text-slate-300/85 mt-0.5 leading-relaxed break-words">
              {toast.message}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Action Buttons Strip */}
      {toast.actions && toast.actions.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2">
          {toast.actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                action.variant === 'primary'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white shadow-sm shadow-orange-500/30'
                  : action.variant === 'secondary'
                  ? 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              {action.label === 'Join Call' && <ExternalLink className="w-3 h-3" />}
              {action.label === 'Start Focus' && <Zap className="w-3 h-3" />}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};
