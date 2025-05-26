export function calculateTimeToFull(current: number, max: number, rate: number): string {
  const missing = max - current;
  if (missing <= 0 || rate <= 0) return 'Full';
  const totalMinutes = missing / rate;
  const minutes = Math.floor(totalMinutes);
  const seconds = Math.ceil((totalMinutes - minutes) * 60);
  return `${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;
}
