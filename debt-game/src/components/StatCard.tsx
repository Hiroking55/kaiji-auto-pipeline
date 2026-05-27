export default function StatCard({ label, value, variant = 'default' }: { label: string; value: string; subValue?: string; variant?: 'default' | 'positive' | 'negative' }) {
  const c = variant === 'positive' ? '#10b981' : variant === 'negative' ? '#ef4444' : '#1a1a2e';
  return (
    <div className="card-inner p-3">
      <p className="text-[10px] font-semibold mb-1" style={{ color: '#6b7280' }}>{label}</p>
      <p className="text-lg font-bold" style={{ color: c }}>{value}</p>
    </div>
  );
}
