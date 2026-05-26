interface StarRatingProps {
  difficulty: number;
  max?: number;
  size?: 'sm' | 'md';
}

export default function StarRating({ difficulty, max = 9, size = 'sm' }: StarRatingProps) {
  const stars = [];
  const fontSize = size === 'sm' ? '10px' : '13px';
  for (let i = 1; i <= max; i++) {
    stars.push(
      <span
        key={i}
        className={i <= difficulty ? 'star-filled' : 'star-empty'}
        style={{ fontSize }}
      >
        ★
      </span>
    );
  }
  return <span className="inline-flex gap-px">{stars}</span>;
}
