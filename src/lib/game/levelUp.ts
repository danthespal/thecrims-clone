import sql from '@/lib/core/db';
import levelRequirements from '@/data/level-requirements.json';

export async function checkLevelUp(userId: number, currentLevel: number, currentRespect: number) {
  let level = currentLevel;

  while (true) {
    const next = levelRequirements.find((l) => l.level === level + 1);
    if (!next || currentRespect < next.respect_required) break;
    level += 1;
  }

  if (level > currentLevel) {
    await sql`
      UPDATE "User"
      SET level = ${level}
      WHERE id = ${userId}
    `;
  }

  return level;
}
