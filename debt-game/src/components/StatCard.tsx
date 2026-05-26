interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  variant?: 'default' | 'positive' | 'negative';
}

export default function StatCard({ label, value, subValue, variant = 'default' }: StatCardProps) {
  const valueColor =
    variant === 'positive' ? '#40c850' : variant === 'negative' ? '#e84040' : '#f0e8d8';

  return (
    <div className="mh-panel-dark p-3">
      <p className="text-[10px] font-bold mb-1" style={{ color: '#a09078' }}>
        {label}
      </p>
      <p className="text-base font-black" style={{ color: valueColor }}>
        {value}
      </p>
      {subValue && (
        <p className="text-[10px] mt-0.5" style={{ color: '#a09078' }}>
          {subValue}
        </p>
      )}
    </div>
  );
}
