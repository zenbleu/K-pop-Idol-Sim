import React, { useEffect } from 'react';
import { useGame } from '../../game/state/GameContext';

export const ConfirmDialog: React.FC = () => {
  const { confirmRequest, closeConfirm } = useGame();

  useEffect(() => {
    if (!confirmRequest) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmRequest, closeConfirm]);

  if (!confirmRequest) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={closeConfirm}
    >
      <div
        className="w-full max-w-md rounded-xl border border-amber-300/40 bg-[#240e44] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="pixel-title text-[#fffdf7] mb-3">
          {confirmRequest.title}
        </h2>
        <p className="pixel-body text-purple-100 mb-6 whitespace-pre-line">
          {confirmRequest.message}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeConfirm}
            className="px-4 py-2.5 rounded-lg border border-purple-300/30 bg-[#31145c] hover:bg-[#411d75] text-purple-100 pixel-micro cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const fn = confirmRequest.onConfirm;
              closeConfirm();
              fn();
            }}
            className={`px-4 py-2.5 rounded-lg pixel-micro cursor-pointer font-bold ${
              confirmRequest.destructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-[#180832]'
            }`}
          >
            {confirmRequest.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
