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
        className="w-full max-w-md rounded-xl border border-purple-300/35 bg-[#2e1065] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="pixel-title text-white mb-3">
          {confirmRequest.title}
        </h2>
        <p className="pixel-body text-purple-100 mb-6 whitespace-pre-line">
          {confirmRequest.message}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeConfirm}
            className="px-4 py-2.5 rounded-lg border border-purple-300/30 bg-purple-900/60 hover:bg-purple-800/80 text-purple-100 pixel-micro cursor-pointer"
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
            className={`px-4 py-2.5 rounded-lg text-white pixel-micro cursor-pointer ${
              confirmRequest.destructive
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-purple-600 hover:bg-purple-500'
            }`}
          >
            {confirmRequest.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
