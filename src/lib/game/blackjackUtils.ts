export const CARD_VALUES: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 10, 'Q': 10, 'K': 10, 'A': 11,
};

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = Object.keys(CARD_VALUES);

export const drawCard = (): string => {
  const value = VALUES[Math.floor(Math.random() * VALUES.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return `${value}${suit}`;
};

export const calculateScore = (hand: string[]) => {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    const value = card.replace(/[♠♥♦♣]/g, ''); // Remove suit
    total += CARD_VALUES[value];
    if (value === 'A') aces++;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
};

export const calculateVisibleDealerScore = (dealerHand: string[]): number | string => {
  if (!dealerHand || dealerHand.length < 2) return '?';
  const visibleCard = dealerHand[1];
  const value = visibleCard.replace(/[♠♥♦♣]/g, '');
  return CARD_VALUES[value] ?? '?';
};
