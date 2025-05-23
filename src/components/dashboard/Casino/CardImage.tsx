import Image from 'next/image';

interface CardImageProps {
    card: string;
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

export default function CardImage({ card, className = '' }: CardImageProps) {
    const value = card.slice(0, -1);
    const suitSymbol = card.slice(-1);
    const suit = suitMap[suitSymbol];

    const cardName = nameMap[value] || value;
    const filename = `${cardName}_of_${suit}.svg`;

    return (
        <Image 
            src={`/cards/${filename}`}
            alt={card}
            width={80}
            height={120}
            className={`rounded shadow-md ${className}`}
        />
    );
}