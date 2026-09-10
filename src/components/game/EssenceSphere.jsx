import React, { useEffect, useRef, useState } from 'react';

// The Cultivation Aperture: a translucent spherical vessel where the player's
// essence sits as living liquid. The level reads at a glance, animates
// smoothly up/down, breathes during recovery, glows when a breakthrough is
// ready, and releases drifting particles when essence rises.
export default function EssenceSphere({ value, max, size = 150, glow = false, breathing = false, showNumbers = true }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  const [particles, setParticles] = useState([]);
  const prev = useRef(value);
  const idc = useRef(0);

  // essence increased → small energy particles rise through the liquid
  useEffect(() => {
    if (value > prev.current + 0.5) {
      const n = Math.min(6, 2 + Math.floor((value - prev.current) / 8));
      const pts = Array.from({ length: n }, (_, i) => ({
        id: idc.current++,
        left: 18 + Math.random() * 64,
        bottom: 4 + Math.random() * Math.max(8, pct - 12),
        size: 2 + Math.round(Math.random() * 2),
        delay: i * 60 + Math.random() * 200,
      }));
      setParticles((p) => [...p.slice(-10), ...pts]);
      prev.current = value;
      const t = setTimeout(() => setParticles((p) => p.slice(pts.length)), 1700);
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value, pct]);

  return (
    <div
      className={`relative rounded-full select-none ${breathing ? 'animate-aperture-breathe' : ''} ${glow ? 'animate-aperture-glow' : ''}`}
      style={{ width: size, height: size }}
    >
      {/* glass vessel */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 32% 26%, rgba(190,240,255,0.20), rgba(30,60,90,0.10) 45%, rgba(4,10,18,0.45) 100%)',
          boxShadow: 'inset 0 0 20px rgba(120,200,255,0.28), inset -6px -10px 18px rgba(0,0,0,0.45)',
        }}
      >
        {/* liquid essence — the level IS the essence */}
        <div className="absolute inset-x-0 bottom-0 transition-[height] duration-1000 ease-out" style={{ height: `${pct}%` }}>
          <div className="absolute -top-1 -inset-x-4 h-3 rounded-[100%] bg-sky-300/50" style={{ filter: 'blur(1.5px)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(56,189,248,0.85), rgba(14,116,144,0.92) 55%, rgba(8,47,73,0.96))' }} />
          <div className="absolute left-[16%] bottom-[8%] w-[12%] h-[75%] rounded-full"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.30), transparent)', filter: 'blur(2px)' }} />
        </div>
        {/* rising essence particles */}
        {particles.map((pt) => (
          <span
            key={pt.id}
            className="absolute rounded-full animate-aperture-rise"
            style={{
              left: `${pt.left}%`, bottom: `${pt.bottom}%`, width: pt.size, height: pt.size,
              background: 'rgba(200,245,255,0.95)', boxShadow: '0 0 6px rgba(140,220,255,0.9)',
              animationDelay: `${pt.delay}ms`,
            }}
          />
        ))}
        {/* rim + specular highlight */}
        <div className="absolute inset-0 rounded-full border-2 border-sky-200/20" />
        <div className="absolute left-[18%] top-[12%] w-[24%] h-[14%] rounded-full"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.35), transparent 70%)' }} />
      </div>
      {showNumbers && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-semibold text-sky-50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">{Math.floor(value)}</span>
          <span className="text-[10px] text-sky-200/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">/ {max}</span>
        </div>
      )}
    </div>
  );
}