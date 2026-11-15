# K-pop Idol Tycoon

A fully offline, text-based K-pop entertainment company management simulator built with React, TypeScript, Vite, and Tailwind CSS.

## Features
- **Company Progression**: Start with ₩100,000,000, 100 Rubies, Tier F, Local Reputation, 0 groups/soloists/trainees, and 2 audition candidate slots. Grow through milestone-driven Reputation (`Local` → `Worldwide`) and composite Company Tiers (`F` → `P`).
- **Auditions & Centralized Portraits**: Money auditions (`Streets`, `Domestic`, `International`, `Global`) and targeted Ruby auditions (`1 week` to `2 months`) backed by centralized gender-specific portrait collections (`public/female-idol-roster/F-Idol-1..40.jpg` and `public/male-idol-roster/M-Idol-1..40.jpg`).
- **Company, Groups & Soloists**: 3-column management workspace (`Idols`, `Group / Solo`, `Trainees`), role assignment, automatic youngest-member Maknae detection, adjustable Company/Group income splits (locked during active production/promotion), 6-month group rejoining cooldowns, disbandment, and true overlay Idol Profile modal.
- **Training & Agency HQ**: Main, Main 2, and Main 3 training studios with diminishing returns, specialty weights, potential, stamina/fatigue, and multi-branch Agency HQ upgrades.
- **Production & Real-Time Sales**: Single, EP, and Album production with genres, concepts, trends, wardrobe bonuses, recording stamina costs, and a 10-minute real-time + offline sales timer without duplicate payouts.
- **7-Day Weekly Planner**: Unlimited daily tasks across Monday–Sunday with conflict validation and chronological daily simulation on **Next Week**.
- **Concerts & Tours**: Domestic, International, Global, and Company Concerts capped by venue capacity, plus multi-date Tours unlocked via sellout concerts.

## Development & Build
```bash
npm install
npm run dev      # Start local dev server on port 3000
npm run lint     # TypeScript check
npm run build    # Production static bundle in dist/
```

## GitHub Pages Deployment
`vite.config.ts` is configured with `base: './'` and zero backend/API dependencies.
1. Run `npm run build` to generate the static `dist/` directory.
2. Publish the contents of `dist/` to your `gh-pages` branch or GitHub Pages workflow.
3. All fonts (`@fontsource/press-start-2p`) and portrait assets load locally and offline.

## Local Save System
- Uses browser `localStorage` (`saveVersion: 1`) with automatic saving, 5 manual save slots, JSON export/download, validated JSON import, schema migration defaults, and confirmation-guarded reset.
