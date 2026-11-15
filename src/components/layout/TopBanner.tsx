import React from 'react';
import { useGame } from '../../game/state/GameContext';
import { formatWon } from '../../game/utils/format';
import { PixelCompanyLogo } from '../common/PixelLogo';
import { Menu, HelpCircle, FastForward } from 'lucide-react';

export const TopBanner: React.FC<{ onToggleMobileNav: () => void }> = ({
  onToggleMobileNav,
}) => {
  const { state, setNextWeekModalOpen, setTutorialOpen, actions } = useGame();
  const { company, date } = state;

  return (
    <header className="w-full bg-[#2a114f] border-b border-amber-300/20 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
      {/* Zone 1: Company Info (Logo, Name, CEO, Tier, Rank) */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileNav}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 rounded-lg bg-[#3b196c] text-amber-100 cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>
        <PixelCompanyLogo style={company.logoStyle} size={38} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="pixel-subtitle text-[#fffdf7] truncate max-w-[220px]">
              {company.name}
            </span>
            <span className="pixel-micro text-amber-300 whitespace-nowrap">
              Tier {company.tierDisplay} · {company.reputation}
            </span>
          </div>
          <div className="pixel-micro text-purple-200 flex flex-wrap gap-x-2">
            <span>CEO {company.ceoName}</span>
            <span className="text-teal-300">· Score {company.companyScore}/100</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Game Currencies (Money & Rubies) */}
      <div className="flex items-center gap-4 sm:gap-5 shrink-0">
        <div className="rounded-lg bg-[#190935] border border-emerald-400/25 px-3 py-1.5">
          <div className="text-[8px] text-purple-200">Money</div>
          <div
            data-testid="hud-money"
            className={`pixel-micro whitespace-nowrap mt-0.5 ${
              company.money < 0 ? 'text-rose-300' : 'text-emerald-300'
            }`}
          >
            {formatWon(company.money)}
          </div>
        </div>
        <div className="rounded-lg bg-[#190935] border border-pink-400/25 px-3 py-1.5">
          <div className="text-[8px] text-purple-200">Rubies</div>
          <div data-testid="hud-rubies" className="pixel-micro text-pink-300 whitespace-nowrap mt-0.5">
            {company.rubies.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Zone 3: Date (Year/Month/Week) + Next Week */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
        <div className="text-left sm:text-right">
          <div className="text-[8px] text-amber-200/80">Calendar</div>
          <div data-testid="hud-date" className="pixel-micro text-[#fffdf7] whitespace-nowrap mt-0.5">
            Y{date.year} · M{String(date.month).padStart(2, '0')} · W{date.week}
          </div>
        </div>
        <button
          type="button"
          aria-label="Open Agency Manager Guide"
          onClick={() => setTutorialOpen(true)}
          className="p-2 rounded-lg bg-[#3b196c] hover:bg-teal-700 border border-teal-300/25 text-teal-200 hover:text-white cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        <button
          type="button"
          data-testid="next-week-btn"
          onClick={() => {
            if (state.settings.confirmWeekAdvance) {
              setNextWeekModalOpen(true);
            } else {
              actions.confirmAdvanceWeek();
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-[#180832] pixel-micro whitespace-nowrap shadow-lg cursor-pointer font-bold"
        >
          <span>Next Week</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
