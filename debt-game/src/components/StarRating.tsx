export default function StarRating({ difficulty, max = 9 }: { difficulty: number; max?: number; size?: 'sm' | 'md' }) {
  return (
    <span className="inline-flex gap-px">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < difficulty ? 'star-filled' : 'star-empty'} style={{ fontSize: 10 }}>★</span>
      ))}
    </span>
  );
}
