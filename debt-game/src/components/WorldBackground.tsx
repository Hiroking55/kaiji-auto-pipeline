'use client';

export default function WorldBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Background image - epic mountain wilderness */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Color grade overlay - warm/epic tone */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(40,30,15,0.15) 0%, rgba(30,20,10,0.3) 40%, rgba(20,15,8,0.6) 65%, rgba(16,14,10,0.92) 80%, #100e0a 100%)',
        }}
      />

      {/* Side vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center 30%, transparent 30%, rgba(10,8,5,0.4) 100%)',
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

      {/* Fallback gradient if image fails to load */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: 'linear-gradient(180deg, #5a7a9a 0%, #8aa0b8 25%, #b8c8d0 45%, #c0a880 70%, #3a3424 90%, #100e0a 100%)',
        }}
      />
    </div>
  );
}
