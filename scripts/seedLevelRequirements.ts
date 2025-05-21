import 'dotenv/config';
import sql from '../src/lib/db';

async function seedLevelRequirements() {
  const maxLevel = 99;
  const respectList: number[] = [];

  let current = 100;
  for (let level = 1; level <= maxLevel; level++) {
    respectList.push(Math.floor(current));
    // Grow curve faster early, then slow it down
    if (level < 10) current *= 2;
    else if (level < 30) current *= 1.5;
    else if (level < 60) current *= 1.3;
    else current *= 1.15;
  }

  for (let level = 1; level <= maxLevel; level++) {
    const respectRequired = respectList[level - 1];

    await sql`
      INSERT INTO "LevelRequirements" (level, respect_required)
      VALUES (${level}, ${respectRequired})
      ON CONFLICT (level) DO NOTHING;
    `;
  }

  console.log('✅ Seeded LevelRequirements up to level 99 (stable curve)');
  process.exit(0);
}

seedLevelRequirements().catch((err) => {
  console.error('❌ Error seeding level requirements:', err);
  process.exit(1);
});
