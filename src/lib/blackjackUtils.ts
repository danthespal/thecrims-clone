export const CARD_VALUES: Record<string, number> = {
  2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
  7: 7, 8: 8, 9: 9, 10: 10,
  J: 10, Q: 10, K: 10, A: 11,
};

export const drawCard = (): string => {
  const faces = Object.keys(CARD_VALUES);
  return faces[Math.floor(Math.random() * faces.length)];
};

export const calculateScore = (hand: string[]) => {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    total += CARD_VALUES[card];
    if (card === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
};
