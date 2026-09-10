import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const tooltipStyle = { background: '#10181a', border: '1px solid #44403c', borderRadius: 8, fontSize: 11 };

function MiniTrend({ title, data, lines }) {
  return (
    <div className="rounded-xl border border-stone-800 bg-black/20 p-3">
      <div className="text-[11px] text-stone-300 mb-1">{title}</div>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#78716c', fontSize: 9 }} tickFormatter={(d) => String(d).slice(5)} minTickGap={18} />
            <YAxis tick={{ fill: '#78716c', fontSize: 9 }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#d6d3d1' }} />
            {lines.map(l => (
              <Line key={l.key} dataKey={l.key} name={l.name} stroke={l.stroke} strokeWidth={2} dot={{ r: 2 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-3 mt-1 text-[9px]">
        {lines.map(l => (
          <span key={l.key} className="flex items-center gap-1 text-stone-400">
            <span className="w-2.5 h-0.5 inline-block rounded" style={{ background: l.stroke }} />{l.name}
          </span>
        ))}
      </div>
    </div>
  );
}

// Visual trends from the Google-Sheet milestone rows — growth over time.
export default function TrendsChart({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="mt-3 rounded-xl border border-stone-800 bg-black/20 px-3 py-5 text-center text-[11px] text-stone-500">
        No milestones synced yet — press “Sync today’s milestone” and your growth trend will appear here.
      </div>
    );
  }
  const data = history.map(r => ({
    date: r.date,
    progress: r.cultivationProgress,
    maxEssence: r.maxEssence,
    essence: r.currentEssence,
    insight: r.totalInsight,
  }));
  return (
    <div className="mt-3 grid sm:grid-cols-2 gap-2">
      <MiniTrend title="🧘 Cultivation Progress %" data={data} lines={[{ key: 'progress', name: 'Progress %', stroke: '#34d399' }]} />
      <MiniTrend title="💧 Primeval Essence" data={data} lines={[{ key: 'maxEssence', name: 'Max', stroke: '#38bdf8' }, { key: 'essence', name: 'Current', stroke: '#7dd3fc' }]} />
    </div>
  );
}