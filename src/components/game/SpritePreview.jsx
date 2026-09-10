import React, { useEffect, useRef } from 'react';
import { getCharacterSheet } from '@/game/gfx/characterSprites';
import { appearanceOf } from '@/game/data/appearance';

// Live animated sprite preview (idle/walk cycle) for the character creator.
export default function SpritePreview({ appearance, scale = 5, walk = true, dir = 'down', className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const sheet = getCharacterSheet(appearanceOf(appearance));
    let raf;
    let start;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (start === undefined) start = t;
      const step = Math.floor((t - start) / 150);
      const frame = walk ? [1, 0, 2, 0][step % 4] : 0;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 16, 24);
      ctx.drawImage(sheet.frames[dir][frame], 0, 0);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [JSON.stringify(appearance), walk, dir]);
  return (
    <canvas
      ref={ref}
      width={16}
      height={24}
      style={{ width: 16 * scale, height: 24 * scale, imageRendering: 'pixelated' }}
      className={className}
    />
  );
}