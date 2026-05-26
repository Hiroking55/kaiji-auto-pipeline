interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  variant?: 'default' | 'positive' | 'negative';
}

export default function StatCard({ label, value, subValue, variant = 'default' }: StatCardProps) {
  const subValueColor =
    variant === 'positive' ? '#44ff44' : variant === 'negative' ? '#ff4444' : '#8888aa';

  return (
    <div
      className="rounded-xl p-4 border border-white/10"
      style={{ backgroundColor: '#16213e' }}
    >
      <p className="text-xs mb-1" style={{ color: '#8888aa' }}>
        {label}
      </p>
      <p className="text-xl font-bold" style={{ color: '#e0e0e0' }}>
        {value}
      </p>
      {subValue && (
        <p className="text-xs mt-1" style={{ color: subValueColor }}>
          {subValue}
        </p>
      )}
    </div>
  );
}
