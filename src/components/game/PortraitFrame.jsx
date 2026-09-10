import React, { useMemo } from 'react';
import { portraitDataURL } from '@/game/gfx/characterSprites';
import { appearanceOf } from '@/game/data/appearance';

// Pixel bust portrait derived from appearance choices, in a small frame.
export default function PortraitFrame({ appearance, size = 44, className = '' }) {
  const app = appearanceOf(appearance);
  const url = useMemo(() => portraitDataURL(app), [JSON.stringify(app)]);
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative shrink-0 rounded-md overflow-hidden border-2 border-amber-800/70 bg-stone-950 shadow-[inset_0_0_6px_rgba(0,0,0,0.6)] ${className}`}
      title="Cultivator portrait"
    >
      <img src={url} alt="Portrait" draggable={false} className="w-full h-full" style={{ imageRendering: 'pixelated' }} />
    </div>
  );
}