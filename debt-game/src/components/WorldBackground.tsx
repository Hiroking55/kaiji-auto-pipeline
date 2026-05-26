'use client';

export default function WorldBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden" style={{ background: '#08090c' }}>
      {/* Abstract mesh gradient - subtle, slow drift */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 20% 80%, rgba(140, 80, 30, 0.06) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 80% 20%, rgba(60, 60, 90, 0.05) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(80, 60, 40, 0.03) 0%, transparent 50%)
          `,
          animation: 'mesh-drift 30s ease-in-out infinite alternate',
        }}
      />

      {/* Fine grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Top edge light */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent 10%, rgba(160,120,60,0.15) 50%, transparent 90%)',
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      <style jsx>{`
        @keyframes mesh-drift {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.08) translate(-10px, 8px); }
        }
      `}</style>
    </div>
  );
}
