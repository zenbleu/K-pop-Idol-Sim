import React, { useEffect } from 'react';
import { useGame } from '../../game/state/GameContext';
import { X } from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    num: '1',
    title: 'Recruit Idols',
    text: 'Open Auditions to run Streets Casting (starts with 2 candidate slots) or Ruby Auditions, inspect candidates, and sign trainees.',
  },
  {
    num: '2',
    title: 'Create Groups & Soloists',
    text: 'Go to Company to form a Boy or Girl Group (assign roles; Maknae is automatic) or debut a Solo Artist.',
  },
  {
    num: '3',
    title: 'Train Idols',
    text: 'Visit Training to unlock Vocal, Dance, Rap, or Endurance Studios and raise stats. Watch Stamina and Fatigue.',
  },
  {
    num: '4',
    title: 'Produce Albums',
    text: 'Open Production to choose Single/EP/Album, genre, concept, writer, and producer, then record tracks and release for 10-minute real-time sales.',
  },
  {
    num: '5',
    title: 'Assign Schedules',
    text: 'Use the 7-day Schedule planner (Mon–Sun) to assign practices, variety shows, recordings, and rest with no 4-slot cap.',
  },
  {
    num: '6',
    title: 'Earn Money & Fans',
    text: 'Generate revenue through album sales, schedules, fanmeetings, sponsorships, concerts, and multi-date tours.',
  },
  {
    num: '7',
    title: 'Upgrade the Company',
    text: 'Visit Agency HQ to expand group slots, audition scouting tiers, Main 2 & Main 3 training licenses, and production gear.',
  },
  {
    num: '8',
    title: 'Advance the Game Week',
    text: 'Click Next Week in the top banner to simulate Monday through Sunday chronologically and review your weekly report.',
  },
];

export const TutorialModal: React.FC = () => {
  const { tutorialOpen, setTutorialOpen, actions } = useGame();

  useEffect(() => {
    if (!tutorialOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTutorialOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tutorialOpen, setTutorialOpen]);

  if (!tutorialOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={() => setTutorialOpen(false)}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border border-amber-300/40 bg-[#240e44] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-purple-300/20">
          <h2 id="tutorial-title" className="pixel-title text-[#fffdf7]">
            Agency Manager Guide
          </h2>
          <button
            type="button"
            aria-label="Close guide"
            onClick={() => setTutorialOpen(false)}
            className="p-2 rounded-lg bg-[#15072c] hover:bg-orange-500 hover:text-[#180832] text-purple-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {TUTORIAL_STEPS.map((s) => (
            <div
              key={s.num}
              className="rounded-lg border border-purple-300/20 bg-[#15072c] p-3.5"
            >
              <div className="pixel-subtitle text-amber-300 mb-1.5">
                {s.num}. {s.title}
              </div>
              <p className="pixel-micro text-purple-100 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={actions.dismissTutorial}
            className="px-4 py-2.5 rounded-lg border border-purple-300/30 bg-[#31145c] hover:bg-[#411d75] text-purple-100 pixel-micro cursor-pointer"
          >
            Dismiss Quick Banner
          </button>
          <button
            type="button"
            onClick={() => setTutorialOpen(false)}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-[#180832] font-bold pixel-micro cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
