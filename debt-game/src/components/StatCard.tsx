interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  variant?: 'default' | 'positive' | 'negative';
}

export default function StatCard({ label, value, subValue, variant = 'default' }: StatCardProps) {
  const valueColor =
    variant === 'positive' ? '#30f848' : variant === 'negative' ? '#f83030' : '#ffffff';
  const subValueColor =
    variant === 'positive' ? '#30f848' : variant === 'negative' ? '#f83030' : '#9090c0';

  return (
    <div className="pixel-window-dark">
      <p className="text-[10px] mb-1" style={{ color: '#9090c0' }}>
        {label}
      </p>
      <p className="text-base font-bold" style={{ color: valueColor }}>
        {value}
      </p>
      {subValue && (
        <p className="text-[10px] mt-1" style={{ color: subValueColor }}>
          {subValue}
        </p>
      )}
    </div>
  );
}
