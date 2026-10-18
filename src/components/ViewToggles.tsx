import { Orbit, Tag, Sparkles } from 'lucide-react';

interface ViewTogglesProps {
  showOrbits: boolean;
  showLabels: boolean;
  showAsteroids: boolean;
  onToggleOrbits: () => void;
  onToggleLabels: () => void;
  onToggleAsteroids: () => void;
}

export function ViewToggles({
  showOrbits,
  showLabels,
  showAsteroids,
  onToggleOrbits,
  onToggleLabels,
  onToggleAsteroids,
}: ViewTogglesProps) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
      <ToggleButton
        icon={<Orbit size={15} />}
        label="Orbits"
        active={showOrbits}
        onClick={onToggleOrbits}
      />
      <ToggleButton
        icon={<Tag size={15} />}
        label="Labels"
        active={showLabels}
        onClick={onToggleLabels}
      />
      <ToggleButton
        icon={<Sparkles size={15} />}
        label="Asteroids"
        active={showAsteroids}
        onClick={onToggleAsteroids}
      />
    </div>
  );
}

function ToggleButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 backdrop-blur-md border focus:outline-none focus:ring-1 focus:ring-blue-400 active:scale-95 ${
        active
          ? 'bg-blue-600/25 border-blue-500/40 text-blue-200 shadow-md shadow-blue-900/20'
          : 'bg-black/80 border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/5'
      }`}
      aria-pressed={active}
      title={`Toggle ${label}`}
    >
      <span className={active ? 'text-blue-400' : 'text-gray-500'}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
