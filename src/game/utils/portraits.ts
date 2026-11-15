import { Gender } from '../models/types';

export const PORTRAIT_COUNT_PER_GENDER = 40;

export function createPortraitFilename(gender: Gender, indexOneBased: number): string {
  const clamped = Math.max(1, Math.min(PORTRAIT_COUNT_PER_GENDER, indexOneBased));
  return gender === 'Female' ? `F-Idol-${clamped}.jpg` : `M-Idol-${clamped}.jpg`;
}

export function pickAvailablePortrait(gender: Gender, usedFilenames: Set<string>): string {
  const candidates: string[] = [];
  for (let i = 1; i <= PORTRAIT_COUNT_PER_GENDER; i++) {
    const fn = createPortraitFilename(gender, i);
    if (!usedFilenames.has(fn)) {
      candidates.push(fn);
    }
  }
  const pool =
    candidates.length > 0
      ? candidates
      : Array.from({ length: PORTRAIT_COUNT_PER_GENDER }, (_, idx) =>
          createPortraitFilename(gender, idx + 1)
        );
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getPortraitUrl(gender: Gender, filename: string): string {
  const base = import.meta.env?.BASE_URL ?? './';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const folder = gender === 'Female' ? 'female-idol-roster' : 'male-idol-roster';
  return `${normalizedBase}${folder}/${filename}`;
}
