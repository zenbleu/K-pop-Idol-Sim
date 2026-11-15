export function formatWon(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}₩${Math.abs(rounded).toLocaleString('en-US')}`;
}

export function formatNumber(amount: number): string {
  return Math.round(amount).toLocaleString('en-US');
}

export function formatCountdown(msRemaining: number): string {
  const totalSec = Math.max(0, Math.ceil(msRemaining / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
