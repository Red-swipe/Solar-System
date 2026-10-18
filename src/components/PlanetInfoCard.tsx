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
  const latinOrigin = 'latinOrigin' in data ? (data as PlanetData).latinOrigin : 'Sol';
  
  return (
    <div className="absolute top-20 right-4 w-80 rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden animate-slideIn">
      {/* Header */}
      <div className="relative p-5 pb-3 border-b border-white/5">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
        >
          <X size={16} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{symbol}</span>
          <div>
            <h2 className="text-xl font-semibold text-white">{name}</h2>
            <p className="text-xs text-gray-400 italic">{latinOrigin}</p>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="p-4 space-y-2">
        <InfoRow label="Diameter" value={info.diameter} />
        <InfoRow label="Mass" value={info.mass} />
        <InfoRow label="Surface Gravity" value={info.gravity} />
        <InfoRow label="Day Length" value={info.dayLength} />
        <InfoRow label="Year Length" value={info.yearLength} />
        <InfoRow label="Avg Temperature" value={info.avgTemp} />
        <InfoRow label="Known Moons" value={String(info.moons)} />
      </div>
      
      {/* Trivia */}
      <div className="px-4 pb-3">
        <p className="text-xs text-blue-300/80 leading-relaxed bg-blue-500/5 rounded-lg p-3 border border-blue-500/10">
          💡 {info.trivia}
        </p>
      </div>
      
      {/* Actions */}
      <div className="p-4 pt-2 border-t border-white/5">
        <button
          onClick={onFlyTo}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 text-sm transition-all"
        >
          <Navigation size={14} />
          Fly To {name}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-200 font-mono">{value}</span>
    </div>
  );
}
