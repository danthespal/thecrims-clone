import sql from '@/lib/db';
import { checkLevelUp } from '@/lib/levelUp';

export interface RobberyHandlerResult {
  earnedMoney: number;
  earnedRespect: number;
  message: string;
  levelUp?: number | null;
}

export const robberyActions = {
  'street-thief': {
    label: 'Street Thief',
    willCost: 10,
    moneyReward: 100,
    respectReward: 10,
    cooldownSeconds: 10,
    handler: async (userId: string): Promise<RobberyHandlerResult> => {
      return handleRobbery('street-thief', userId);
    },
  },

  'shop-heist': {
    label: 'Shop Heist',
    willCost: 20,
    moneyReward: 300,
    respectReward: 25,
    cooldownSeconds: 30,
    handler: async (userId: string): Promise<RobberyHandlerResult> => {
      return handleRobbery('shop-heist', userId);
    },
  },

  'bank-raid': {
    label: 'Bank Raid',
    willCost: 50,
    moneyReward: 1000,
    respectReward: 100,
    cooldownSeconds: 60,
    handler: async (userId: string): Promise<RobberyHandlerResult> => {
      return handleRobbery('bank-raid', userId);
    },
  },
} as const;

export type RobberyAction = keyof typeof robberyActions;

async function handleRobbery(action: RobberyAction, userId: string): Promise<RobberyHandlerResult> {
  const config = robberyActions[action];
  const now = new Date();

  const [user] = await sql`
    SELECT id, level, will, money, respect
    FROM "User"
    WHERE id = ${userId}
  `;

  if (!user) throw new Error('User not found');
  if (user.will < config.willCost) throw new Error('Not enough willpower');

  const [cooldownRow] = await sql`
    SELECT last_used FROM "UserCooldowns"
    WHERE user_id = ${user.id} AND action = ${action}
  `;

  if (cooldownRow) {
    const lastUsed = new Date(cooldownRow.last_used);
    const secondsPassed = (now.getTime() - lastUsed.getTime()) / 1000;
    if (secondsPassed < config.cooldownSeconds) {
      const wait = Math.ceil(config.cooldownSeconds - secondsPassed);
      throw new Error(`Wait ${wait}s before trying again.`);
    }
  }

  const newRespect = user.respect + config.respectReward;
  const newMoney = user.money + config.moneyReward;

  await sql.begin(async (tx) => {
    await tx`
      UPDATE "User"
      SET will = will - ${config.willCost},
          money = ${newMoney},
          respect = ${newRespect}
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

  return {
    earnedMoney: config.moneyReward,
    earnedRespect: config.respectReward,
    message: `${config.label} success!`,
    levelUp: newLevel > user.level ? newLevel : null,
  };
}
