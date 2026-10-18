import { Play, Pause, RotateCcw, Gauge } from 'lucide-react';

interface ControlBarProps {
  isPaused: boolean;
  speed: number;
  elapsedDays: number;
  onTogglePause: () => void;
  onSpeedChange: (speed: number) => void;
  onResetCamera: () => void;
}

const SPEED_PRESETS = [0.5, 1, 2, 5, 10, 20];

export function ControlBar({
  isPaused,
  speed,
  elapsedDays,
  onTogglePause,
  onSpeedChange,
  onResetCamera,
}: ControlBarProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
      {/* Play/Pause */}
      <button
        onClick={onTogglePause}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
        title={isPaused ? 'Play (Space)' : 'Pause (Space)'}
      >
        {isPaused ? <Play size={20} /> : <Pause size={20} />}
      </button>
      
      {/* Speed slider */}
      <div className="flex items-center gap-2">
        <Gauge size={14} className="text-blue-400" />
        <input
          type="range"
          min="0.1"
          max="20"
          step="0.1"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-28 h-1 accent-blue-500 cursor-pointer"
        />
        <span className="text-xs text-blue-300 font-mono w-12 text-right">{speed.toFixed(1)}x</span>
      </div>
      
      {/* Speed presets */}
      <div className="flex gap-1 border-l border-white/10 pl-3">
        {SPEED_PRESETS.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-1 text-xs rounded font-mono transition-all ${
              Math.abs(speed - s) < 0.05
                ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
      
      {/* Elapsed time */}
      <div className="border-l border-white/10 pl-3">
        <span className="text-xs text-gray-400 font-mono">
          Day {Math.floor(elapsedDays).toLocaleString()}
        </span>
      </div>
      
      {/* Reset */}
      <button
        onClick={onResetCamera}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
        title="Reset Camera (Esc)"
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
}
