// src/store/useToastStore.ts
import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'reminder';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  category?: 'meeting' | 'deadline' | 'focus' | 'general';
  meetingUrl?: string;
  platform?: 'google_meet' | 'zoom' | 'custom';
  duration?: number; // ms before auto-dismiss, null/0 for persistent
  actions?: ToastAction[];
  createdAt: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => string;
  removeToast: (id: string) => void;
  showSuccess: (title: string, message?: string) => string;
  showInfo: (title: string, message?: string) => string;
  showReminder: (reminder: {
    title: string;
    message: string;
    category: 'meeting' | 'deadline' | 'focus';
    meetingUrl?: string;
    platform?: 'google_meet' | 'zoom' | 'custom';
    onJoin?: () => void;
    onStartFocus?: () => void;
    onSnooze?: () => void;
  }) => string;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = {
      ...toast,
      id,
      createdAt: Date.now(),
      duration: toast.duration ?? (toast.type === 'reminder' ? 12000 : 4000),
    };

    set((state) => ({
      toasts: [newToast, ...state.toasts.slice(0, 4)], // Keep maximum 5 concurrent toasts
    }));

    // Auto-dismiss if duration > 0
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  showSuccess: (title, message) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = {
      id,
      type: 'success',
      title,
      message,
      duration: 3500,
      createdAt: Date.now(),
    };
    set((state) => ({ toasts: [newToast, ...state.toasts.slice(0, 4)] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3500);
    return id;
  },

  showInfo: (title, message) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = {
      id,
      type: 'info',
      title,
      message,
      duration: 4000,
      createdAt: Date.now(),
    };
    set((state) => ({ toasts: [newToast, ...state.toasts.slice(0, 4)] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
    return id;
  },

  showReminder: (reminder) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const actions: ToastAction[] = [];

    if (reminder.onJoin || reminder.meetingUrl) {
      actions.push({
        label: 'Join Call',
        variant: 'primary',
        onClick: () => {
          if (reminder.onJoin) {
            reminder.onJoin();
          } else if (reminder.meetingUrl) {
            window.open(reminder.meetingUrl, '_blank');
          }
        },
      });
    }

    if (reminder.onStartFocus) {
      actions.push({
        label: 'Start Focus',
        variant: 'primary',
        onClick: reminder.onStartFocus,
      });
    }

    if (reminder.onSnooze) {
      actions.push({
        label: 'Snooze 5m',
        variant: 'secondary',
        onClick: reminder.onSnooze,
      });
    }

    const newToast: ToastItem = {
      id,
      type: 'reminder',
      title: reminder.title,
      message: reminder.message,
      category: reminder.category,
      meetingUrl: reminder.meetingUrl,
      platform: reminder.platform,
      duration: 15000, // 15 seconds visibility
      actions,
      createdAt: Date.now(),
    };

    set((state) => ({ toasts: [newToast, ...state.toasts.slice(0, 4)] }));

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 15000);

    return id;
  },
}));
