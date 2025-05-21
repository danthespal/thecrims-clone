import sql from '@/lib/db';

export async function checkLevelUp(userId: number, currentLevel: number, currentRespect: number) {
  let level = currentLevel;

  while (true) {
    const [nextLevel] = await sql`
      SELECT respect_required FROM "LevelRequirements"
      WHERE level = ${level + 1}
    `;

    if (!nextLevel || currentRespect < nextLevel.respect_required) break;

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
