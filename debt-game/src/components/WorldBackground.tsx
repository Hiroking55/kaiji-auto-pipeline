'use client';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function WorldBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* AI generated Monster Hunter landscape */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${basePath}/bg-world.jpg"), url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Color grade + fade to dark */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(20,16,10,0.1) 0%, rgba(20,16,10,0.2) 30%, rgba(16,14,10,0.5) 55%, rgba(16,14,10,0.85) 75%, #100e0a 90%)',
        }}
      />

      {/* Side vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center 25%, transparent 35%, rgba(10,8,5,0.5) 100%)',
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
    </div>
  );
}
