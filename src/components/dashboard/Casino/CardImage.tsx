import Image from 'next/image';
import { motion } from 'framer-motion';

interface CardImageProps {
  card: string;
  faceDown?: boolean;
  delay?: number;
  className?: string;
}

const suitMap: Record<string, string> = {
  '♠': 'spades',
  '♥': 'hearts',
  '♦': 'diamonds',
  '♣': 'clubs',
};

const nameMap: Record<string, string> = {
  'A': 'ace',
  'J': 'jack',
  'Q': 'queen',
  'K': 'king',
};

export default function CardImage({ card, faceDown = false, delay = 0, className = '' }: CardImageProps) {
  const value = card.slice(0, -1);
  const suitSymbol = card.slice(-1);
  const suit = suitMap[suitSymbol];
  const cardName = nameMap[value] || value;
  const filename = `${cardName}_of_${suit}.svg`;

  return (
    <motion.div
      className={`[perspective:1000px] w-[80px] h-[120px]`}
    >
      <motion.div
        className="relative w-full h-full"
        initial={{ rotateY: 180 }}
        animate={{ rotateY: faceDown ? 180 : 0 }}
        transition={{ duration: 0.6, delay }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <Image
          src={`/cards/${filename}`}
          alt={card}
          width={80}
          height={120}
          className={`absolute backface-hidden rounded shadow-md ${className}`}
        />
        {/* Back */}
        <Image
          src="/cards/back.png"
          alt="Card back"
          width={80}
          height={120}
          className="absolute backface-hidden rounded shadow-md"
          style={{ transform: 'rotateY(180deg)' }}
        />
      </motion.div>
    </motion.div>
  );
}
