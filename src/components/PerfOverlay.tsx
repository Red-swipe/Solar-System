import { useState } from 'react';
import type { EnginePerfStats } from '../engine/SolarSystemEngine';

interface PerfOverlayProps {
  stats: EnginePerfStats;
}

export function PerfOverlay({ stats }: PerfOverlayProps) {
  const [minimized, setMinimized] = useState(false);

  const fpsColor =
    stats.fps >= 55
      ? 'text-emerald-400'
      : stats.fps >= 35
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="fixed bottom-4 left-4 z-50 font-mono text-[11px] select-none pointer-events-auto">
      <div className="bg-black/85 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden text-gray-300">
        <button
          type="button"
          onClick={() => setMinimized(!minimized)}
          className="w-full flex items-center justify-between gap-4 px-3 py-1.5 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 text-left focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white tracking-wider text-[10px]">ENGINE STATS</span>
          </div>
          <span className={`font-bold ${fpsColor}`}>{stats.fps} FPS</span>
        </button>

        {!minimized && (
          <div className="p-3 space-y-1.5 w-44">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Frame Time:</span>
              <span className="text-white font-medium">{stats.frameTimeMs.toFixed(1)} ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Draw Calls:</span>
              <span className="text-blue-300 font-medium">{stats.drawCalls}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Triangles:</span>
              <span className="text-blue-300 font-medium">{stats.triangles.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Geometries:</span>
              <span className="text-gray-300">{stats.geometries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Textures:</span>
              <span className="text-gray-300">{stats.textures}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Pixel Ratio:</span>
              <span className="text-gray-300">{stats.pixelRatio}x</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
