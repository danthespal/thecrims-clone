export const robberyActions = {
  'street-thief': {
    label: 'Street Thief',
    willCost: 10,
    moneyReward: 100,
    respectReward: 10,
    cooldownSeconds: 10,
  },
  'shop-heist': {
    label: 'Shop Heist',
    willCost: 20,
    moneyReward: 300,
    respectReward: 25,
    cooldownSeconds: 30,
  },
  'bank-raid': {
    label: 'Bank Raid',
    willCost: 50,
    moneyReward: 1000,
    respectReward: 100,
    cooldownSeconds: 60,
  },
} as const;

export type RobberyAction = keyof typeof robberyActions;
