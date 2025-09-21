'use client';

import { create } from 'zustand';

type ToastType = 'success' | 'info' | 'error';

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastState = {
  toasts: Toast[];
  push: (toast: Toast) => void;
  remove: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) =>
    set((state) => ({
      toasts: [...state.toasts.filter((t) => t.id !== toast.id), toast],
    })),
  remove: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

export const pushToast = (
  message: string,
  type: ToastType = 'info',
  options: { duration?: number } = {},
) => {
  const id = crypto.randomUUID();
  useToastStore.getState().push({ id, message, type });
  const duration = options.duration ?? 3200;
  setTimeout(() => {
    useToastStore.getState().remove(id);
  }, duration);
};

