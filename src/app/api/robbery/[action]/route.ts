import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { cookies } from 'next/headers';
import { checkLevelUp } from '@/lib/levelUp';
import { robberyActions, RobberyAction } from '@/lib/robberyConfig';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function POST(
  req: NextRequest,
  { params }: { params: { action: string } }
) {
  const awaitedParams = await params;
  const action = awaitedParams.action as RobberyAction;
  const config = robberyActions[action];

  const limitRes = checkRateLimit(req);
  if (limitRes) return limitRes;

  if (!config) {
    return NextResponse.json({ error: 'Invalid robbery action' }, { status: 400 });
  }

  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session-token');

    if (!session?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [user] = await sql`
      SELECT u.id, u.level, u.respect, u.money, u.will
      FROM "Sessions" s
      JOIN "User" u ON u.id = s.user_id
      WHERE s.id = ${session.value}
    `;

    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const [cooldown] = await sql`
      SELECT last_used FROM "UserCooldowns"
      WHERE user_id = ${user.id} AND action = ${action}
    `;

    const now = new Date();
    if (cooldown) {
      const lastUsed = new Date(cooldown.last_used);
      const secondsPassed = (now.getTime() - lastUsed.getTime()) / 1000;

      if (secondsPassed < config.cooldownSeconds) {
        const wait = Math.ceil(config.cooldownSeconds - secondsPassed);
        return NextResponse.json({ error: `Wait ${wait}s before trying again.` }, { status: 429 });
      }
    }

    if (user.will < config.willCost) {
      return NextResponse.json({ error: 'Not enough will' }, { status: 400 });
    }

    const newRespect = user.respect + config.respectReward;
    const newMoney = user.money + config.moneyReward;

    await sql.begin(async (tx) => {
      await tx`
        UPDATE "User"
        SET will = will - ${config.willCost},
            respect = ${newRespect},
            money = ${newMoney}
        WHERE id = ${user.id}
      `;

      await tx`
        INSERT INTO "UserCooldowns" (user_id, action, last_used)
        VALUES (${user.id}, ${action}, ${now})
        ON CONFLICT (user_id, action)
        DO UPDATE SET last_used = EXCLUDED.last_used
      `;
    });

    const newLevel = await checkLevelUp(user.id, user.level, newRespect);

    return NextResponse.json({
      success: true,
      robbery: action,
      rewards: {
        money: config.moneyReward,
        respect: config.respectReward,
      },
      level_up: newLevel > user.level ? newLevel : null,
      cooldown: config.cooldownSeconds,
    });
  } catch (err) {
    console.error('Robbery error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
