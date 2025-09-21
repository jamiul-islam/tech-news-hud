'use client';

import { useToastStore } from '@/store/toast-store';

const toneStyles: Record<'success' | 'info' | 'error', string> = {
  success: 'border-[#3bc17c]/40 bg-[#1c2a23]/90 text-[#9ae8bf]',
  info: 'border-[#4C7EFF]/40 bg-[#101c33]/90 text-[#d0dcff]',
  error: 'border-[#ff4d4d]/40 bg-[#2a1616]/90 text-[#ffb3b3]',
};

export const ToastViewport = () => {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-center gap-3 p-4 sm:p-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`w-full max-w-sm translate-y-0 rounded-2xl border px-4 py-3 text-sm shadow-lg shadow-black/30 backdrop-blur ${toneStyles[toast.type]}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

