import React from 'react';
import { useGame } from '../../game/state/GameContext';
import { X } from 'lucide-react';

export const ToastStack: React.FC = () => {
  const { toasts, dismissToast } = useGame();
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => {
        const bg =
          t.kind === 'error'
            ? 'bg-rose-950/95 border-rose-400/60 text-rose-100'
            : t.kind === 'success'
              ? 'bg-[#240e44]/95 border-teal-400/70 text-[#fffdf7]'
              : 'bg-[#170833]/95 border-amber-300/50 text-purple-100';
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-lg border px-3.5 py-2.5 shadow-xl ${bg}`}
          >
            <span className="pixel-micro leading-relaxed">{t.text}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismissToast(t.id)}
              className="shrink-0 text-purple-200 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
