import React, { useState } from 'react';
import { COMPANY_LOGO_STYLES, STARTING_PROGRESSION } from '../../config/gameConfig';
import { CompanyLogoStyle } from '../../game/models/types';
import { useGame } from '../../game/state/GameContext';
import { listSaveSlots } from '../../game/save/storage';
import { formatWon } from '../../game/utils/format';
import { PixelCompanyLogo } from '../common/PixelLogo';
import { ToastStack } from '../common/ToastStack';

export const CompanySetupScreen: React.FC = () => {
  const { createCompany, actions } = useGame();
  const [companyName, setCompanyName] = useState('');
  const [ceoName, setCeoName] = useState('');
  const [logoStyle, setLogoStyle] = useState<CompanyLogoStyle>('Prism');
  const [description, setDescription] = useState('');
  const [importText, setImportText] = useState('');
  const [showLoad, setShowLoad] = useState(false);

  const slots = listSaveSlots();
  const filledSlots = Object.values(slots).filter(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCompany({ companyName, ceoName, logoStyle, description });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl rounded-2xl border border-purple-300/30 bg-[#240e44] shadow-2xl overflow-hidden">
        {/* Top Pixel Checkerboard Accent */}
        <div className="h-4 w-full pixel-checker bg-[#3b186e]" />

        <div className="p-6 sm:p-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-300/20 pb-6">
            <div>
              <h1 className="text-xl sm:text-2xl text-[#fffdf7] leading-snug">
                K-POP IDOL TYCOON
              </h1>
              <p className="pixel-micro text-purple-200 mt-2">
                Found your entertainment agency and rise from Local F-tier to Worldwide P-tier.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowLoad((v) => !v)}
              className="px-4 py-2.5 rounded-lg border border-purple-300/35 bg-[#31145c] hover:bg-[#411d75] text-[#fffdf7] pixel-micro cursor-pointer self-start shrink-0"
            >
              {showLoad ? 'Back to New Company' : 'Load / Import Save'}
            </button>
          </div>

          {!showLoad ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
                <div>
                  <label
                    htmlFor="company-name"
                    className="block pixel-micro text-purple-200 mb-2"
                  >
                    Company Name *
                  </label>
                  <input
                    id="company-name"
                    type="text"
                    required
                    maxLength={32}
                    placeholder="e.g. Starlight Entertainment"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#1e0b4b] border border-purple-300/35 text-white pixel-body"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ceo-name"
                    className="block pixel-micro text-purple-200 mb-2"
                  >
                    CEO Name *
                  </label>
                  <input
                    id="ceo-name"
                    type="text"
                    required
                    maxLength={24}
                    placeholder="e.g. Director Kim"
                    value={ceoName}
                    onChange={(e) => setCeoName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#1e0b4b] border border-purple-300/35 text-white pixel-body"
                  />
                </div>

                <div>
                  <span className="block pixel-micro text-purple-200 mb-2">
                    Company Logo Style (Optional)
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {COMPANY_LOGO_STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setLogoStyle(style.id)}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border cursor-pointer ${
                          logoStyle === style.id
                            ? 'bg-[#3b186e] border-orange-400 text-[#fffdf7]'
                            : 'bg-[#15072c] border-purple-300/20 text-purple-200 hover:bg-[#2d1254]'
                        }`}
                      >
                        <PixelCompanyLogo style={style.id} size={28} />
                        <span className="text-[8px]">{style.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="company-desc"
                    className="block pixel-micro text-purple-200 mb-2"
                  >
                    Company Description (Optional)
                  </label>
                  <textarea
                    id="company-desc"
                    rows={2}
                    maxLength={140}
                    placeholder="Agency vision and musical identity..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#15072c] border border-purple-300/35 text-[#fffdf7] pixel-micro"
                  />
                </div>

                <button
                  type="submit"
                  data-start="true"
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-[#180832] font-bold pixel-subtitle shadow-lg cursor-pointer"
                >
                  Establish Agency & Start
                </button>
              </form>

              <div className="lg:col-span-2 rounded-xl bg-[#15072c] border border-purple-300/20 p-5 space-y-4">
                <h2 className="pixel-subtitle text-amber-300">Starting Allocation</h2>
                <div className="space-y-2.5 pixel-micro text-purple-100">
                  <div className="flex justify-between border-b border-purple-300/15 pb-2">
                    <span className="text-purple-300">Money</span>
                    <span className="text-amber-300">
                      {formatWon(STARTING_PROGRESSION.money)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-purple-300/15 pb-2">
                    <span className="text-purple-300">Rubies</span>
                    <span className="text-pink-300">{STARTING_PROGRESSION.rubies}</span>
                  </div>
                  <div className="flex justify-between border-b border-purple-300/15 pb-2">
                    <span className="text-purple-300">Company Tier</span>
                    <span className="text-teal-300">{STARTING_PROGRESSION.companyTier}</span>
                  </div>
                  <div className="flex justify-between border-b border-purple-300/15 pb-2">
                    <span className="text-purple-300">Reputation</span>
                    <span>{STARTING_PROGRESSION.companyReputation}</span>
                  </div>
                  <div className="flex justify-between border-b border-purple-300/15 pb-2">
                    <span className="text-purple-300">Groups / Solos</span>
                    <span>0 / 0</span>
                  </div>
                  <div className="flex justify-between border-b border-purple-300/15 pb-2">
                    <span className="text-purple-300">Trainees</span>
                    <span>0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Audition Slots</span>
                    <span>{STARTING_PROGRESSION.auditionCapacity} candidates</span>
                  </div>
                </div>
                <p className="pixel-micro text-purple-300 leading-relaxed pt-2">
                  Fully offline simulation. All progress saves locally in your browser.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl bg-[#1e0b4b] border border-purple-300/20 p-5 space-y-3">
                <h2 className="pixel-subtitle text-white">Saved Slots</h2>
                {filledSlots.length === 0 ? (
                  <p className="pixel-micro text-purple-300">
                    No saved slots found in browser storage.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {filledSlots.map((slot) => (
                      <div
                        key={slot!.slotId}
                        className="flex items-center justify-between gap-3 rounded-lg bg-[#2e1065] p-3 border border-purple-300/20"
                      >
                        <div className="min-w-0">
                          <div className="pixel-micro text-white truncate">
                            {slot!.companyName}
                          </div>
                          <div className="pixel-micro text-purple-300">
                            {slot!.dateLabel} · Tier {slot!.tierDisplay}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => actions.loadSlot(slot!.slotId)}
                          className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white pixel-micro cursor-pointer shrink-0"
                        >
                          Load
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-[#1e0b4b] border border-purple-300/20 p-5 space-y-3">
                <h2 className="pixel-subtitle text-white">Import Save JSON</h2>
                <textarea
                  rows={5}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste exported JSON save data here..."
                  className="w-full px-3 py-2 rounded-lg bg-[#270e55] border border-purple-300/30 text-white pixel-micro"
                />
                <button
                  type="button"
                  onClick={() => actions.importSave(importText)}
                  className="px-4 py-2.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white pixel-micro cursor-pointer"
                >
                  Validate & Import Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastStack />
    </div>
  );
};
