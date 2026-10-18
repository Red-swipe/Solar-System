import { forwardRef } from 'react';
import { Play, Pause, RotateCcw, Gauge } from 'lucide-react';

interface ControlBarProps {
  isPaused: boolean;
  speed: number;
  onTogglePause: () => void;
  onSpeedChange: (speed: number) => void;
  onResetCamera: () => void;
}

const SPEED_PRESETS = [0.5, 1, 2, 5, 10, 20];

export const ControlBar = forwardRef<HTMLSpanElement, ControlBarProps>(function ControlBar(
  {
    isPaused,
    speed,
    onTogglePause,
    onSpeedChange,
    onResetCamera,
  },
  ref
) {
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl z-20 transition-all duration-300">
      {/* Play/Pause Button */}
      <button
        onClick={onTogglePause}
        className="p-2 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 transition-all text-white border border-white/5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        title={isPaused ? 'Resume Simulation (Space)' : 'Pause Simulation (Space)'}
        aria-label={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
      >
        {isPaused ? <Play size={18} className="text-emerald-400 fill-emerald-400/20" /> : <Pause size={18} className="text-amber-400 fill-amber-400/20" />}
      </button>

      {/* Speed Slider */}
      <div className="flex items-center gap-2 pl-1">
        <Gauge size={15} className="text-blue-400 shrink-0" />
        <input
          type="range"
          min="0.1"
          max="20"
          step="0.1"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-24 sm:w-28 h-1.5 bg-gray-700/80 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
          title="Adjust Simulation Speed"
        />
        <span className="text-xs text-blue-300 font-mono w-11 text-right font-medium">
          {speed.toFixed(1)}x
        </span>
      </div>

      {/* Speed Presets */}
      <div className="hidden sm:flex gap-1 border-l border-white/10 pl-3">
        {SPEED_PRESETS.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-1 text-[11px] rounded-lg font-mono transition-all duration-200 active:scale-95 ${
              Math.abs(speed - s) < 0.05
                ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/20 font-semibold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Decoupled High-Performance Day Counter (No React Re-render Hotpath) */}
      <div className="border-l border-white/10 pl-3 min-w-[76px]">
        <span
          ref={ref}
          className="text-xs text-gray-300 font-mono font-medium tracking-wide"
        >
          Day 0
        </span>
      </div>

      {/* Reset Camera Button */}
      <div className="border-l border-white/10 pl-3">
        <button
          onClick={onResetCamera}
          className="p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-gray-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          title="Reset View / Overview (Esc)"
          aria-label="Reset Camera"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
});
