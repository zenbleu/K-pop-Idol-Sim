import React, { useEffect, useState } from 'react';
import {
  ALL_CONCEPTS,
  ALL_GENRES,
  EXTERNAL_STAFF_POOL,
  RELEASE_TYPE_CONFIG,
  STARTING_PROGRESSION,
} from '../../config/gameConfig';
import { Concept, Genre, ReleaseType } from '../../game/models/types';
import { useGame } from '../../game/state/GameContext';
import { formatCountdown, formatNumber, formatWon } from '../../game/utils/format';

export const ProductionScreen: React.FC = () => {
  const { state, actions } = useGame();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const artists: { type: 'Group' | 'Solo'; id: string; label: string }[] = [
    ...state.groups.map((g) => ({ type: 'Group' as const, id: g.id, label: `Group: ${g.name}` })),
    ...state.soloArtists.map((s) => ({
      type: 'Solo' as const,
      id: s.id,
      label: `Solo: ${s.stageName}`,
    })),
  ];

  const [selectedArtistKey, setSelectedArtistKey] = useState('');
  const [releaseType, setReleaseType] = useState<ReleaseType>('Single');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState<Genre>(state.trends.trendingGenres[0] ?? 'Pop');
  const [concept, setConcept] = useState<Concept>(state.trends.trendingConcepts[0] ?? 'Cute');
  const [writerId, setWriterId] = useState(EXTERNAL_STAFF_POOL[0].id);
  const [producerId, setProducerId] = useState(EXTERNAL_STAFF_POOL[3].id);
  const [marketingBudget, setMarketingBudget] = useState(1_000_000);

  useEffect(() => {
    if (!selectedArtistKey && artists.length > 0) {
      setSelectedArtistKey(`${artists[0].type}:${artists[0].id}`);
    }
  }, [artists.length, selectedArtistKey]);

  const writers = EXTERNAL_STAFF_POOL.filter((s) => s.role === 'Writer');
  const producers = EXTERNAL_STAFF_POOL.filter((s) => s.role === 'Producer');

  const releaseCfg = RELEASE_TYPE_CONFIG[releaseType];
  const writerCost = writers.find((w) => w.id === writerId)?.hireCost ?? 0;
  const producerCost = producers.find((p) => p.id === producerId)?.hireCost ?? 0;
  const totalEstimatedCost =
    releaseCfg.baseCost + writerCost + producerCost + marketingBudget;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtistKey) return;
    const [targetType, targetId] = selectedArtistKey.split(':') as ['Group' | 'Solo', string];
    const ok = actions.startProduction({
      targetType,
      targetId,
      releaseType,
      title,
      genre,
      concept,
      writerId,
      producerId,
      marketingBudget,
    });
    if (ok) setTitle('');
  };

  const activeProjects = state.releases.filter((r) => r.status === 'In Production');
  const livePromos = state.releases.filter(
    (r) => r.status === 'Promoting' && !r.salesCompleted
  );
  const completedReleases = state.releases.filter((r) => r.status === 'Completed');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="pixel-title text-[#fffdf7]">Music Production</h1>
          <p className="pixel-micro text-purple-200 mt-1">
            Trends: <span className="text-amber-300">{state.trends.trendingGenres.join(', ')}</span> ·{' '}
            <span className="text-pink-300">{state.trends.trendingConcepts.join(', ')}</span>
          </p>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Panel 1: New Production */}
        <form
          onSubmit={handleStart}
          className="rounded-xl bg-[#240e44] border border-purple-300/25 p-5 space-y-4 shadow-lg"
        >
          <h2 className="pixel-subtitle text-amber-300">1. New Production</h2>

          {artists.length === 0 ? (
            <div className="rounded-lg bg-[#1e0b4b] p-4 border border-purple-300/20 pixel-micro text-amber-300">
              Form a Group or debut a Solo Artist in Company before starting album production.
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="prod-artist" className="block pixel-micro text-purple-200 mb-1.5">
                  Artist / Group
                </label>
                <select
                  id="prod-artist"
                  value={selectedArtistKey}
                  onChange={(e) => setSelectedArtistKey(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#1e0b4b] border border-purple-300/30 text-white pixel-micro"
                >
                  {artists.map((a) => (
                    <option key={`${a.type}:${a.id}`} value={`${a.type}:${a.id}`}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="prod-title" className="block pixel-micro text-purple-200 mb-1.5">
                  Album / Release Title
                </label>
                <input
                  id="prod-title"
                  type="text"
                  required
                  maxLength={40}
                  placeholder="e.g. Purple Horizon"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#1e0b4b] border border-purple-300/30 text-white pixel-micro"
                />
              </div>

              <div>
                <span className="block pixel-micro text-purple-200 mb-1.5">
                  Release Format
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['Single', 'EP', 'Album'] as ReleaseType[]).map((rt) => (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => setReleaseType(rt)}
                      className={`p-2.5 rounded-lg border text-center cursor-pointer ${
                        releaseType === rt
                          ? 'bg-gradient-to-r from-orange-500 to-rose-500 border-amber-300 text-[#180832] font-bold'
                          : 'bg-[#15072c] border-purple-300/20 text-purple-200 hover:bg-[#31145c]'
                      }`}
                    >
                      <div className="pixel-micro">{rt}</div>
                      <div className="text-[8px] opacity-85 mt-1">
                        {RELEASE_TYPE_CONFIG[rt].durationWeeks} wk(s)
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prod-genre" className="block pixel-micro text-purple-200 mb-1.5">
                    Genre
                  </label>
                  <select
                    id="prod-genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value as Genre)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#1e0b4b] border border-purple-300/30 text-white pixel-micro"
                  >
                    {ALL_GENRES.map((g) => (
                      <option key={g} value={g}>
                        {g} {state.trends.trendingGenres.includes(g) ? '(TREND)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="prod-concept" className="block pixel-micro text-purple-200 mb-1.5">
                    Concept
                  </label>
                  <select
                    id="prod-concept"
                    value={concept}
                    onChange={(e) => setConcept(e.target.value as Concept)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#1e0b4b] border border-purple-300/30 text-white pixel-micro"
                  >
                    {ALL_CONCEPTS.map((c) => (
                      <option key={c} value={c}>
                        {c} {state.trends.trendingConcepts.includes(c) ? '(TREND)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prod-writer" className="block pixel-micro text-purple-200 mb-1.5">
                    Lyricist / Songwriter
                  </label>
                  <select
                    id="prod-writer"
                    value={writerId}
                    onChange={(e) => setWriterId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#1e0b4b] border border-purple-300/30 text-white pixel-micro"
                  >
                    {writers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} (Skl {w.skill} · {formatWon(w.hireCost)})
                      </option>
                    ))}
                    {state.idols.map((i) => (
                      <option key={i.id} value={i.id}>
                        Idol: {i.stageName} (Wrt {i.stats.writing} · Free)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="prod-producer" className="block pixel-micro text-purple-200 mb-1.5">
                    Producer
                  </label>
                  <select
                    id="prod-producer"
                    value={producerId}
                    onChange={(e) => setProducerId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#1e0b4b] border border-purple-300/30 text-white pixel-micro"
                  >
                    {producers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Skl {p.skill} · {formatWon(p.hireCost)})
                      </option>
                    ))}
                    {state.idols.map((i) => (
                      <option key={i.id} value={i.id}>
                        Idol: {i.stageName} (Comp {i.stats.composition} · Free)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="prod-mkt" className="block pixel-micro text-purple-200 mb-1.5">
                  Marketing Budget: {formatWon(marketingBudget)}
                </label>
                <input
                  id="prod-mkt"
                  type="range"
                  min={0}
                  max={20_000_000}
                  step={500_000}
                  value={marketingBudget}
                  onChange={(e) => setMarketingBudget(Number(e.target.value))}
                  className="w-full accent-fuchsia-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-purple-300/20">
                <div className="pixel-micro text-purple-200">
                  Total Cost: <span className="text-amber-300">{formatWon(totalEstimatedCost)}</span>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-[#180832] font-bold pixel-micro cursor-pointer"
                >
                  Start Production
                </button>
              </div>
            </>
          )}
        </form>

        {/* Panel 2: Active Productions & Live Sales */}
        <div className="space-y-5">
          <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-5 space-y-4 shadow-lg">
            <h2 className="pixel-subtitle text-[#fffdf7]">Active Productions</h2>
            {activeProjects.length === 0 ? (
              <p className="pixel-micro text-purple-300">
                No releases currently in production.
              </p>
            ) : (
              <div className="space-y-3">
                {activeProjects.map((proj) => {
                  const readyToRelease =
                    proj.weeksElapsed >= proj.durationWeeks && proj.recordingSessions >= 1;
                  return (
                    <div
                      key={proj.id}
                      className="rounded-lg bg-[#1e0b4b] p-4 border border-purple-300/20 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="pixel-subtitle text-white">
                            "{proj.title}" ({proj.releaseType})
                          </div>
                          <div className="pixel-micro text-purple-300 mt-1">
                            {proj.targetName} · {proj.genre} · {proj.concept}
                          </div>
                        </div>
                        <span className="pixel-micro text-fuchsia-300">
                          Quality {proj.quality}/100
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pixel-micro text-purple-200">
                        <div>
                          Timeline: {proj.weeksElapsed}/{proj.durationWeeks} wk(s)
                        </div>
                        <div>
                          Recording: {proj.recordingSessions}/{proj.recordingTarget} sessions
                        </div>
                        <div>Writer: {proj.writerName}</div>
                        <div>Producer: {proj.producerName}</div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => actions.recordProduction(proj.id)}
                          className="px-3.5 py-2 rounded-lg bg-[#31145c] hover:bg-[#411d75] border border-purple-300/30 text-[#fffdf7] pixel-micro cursor-pointer"
                        >
                          Record Track
                        </button>
                        <button
                          type="button"
                          disabled={!readyToRelease}
                          onClick={() => actions.releaseAlbum(proj.id)}
                          className={`px-3.5 py-2 rounded-lg pixel-micro font-bold ${
                            readyToRelease
                              ? 'bg-teal-500 hover:bg-teal-400 text-[#180832] cursor-pointer'
                              : 'bg-[#170833] text-purple-400 cursor-not-allowed'
                          }`}
                        >
                          {readyToRelease
                            ? 'Release Album (Start 10m Sales)'
                            : `Need ${Math.max(0, proj.durationWeeks - proj.weeksElapsed)} wk & 1+ Rec`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live 10-Minute Album Sales */}
          <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-5 space-y-4 shadow-lg">
            <h2 className="pixel-subtitle text-[#fffdf7]">Live Sales (10-Min Real-Time)</h2>
            {livePromos.length === 0 ? (
              <p className="pixel-micro text-purple-300">
                No active sales cycles running. Release an album to start real-time & offline sales.
              </p>
            ) : (
              <div className="space-y-3">
                {livePromos.map((rel) => {
                  const elapsed = rel.salesStartTimestamp
                    ? Math.max(0, now - rel.salesStartTimestamp)
                    : 0;
                  const rem = Math.max(0, STARTING_PROGRESSION.albumSalesDurationMs - elapsed);
                  const pct = Math.min(
                    100,
                    Math.round((elapsed / STARTING_PROGRESSION.albumSalesDurationMs) * 100)
                  );
                  return (
                    <div
                      key={rel.id}
                      className="rounded-lg bg-[#1e0b4b] p-4 border border-fuchsia-400/40 space-y-2"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="pixel-micro text-white">
                          {rel.targetName} — "{rel.title}"
                        </span>
                        <span className="pixel-micro text-pink-300">
                          {formatCountdown(rem)}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-purple-950 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pixel-micro text-purple-200">
                        <span>Sales: {formatNumber(rel.salesUnits)}</span>
                        <span>Quality: {rel.quality}/100</span>
                        <span>Company Share: {formatWon(rel.companyRevenueApplied)}</span>
                        <span>Pop +{rel.popularityGained} / Fans +{formatNumber(rel.fansGained)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completed Discography */}
      <div className="rounded-xl bg-[#240e44] border border-purple-300/25 p-5 space-y-3">
        <h2 className="pixel-subtitle text-[#fffdf7]">Discography & Sales History</h2>
        {completedReleases.length === 0 ? (
          <p className="pixel-micro text-purple-300">No completed releases yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-purple-300/20 pixel-micro text-purple-300">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Artist</th>
                  <th className="py-2 pr-4">Format</th>
                  <th className="py-2 pr-4">Genre / Concept</th>
                  <th className="py-2 pr-4 text-right">Quality</th>
                  <th className="py-2 pr-4 text-right">Units Sold</th>
                  <th className="py-2 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {completedReleases.map((rel) => (
                  <tr key={rel.id} className="border-b border-purple-300/10 pixel-micro text-purple-100">
                    <td className="py-2.5 pr-4 text-white">{rel.title}</td>
                    <td className="py-2.5 pr-4">{rel.targetName}</td>
                    <td className="py-2.5 pr-4">{rel.releaseType}</td>
                    <td className="py-2.5 pr-4">
                      {rel.genre} · {rel.concept}
                    </td>
                    <td className="py-2.5 pr-4 text-right">{rel.quality}/100</td>
                    <td className="py-2.5 pr-4 text-right">{formatNumber(rel.salesUnits)}</td>
                    <td className="py-2.5 text-right text-emerald-300">
                      {formatWon(rel.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
