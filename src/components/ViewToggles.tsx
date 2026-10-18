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
    <div className="absolute top-4 right-4 flex flex-col gap-2">
      <ToggleButton
        icon={<Orbit size={16} />}
        label="Orbits"
        active={showOrbits}
        onClick={onToggleOrbits}
      />
      <ToggleButton
        icon={<Tag size={16} />}
        label="Labels"
        active={showLabels}
        onClick={onToggleLabels}
      />
      <ToggleButton
        icon={<Sparkles size={16} />}
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
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all backdrop-blur-xl border ${
        active
          ? 'bg-white/10 border-white/20 text-white'
          : 'bg-black/40 border-white/5 text-gray-500 hover:text-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
