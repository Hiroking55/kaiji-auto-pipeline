'use client';

export default function WorldBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden" style={{ background: '#06080f' }}>
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #06080f 0%, #0a1020 30%, #101830 55%, #182040 75%, #1a1828 100%)',
        }}
      />

      {/* Stars */}
      <div className="absolute inset-0" style={{ opacity: 0.7 }}>
        <svg width="100%" height="60%" xmlns="http://www.w3.org/2000/svg">
          {[
            [12, 8, 1.2], [25, 15, 0.8], [40, 5, 1.0], [55, 20, 0.6], [70, 10, 1.1],
            [85, 18, 0.7], [95, 6, 0.9], [8, 25, 0.5], [33, 28, 0.8], [60, 3, 1.3],
            [78, 22, 0.6], [15, 35, 0.7], [48, 32, 0.5], [90, 28, 0.9], [5, 14, 0.6],
            [20, 40, 0.4], [65, 38, 0.7], [82, 35, 0.5], [38, 12, 0.8], [50, 42, 0.6],
            [73, 8, 0.5], [28, 22, 0.9], [58, 30, 0.4], [42, 18, 0.7], [88, 14, 0.6],
          ].map(([x, y, r], i) => (
            <circle
              key={i}
              cx={`${x}%`}
              cy={`${y}%`}
              r={r as number}
              fill="white"
              opacity={0.3 + (i % 3) * 0.2}
            >
              <animate
                attributeName="opacity"
                values={`${0.2 + (i % 3) * 0.15};${0.5 + (i % 2) * 0.3};${0.2 + (i % 3) * 0.15}`}
                dur={`${3 + (i % 4)}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </svg>
      </div>

      {/* Moon */}
      <div
        className="absolute"
        style={{
          top: '8%',
          right: '15%',
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, #e8e0c8 0%, #c8b888 40%, #a09060 100%)',
          boxShadow: '0 0 60px rgba(200, 180, 120, 0.15), 0 0 120px rgba(200, 180, 120, 0.08)',
          opacity: 0.8,
        }}
      />

      {/* Far mountains */}
      <svg
        className="absolute bottom-0 w-full"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        style={{ height: '55%' }}
      >
        <path
          d="M0 400 L0 280 Q50 200 120 240 Q180 180 250 220 Q300 140 380 200 Q420 160 480 190 Q540 120 620 180 Q680 140 750 170 Q820 100 900 160 Q950 130 1000 150 Q1060 110 1120 160 Q1160 140 1200 180 L1200 400 Z"
          fill="#0c1428"
          opacity="0.9"
        />
      </svg>

      {/* Mid mountains */}
      <svg
        className="absolute bottom-0 w-full"
        viewBox="0 0 1200 350"
        preserveAspectRatio="none"
        style={{ height: '45%' }}
      >
        <path
          d="M0 350 L0 250 Q80 200 150 230 Q200 180 280 220 Q340 150 420 200 Q480 170 540 190 Q600 130 700 180 Q760 160 820 175 Q900 120 980 170 Q1040 150 1100 165 Q1150 140 1200 170 L1200 350 Z"
          fill="#0a1020"
          opacity="0.95"
        />
      </svg>

      {/* Near hills / forest silhouette */}
      <svg
        className="absolute bottom-0 w-full"
        viewBox="0 0 1200 250"
        preserveAspectRatio="none"
        style={{ height: '32%' }}
      >
        {/* Tree-like bumps for forest canopy */}
        <path
          d="M0 250 L0 160 Q20 140 40 155 Q55 130 75 150 Q90 120 120 145 Q140 130 160 148 Q180 115 210 140 Q230 125 260 142 Q280 110 320 135 Q350 120 380 138 Q410 105 450 130 Q480 118 510 132 Q540 100 580 128 Q610 115 640 130 Q670 95 720 125 Q750 112 780 128 Q810 98 850 122 Q880 108 920 125 Q950 95 1000 120 Q1030 108 1060 122 Q1090 100 1120 118 Q1150 105 1180 120 L1200 115 L1200 250 Z"
          fill="#080e18"
        />
      </svg>

      {/* Ground */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '15%',
          background: 'linear-gradient(180deg, #080e18 0%, #060a12 100%)',
        }}
      />

      {/* Fog / mist layers */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '40%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(10,16,30,0.3) 40%, rgba(10,16,30,0.7) 70%, rgba(8,12,20,0.9) 100%)',
        }}
      />

      {/* Campfire glow from bottom */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: '140%',
          height: '30%',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(200,120,40,0.06) 0%, rgba(180,80,20,0.03) 30%, transparent 60%)',
        }}
      />

      {/* Ambient light from top-left (moonlight) */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 85% 8%, rgba(160,150,120,0.03) 0%, transparent 40%)',
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </div>
  );
}
