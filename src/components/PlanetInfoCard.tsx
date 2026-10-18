import { X, Navigation } from 'lucide-react';
import type { PlanetData } from '../data/planetsData';
import { SUN_DATA } from '../data/planetsData';

interface PlanetInfoCardProps {
  name: string;
  data: PlanetData | typeof SUN_DATA;
  onClose: () => void;
  onFlyTo: () => void;
}

export function PlanetInfoCard({ name, data, onClose, onFlyTo }: PlanetInfoCardProps) {
  const info = data.info;
  const symbol = 'symbol' in data ? data.symbol : '☉';
  const latinOrigin = 'latinOrigin' in data ? (data as PlanetData).latinOrigin : 'Sol (Central Star)';

  return (
    <aside
      className="absolute top-20 right-4 w-76 sm:w-80 rounded-2xl bg-black/85 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden z-30 transition-all duration-300 ease-out transform translate-x-0 opacity-100"
      style={{
        animation: 'cardSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      aria-label={`${name} Information`}
    >
      {/* Header */}
      <div className="relative p-4 sm:p-5 pb-3 border-b border-white/10 bg-white/5">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          title="Close details (Esc)"
          aria-label="Close details"
        >
          <X size={16} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl filter drop-shadow-md">{symbol}</span>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{name}</h2>
            <p className="text-[11px] text-gray-400 italic">{latinOrigin}</p>
          </div>
        </div>
      </div>

      {/* Planetary Specs */}
      <div className="p-4 space-y-2 text-xs">
        <InfoRow label="Diameter" value={info.diameter} />
        <InfoRow label="Mass" value={info.mass} />
        <InfoRow label="Surface Gravity" value={info.gravity} />
        <InfoRow label="Day Length" value={info.dayLength} />
        <InfoRow label="Orbital Period" value={info.yearLength} />
        <InfoRow label="Avg Surface Temp" value={info.avgTemp} />
        <InfoRow label="Known Moons" value={String(info.moons)} />
      </div>

      {/* Trivia / Scientific Lore */}
      <div className="px-4 pb-3">
        <div className="text-[11px] text-blue-200/90 leading-relaxed bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
          <span className="font-semibold text-blue-300 block mb-1">ASTRONOMICAL NOTE</span>
          {info.trivia}
        </div>
      </div>

      {/* Action CTA */}
      <div className="p-4 pt-1 border-t border-white/5">
        <button
          onClick={onFlyTo}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/45 active:scale-98 border border-blue-500/40 text-blue-200 font-medium text-xs transition-all shadow-lg shadow-blue-900/20 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <Navigation size={13} className="text-blue-400" />
          Refocus Camera on {name}
        </button>
      </div>
    </aside>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-0.5 border-b border-white/[0.03]">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-200 font-mono font-medium">{value}</span>
    </div>
  );
}
