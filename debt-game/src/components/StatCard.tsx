interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  variant?: 'default' | 'positive' | 'negative';
}

export default function StatCard({ label, value, subValue, variant = 'default' }: StatCardProps) {
  const valueColor =
    variant === 'positive' ? '#4cce7b' : variant === 'negative' ? '#e85d5d' : '#eef0f6';
  const glowClass =
    variant === 'positive' ? 'glow-green' : variant === 'negative' ? 'glow-red' : '';

  return (
    <div className="glass-inner p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#8890b0' }}>
        {label}
      </p>
      <p className={`text-lg font-extrabold ${glowClass}`} style={{ color: valueColor }}>
        {value}
      </p>
      {subValue && (
        <p className="text-[10px] mt-1 font-medium" style={{ color: '#8890b0' }}>
          {subValue}
        </p>
      )}
    </div>
  );
}
