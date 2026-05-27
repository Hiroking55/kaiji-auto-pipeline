interface StatCardProps { label: string; value: string; subValue?: string; variant?: 'default' | 'positive' | 'negative'; }

export default function StatCard({ label, value, subValue, variant = 'default' }: StatCardProps) {
  const vc = variant === 'positive' ? '#2d8a4e' : variant === 'negative' ? '#d9534f' : '#2b3a67';
  return (
    <div className="rpg-panel-inner p-3">
      <p className="text-[10px] font-bold mb-1" style={{ color: '#5a6a8a' }}>{label}</p>
      <p className="text-base font-bold" style={{ color: vc }}>{value}</p>
      {subValue && <p className="text-[10px] mt-0.5" style={{ color: '#8a96b0' }}>{subValue}</p>}
    </div>
  );
}
