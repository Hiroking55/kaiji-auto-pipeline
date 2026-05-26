'use client';

export default function WorldBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Sky */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #5a7a9a 0%, #8aa0b8 25%, #b8c8d0 45%, #d0c8b0 65%, #c0a880 80%, #a08060 100%)',
        }}
      />

      {/* Haze / atmospheric perspective */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 120% 60% at 50% 40%, rgba(220,210,190,0.15) 0%, transparent 60%)',
        }}
      />

      {/* Sun glow */}
      <div
        className="absolute"
        style={{
          top: '15%',
          left: '65%',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,240,200,0.3) 0%, rgba(255,220,160,0.1) 40%, transparent 70%)',
        }}
      />

      {/* Far mountains */}
      <svg className="absolute bottom-0 w-full" viewBox="0 0 1200 500" preserveAspectRatio="none" style={{ height: '60%' }}>
        <path
          d="M0 500 L0 320 Q60 240 140 280 Q200 200 280 260 Q340 170 440 230 Q500 190 560 220 Q640 140 740 200 Q800 170 870 195 Q940 130 1020 180 Q1080 150 1140 175 L1200 195 L1200 500Z"
          fill="#8a8878"
          opacity="0.4"
        />
      </svg>

      {/* Mid mountains */}
      <svg className="absolute bottom-0 w-full" viewBox="0 0 1200 400" preserveAspectRatio="none" style={{ height: '48%' }}>
        <path
          d="M0 400 L0 280 Q80 220 160 260 Q220 180 320 240 Q380 190 460 225 Q540 160 640 210 Q700 185 780 200 Q860 145 960 190 Q1020 170 1080 185 Q1140 160 1200 185 L1200 400Z"
          fill="#706858"
          opacity="0.5"
        />
      </svg>

      {/* Near rocky hills */}
      <svg className="absolute bottom-0 w-full" viewBox="0 0 1200 300" preserveAspectRatio="none" style={{ height: '36%' }}>
        <path
          d="M0 300 L0 200 Q40 175 80 190 Q120 160 180 180 Q220 150 280 175 Q330 140 400 168 Q450 148 520 165 Q580 135 660 160 Q720 142 790 158 Q850 130 940 155 Q1000 140 1060 152 Q1120 135 1200 155 L1200 300Z"
          fill="#58503c"
          opacity="0.6"
        />
      </svg>

      {/* Ground / desert floor */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '22%',
          background: 'linear-gradient(180deg, #48402c 0%, #3a3424 30%, #302c20 60%, #201c14 100%)',
        }}
      />

      {/* Dust / heat haze at ground level */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '35%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(160,140,100,0.08) 30%, rgba(100,80,50,0.15) 60%, rgba(40,36,24,0.9) 85%, rgba(20,18,12,1) 100%)',
        }}
      />

      {/* Very bottom - fade to dark for content readability */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '50%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(16,14,10,0.7) 50%, rgba(16,14,10,0.95) 75%, #100e0a 100%)',
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px',
        }}
      />
    </div>
  );
}
