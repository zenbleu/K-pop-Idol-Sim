import React, { useEffect, useState } from 'react';
import { VENUES } from '../../config/gameConfig';
import {
  isCompanyConcertUnlocked,
  isTourUnlockedForArtist,
} from '../../game/logic/concerts';
import { ConcertScope, VenueSize } from '../../game/models/types';
import { useGame } from '../../game/state/GameContext';
import { formatNumber, formatWon } from '../../game/utils/format';

export const ConcertScreen: React.FC = () => {
  const { state, actions } = useGame();

  const artists: { type: 'Group' | 'Solo'; id: string; label: string; pop: number }[] = [
    ...state.groups.map((g) => ({
      type: 'Group' as const,
      id: g.id,
      label: `Group: ${g.name} (Pop ${g.popularity})`,
      pop: g.popularity,
    })),
    ...state.soloArtists.map((s) => ({
      type: 'Solo' as const,
      id: s.id,
      label: `Solo: ${s.stageName} (Pop ${s.popularity})`,
      pop: s.popularity,
    })),
  ];

  // Left panel: Concert state
  const [concertTitle, setConcertTitle] = useState('');
  const [concertScope, setConcertScope] = useState<ConcertScope>('Domestic');
  const [concertArtistKey, setConcertArtistKey] = useState('');
  const [concertVenue, setConcertVenue] = useState<VenueSize>('Small');
  const [ticketPrice, setTicketPrice] = useState(65_000);
  const [marketingBudget, setMarketingBudget] = useState(1_000_000);

  // Right panel: Tour state
  const [tourTitle, setTourTitle] = useState('');
  const [tourArtistKey, setTourArtistKey] = useState('');
  const [tourScope, setTourScope] = useState<'Domestic' | 'International' | 'Global'>('Domestic');
  const [tourVenue, setTourVenue] = useState<VenueSize>('Small');
  const [tourDates, setTourDates] = useState(4);
  const [tourTicketPrice, setTourTicketPrice] = useState(75_000);

  useEffect(() => {
    if (!concertArtistKey && artists.length > 0) {
      setConcertArtistKey(`${artists[0].type}:${artists[0].id}`);
    }
    if (!tourArtistKey && artists.length > 0) {
      setTourArtistKey(`${artists[0].type}:${artists[0].id}`);
    }
  }, [artists.length, concertArtistKey, tourArtistKey]);

  const companyConcertCheck = isCompanyConcertUnlocked(state);

  const handlePlanConcert = (e: React.FormEvent) => {
    e.preventDefault();
    if (concertScope === 'Company') {
      const ok = actions.planConcert({
        title: concertTitle,
        scope: 'Company',
        targetType: 'Company',
        targetId: 'company',
        venueSize: concertVenue,
        ticketPrice,
        marketingBudget,
      });
      if (ok) setConcertTitle('');
      return;
    }
    if (!concertArtistKey) return;
    const [targetType, targetId] = concertArtistKey.split(':') as ['Group' | 'Solo', string];
    const ok = actions.planConcert({
      title: concertTitle,
      scope: concertScope,
      targetType,
      targetId,
      venueSize: concertVenue,
      ticketPrice,
      marketingBudget,
    });
    if (ok) setConcertTitle('');
  };

  const handleStartTour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourArtistKey) return;
    const [targetType, targetId] = tourArtistKey.split(':') as ['Group' | 'Solo', string];
    const ok = actions.startTour({
      title: tourTitle,
      targetType,
      targetId,
      scope: tourScope,
      venueSize: tourVenue,
      totalDates: tourDates,
      ticketPrice: tourTicketPrice,
    });
    if (ok) setTourTitle('');
  };

  const tourUnlockStatus = (() => {
    if (!tourArtistKey) return { unlocked: false, reason: 'No artist selected.' };
    const [t, id] = tourArtistKey.split(':') as ['Group' | 'Solo', string];
    return isTourUnlockedForArtist(state, t, id);
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="pixel-title text-white">Concerts & World Tours</h1>
        <p className="pixel-micro text-purple-200 mt-1">
          Prepare concerts, sell out venues to unlock tours, and reach Tier S + Global Reputation for Company Concerts.
        </p>
      </div>

      {/* PDF Page 8: Split Screen Layout (Left: Concert, Right: Tour) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Panel 1 (Left): Concert */}
        <section className="rounded-xl bg-[#2e1065] border border-purple-300/25 p-5 space-y-5">
          <h2 className="pixel-subtitle text-fuchsia-300">Panel 1 — Concert</h2>

          <form onSubmit={handlePlanConcert} className="space-y-3 bg-[#1e0b4b] p-4 rounded-xl border border-purple-300/20">
            <div>
              <label htmlFor="con-title" className="block pixel-micro text-purple-200 mb-1">
                Concert Name
              </label>
              <input
                id="con-title"
                type="text"
                required
                placeholder="e.g. Seoul Debut Showcase"
                value={concertTitle}
                onChange={(e) => setConcertTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#270e55] border border-purple-300/30 text-white pixel-micro"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="con-scope" className="block pixel-micro text-purple-200 mb-1">
                  Concert Type
                </label>
                <select
                  id="con-scope"
                  value={concertScope}
                  onChange={(e) => setConcertScope(e.target.value as ConcertScope)}
                  className="w-full px-3 py-2 rounded-lg bg-[#270e55] border border-purple-300/30 text-white pixel-micro"
                >
                  <option value="Domestic">Domestic (1w prep)</option>
                  <option value="International">International (2w prep)</option>
                  <option value="Global">Global (3w prep)</option>
                  <option value="Company">
                    Company Concert {companyConcertCheck.unlocked ? '' : '(Tier S + Global)'}
                  </option>
                </select>
              </div>

              {concertScope !== 'Company' && (
                <div>
                  <label htmlFor="con-artist" className="block pixel-micro text-purple-200 mb-1">
                    Artist / Group
                  </label>
                  <select
                    id="con-artist"
                    value={concertArtistKey}
                    onChange={(e) => setConcertArtistKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#270e55] border border-purple-300/30 text-white pixel-micro"
                  >
                    {artists.length === 0 ? (
                      <option value="">No debuted artists</option>
                    ) : (
                      artists.map((a) => (
                        <option key={`${a.type}:${a.id}`} value={`${a.type}:${a.id}`}>
                          {a.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="con-venue" className="block pixel-micro text-purple-200 mb-1">
                  Venue Size
                </label>
                <select
                  id="con-venue"
                  value={concertVenue}
                  onChange={(e) => setConcertVenue(e.target.value as VenueSize)}
                  className="w-full px-3 py-2 rounded-lg bg-[#270e55] border border-purple-300/30 text-white pixel-micro"
                >
                  {Object.values(VENUES).map((v) => (
                    <option key={v.size} value={v.size}>
                      {v.label} · {formatWon(v.rentalCost)} (Pop {v.minPopularity}+)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="con-price" className="block pixel-micro text-purple-200 mb-1">
                  Ticket Price ({formatWon(ticketPrice)})
                </label>
                <input
                  id="con-price"
                  type="range"
                  min={30_000}
                  max={250_000}
                  step={5_000}
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(Number(e.target.value))}
                  className="w-full accent-fuchsia-500 mt-2"
                />
              </div>
            </div>

            <div>
              <label htmlFor="con-mkt" className="block pixel-micro text-purple-200 mb-1">
                Marketing Budget: {formatWon(marketingBudget)}
              </label>
              <input
                id="con-mkt"
                type="range"
                min={0}
                max={15_000_000}
                step={500_000}
                value={marketingBudget}
                onChange={(e) => setMarketingBudget(Number(e.target.value))}
                className="w-full accent-fuchsia-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="pixel-micro text-purple-200">
                Upfront: {formatWon(VENUES[concertVenue].rentalCost + marketingBudget)}
              </span>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white pixel-micro cursor-pointer"
              >
                Schedule Concert
              </button>
            </div>
          </form>

          {/* Concert Queue & Results */}
          <div className="space-y-3">
            <h3 className="pixel-micro text-purple-200">Planned & Completed Concerts</h3>
            {state.concerts.length === 0 ? (
              <p className="pixel-micro text-purple-400">No concerts scheduled yet.</p>
            ) : (
              state.concerts.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg bg-[#1e0b4b] p-3.5 border border-purple-300/20 space-y-2"
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="pixel-micro text-white">
                      {c.title} ({c.scope})
                    </span>
                    <span className="pixel-micro text-fuchsia-300">{c.status}</span>
                  </div>
                  <div className="pixel-micro text-purple-300">
                    {c.targetName} · {VENUES[c.venueSize].label}
                  </div>
                  {c.status !== 'Completed' ? (
                    <div className="flex items-center justify-between pt-1">
                      <span className="pixel-micro text-purple-200">
                        Prep: {c.preparationWeeksDone}/{c.preparationWeeksRequired} wk(s)
                      </span>
                      <button
                        type="button"
                        disabled={c.status !== 'Ready'}
                        onClick={() => actions.performConcert(c.id)}
                        className={`px-3 py-1.5 rounded-lg pixel-micro ${
                          c.status === 'Ready'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                            : 'bg-purple-950 text-purple-400 cursor-not-allowed'
                        }`}
                      >
                        {c.status === 'Ready' ? 'Perform Concert' : 'Preparing...'}
                      </button>
                    </div>
                  ) : (
                    <div className="pixel-micro text-purple-100">
                      Tickets: {formatNumber(c.ticketsSold)}/{formatNumber(c.venueCapacity)}{' '}
                      {c.soldOut ? '(SOLD OUT!)' : ''} · Company Rev:{' '}
                      <span className="text-emerald-300">{formatWon(c.companyRevenue)}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Panel 2 (Right): Tour */}
        <section className="rounded-xl bg-[#2e1065] border border-purple-300/25 p-5 space-y-5">
          <h2 className="pixel-subtitle text-pink-300">Panel 2 — Tour</h2>

          <form onSubmit={handleStartTour} className="space-y-3 bg-[#1e0b4b] p-4 rounded-xl border border-purple-300/20">
            <div>
              <label htmlFor="tour-title" className="block pixel-micro text-purple-200 mb-1">
                Tour Title
              </label>
              <input
                id="tour-title"
                type="text"
                required
                placeholder="e.g. Violet World Tour"
                value={tourTitle}
                onChange={(e) => setTourTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#270e55] border border-purple-300/30 text-white pixel-micro"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="tour-artist" className="block pixel-micro text-purple-200 mb-1">
                  Artist / Group
                </label>
                <select
                  id="tour-artist"
                  value={tourArtistKey}
                  onChange={(e) => setTourArtistKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#270e55] border border-purple-300/30 text-white pixel-micro"
                >
                  {artists.length === 0 ? (
                    <option value="">No debuted artists</option>
                  ) : (
                    artists.map((a) => (
                      <option key={`${a.type}:${a.id}`} value={`${a.type}:${a.id}`}>
                        {a.label}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="tour-scope" className="block pixel-micro text-purple-200 mb-1">
                  Tour Scope
                </label>
                <select
                  id="tour-scope"
                  value={tourScope}
                  onChange={(e) =>
                    setTourScope(e.target.value as 'Domestic' | 'International' | 'Global')
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#270e55] border border-purple-300/30 text-white pixel-micro"
                >
                  <option value="Domestic">Domestic</option>
                  <option value="International">International</option>
                  <option value="Global">Global</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="tour-venue" className="block pixel-micro text-purple-200 mb-1">
                  Venue Size
                </label>
                <select
                  id="tour-venue"
                  value={tourVenue}
                  onChange={(e) => setTourVenue(e.target.value as VenueSize)}
                  className="w-full px-3 py-2 rounded-lg bg-[#270e55] border border-purple-300/30 text-white pixel-micro"
                >
                  {Object.values(VENUES).map((v) => (
                    <option key={v.size} value={v.size}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tour-dates" className="block pixel-micro text-purple-200 mb-1">
                  Tour Dates: {tourDates} shows
                </label>
                <input
                  id="tour-dates"
                  type="range"
                  min={3}
                  max={10}
                  value={tourDates}
                  onChange={(e) => setTourDates(Number(e.target.value))}
                  className="w-full accent-pink-500 mt-2"
                />
              </div>
            </div>

            <div>
              <label htmlFor="tour-price" className="block pixel-micro text-purple-200 mb-1">
                Ticket Price: {formatWon(tourTicketPrice)}
              </label>
              <input
                id="tour-price"
                type="range"
                min={35_000}
                max={300_000}
                step={5_000}
                value={tourTicketPrice}
                onChange={(e) => setTourTicketPrice(Number(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>

            {!tourUnlockStatus.unlocked && (
              <div className="pixel-micro text-amber-300">
                Locked: {tourUnlockStatus.reason}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="pixel-micro text-purple-200">
                Investment:{' '}
                {formatWon(Math.round(VENUES[tourVenue].rentalCost * tourDates * 0.72))}
              </span>
              <button
                type="submit"
                disabled={!tourUnlockStatus.unlocked}
                className={`px-4 py-2 rounded-lg pixel-micro ${
                  tourUnlockStatus.unlocked
                    ? 'bg-pink-600 hover:bg-pink-500 text-white cursor-pointer'
                    : 'bg-purple-950 text-purple-400 cursor-not-allowed'
                }`}
              >
                Launch Tour
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <h3 className="pixel-micro text-purple-200">Active & Past Tours</h3>
            {state.tours.length === 0 ? (
              <p className="pixel-micro text-purple-400">
                Sell out an eligible concert to unlock multi-date tours.
              </p>
            ) : (
              state.tours.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg bg-[#1e0b4b] p-3.5 border border-purple-300/20 space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="pixel-micro text-white">
                      {t.title} ({t.scope})
                    </span>
                    <span className="pixel-micro text-pink-300">
                      {t.datesCompleted}/{t.totalDates} shows ({t.status})
                    </span>
                  </div>
                  <div className="pixel-micro text-purple-200">
                    {t.targetName} · Total Tickets: {formatNumber(t.totalTicketsSold)} · Gross:{' '}
                    {formatWon(t.totalGrossRevenue)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
