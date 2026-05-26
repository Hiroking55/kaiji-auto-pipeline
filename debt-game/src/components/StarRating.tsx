interface StarRatingProps {
  difficulty: number;
  max?: number;
  size?: 'sm' | 'md';
}

export default function StarRating({ difficulty, max = 9, size = 'sm' }: StarRatingProps) {
  const fontSize = size === 'sm' ? '10px' : '14px';
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < difficulty ? 'star-filled' : 'star-empty'} style={{ fontSize }}>
          ★
        </span>
      ))}
    </span>
  );
}
