export default function StarRating({ difficulty, max = 9, size = 'sm' }: { difficulty: number; max?: number; size?: 'sm' | 'md' }) {
  const fs = size === 'sm' ? '10px' : '14px';
  return (
    <span className="inline-flex gap-px">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < difficulty ? 'star-filled' : 'star-empty'} style={{ fontSize: fs }}>★</span>
      ))}
    </span>
  );
}
