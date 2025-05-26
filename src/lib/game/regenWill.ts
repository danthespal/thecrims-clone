import sql from '@/lib/core/db';

export async function regenWill(
  userId: number,
  currentWill: number,
  lastRegen: string,
  maxWill: number,
  regenRate: number
) {
  const now = new Date();
  const lastRegenDate = new Date(lastRegen);
  const minutesPassed = Math.floor((now.getTime() - lastRegenDate.getTime()) / 60000);

  if (minutesPassed <= 0 || currentWill >= maxWill) {
    return { will: currentWill, last_regen: lastRegen };
  }

  const newWill = Math.min(currentWill + minutesPassed * regenRate, maxWill);

  await sql`
    UPDATE "User"
    SET will = ${newWill}, last_regen = ${now}
    WHERE id = ${userId}
  `;

  return { will: newWill, last_regen: now.toISOString() };
}
