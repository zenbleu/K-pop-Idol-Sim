import { STARTING_PROGRESSION } from '../../config/gameConfig';
import { GameDate, Weekday } from '../models/types';

export const WEEKDAYS: Weekday[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export function advanceGameWeeks(date: GameDate, weeks: number): GameDate {
  const totalWeeks = date.totalWeeks + weeks;
  const zeroBased = totalWeeks - 1;
  const weeksPerYear =
    STARTING_PROGRESSION.weeksPerMonth * STARTING_PROGRESSION.monthsPerYear;
  const yearOffset = Math.floor(zeroBased / weeksPerYear);
  const remYear = zeroBased % weeksPerYear;
  const month = Math.floor(remYear / STARTING_PROGRESSION.weeksPerMonth) + 1;
  const week = (remYear % STARTING_PROGRESSION.weeksPerMonth) + 1;
  return {
    year: 2026 + yearOffset,
    month,
    week,
    totalWeeks,
  };
}

export function formatGameDate(date: GameDate): string {
  return `Y${date.year} · M${String(date.month).padStart(2, '0')} · W${date.week}`;
}

export function formatGameDateShort(date: GameDate): string {
  return `${date.year}.${String(date.month).padStart(2, '0')}.W${date.week}`;
}

export function monthsToWeeks(months: number): number {
  return months * STARTING_PROGRESSION.weeksPerMonth;
}
