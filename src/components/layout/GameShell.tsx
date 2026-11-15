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
      <div className="w-full max-w-[1440px] rounded-2xl border border-purple-300/25 bg-[#240e44] shadow-2xl overflow-hidden flex flex-col">
        <TopBanner onToggleMobileNav={() => setMobileNavOpen(true)} />

        {!state.tutorialDismissed && (
          <div className="bg-[#2c1253] border-b border-amber-300/20 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
            <span className="pixel-micro text-amber-100">
              Getting Started: Auditions → Form Group/Solo → Produce Music → Schedule & Concert → Next Week.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTutorialOpen(true)}
                className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white pixel-micro cursor-pointer"
              >
                Open Guide
              </button>
              <button
                type="button"
                onClick={actions.dismissTutorial}
                className="px-2.5 py-1 rounded bg-[#3b196c] hover:bg-[#4d2389] text-purple-100 pixel-micro cursor-pointer"
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
          <main className="flex-1 min-w-0 bg-[#15072c] p-4 sm:p-6 overflow-y-auto">
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
