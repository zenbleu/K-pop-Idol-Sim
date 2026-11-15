import React from 'react';
import { NavTab } from '../../game/models/types';
import { useGame } from '../../game/state/GameContext';
import {
  LayoutDashboard,
  Disc3,
  CalendarDays,
  Ticket,
  Mic2,
  Users,
  Dumbbell,
  ShoppingBag,
  Building2,
  Settings,
  X,
} from 'lucide-react';

const NAV_ITEMS: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'production', label: 'Production', icon: Disc3 },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'concert', label: 'Concert', icon: Ticket },
  { id: 'auditions', label: 'Auditions', icon: Mic2 },
  { id: 'company', label: 'Company', icon: Users },
  { id: 'training', label: 'Training', icon: Dumbbell },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'hq', label: 'Agency HQ', icon: Building2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<{
  mobileOpen: boolean;
  onCloseMobile: () => void;
}> = ({ mobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, state } = useGame();

  const activeSalesCount = state.releases.filter(
    (r) => r.status === 'Promoting' && !r.salesCompleted
  ).length;

  const navContent = (
    <div className="flex flex-col h-full justify-between p-3 bg-[#2c1153]">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-2 py-2 lg:hidden">
          <span className="pixel-subtitle text-amber-200">Menu</span>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={onCloseMobile}
            className="p-1.5 rounded bg-[#3f1c73] text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav aria-label="Main Navigation" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-[#180832] font-bold shadow-md'
                    : 'text-purple-100 hover:bg-[#3d1970] hover:text-amber-100'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="pixel-micro truncate">{item.label}</span>
                </span>
                {item.id === 'production' && activeSalesCount > 0 && (
                  <span
                    className={`pixel-micro ${active ? 'text-[#180832]' : 'text-teal-300'}`}
                  >
                    {activeSalesCount}
                  </span>
                )}
                {item.id === 'company' && state.idols.length > 0 && (
                  <span
                    className={`pixel-micro ${active ? 'text-[#180832]' : 'text-amber-300'}`}
                  >
                    {state.idols.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-purple-300/20 px-2 space-y-1.5">
        <div className="pixel-micro text-amber-200">
          Groups: {state.groups.length}/{state.company.maxGroupSlots}
        </div>
        <div className="pixel-micro text-pink-200">
          Soloists: {state.soloArtists.length}
        </div>
        <div className="pixel-micro text-teal-200">
          Trainees: {state.idols.filter((i) => !i.groupId && !i.isSoloArtist).length}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-56 shrink-0 border-r border-purple-300/20">
        {navContent}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="w-64 max-w-[80vw] h-full shadow-2xl">{navContent}</div>
          <div className="flex-1 bg-black/60" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
};
