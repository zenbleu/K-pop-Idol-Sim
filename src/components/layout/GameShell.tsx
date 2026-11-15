import React, { useState } from 'react';
import { useGame } from '../../game/state/GameContext';
import { TopBanner } from './TopBanner';
import { Sidebar } from './Sidebar';
import { IdolProfileModal } from '../modals/IdolProfileModal';
import { NextWeekModals } from '../modals/NextWeekModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ToastStack } from '../common/ToastStack';
import { TutorialModal } from '../common/TutorialDrawer';

export const GameShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, setTutorialOpen, actions } = useGame();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen w-full p-2 sm:p-4 flex items-stretch justify-center">
      <div className="w-full max-w-[1440px] rounded-2xl border border-purple-300/25 bg-[#2e1065] shadow-2xl overflow-hidden flex flex-col">
        <TopBanner onToggleMobileNav={() => setMobileNavOpen(true)} />

        {!state.tutorialDismissed && (
          <div className="bg-[#3b176e] border-b border-purple-300/20 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
            <span className="pixel-micro text-purple-100">
              Getting Started: Scout trainees in Auditions → Form a Group in Company → Train → Produce & Schedule → Next Week.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTutorialOpen(true)}
                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white pixel-micro cursor-pointer"
              >
                Open Guide
              </button>
              <button
                type="button"
                onClick={actions.dismissTutorial}
                className="px-2.5 py-1 rounded bg-purple-900 hover:bg-purple-800 text-purple-200 pixel-micro cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex min-h-0">
          <Sidebar
            mobileOpen={mobileNavOpen}
            onCloseMobile={() => setMobileNavOpen(false)}
          />
          <main className="flex-1 min-w-0 bg-[#1e0b4b] p-4 sm:p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      <IdolProfileModal />
      <NextWeekModals />
      <ConfirmDialog />
      <TutorialModal />
      <ToastStack />
    </div>
  );
};
