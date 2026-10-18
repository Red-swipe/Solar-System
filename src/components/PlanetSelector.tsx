const PLANET_ICONS: Record<string, { symbol: string; color: string }> = {
  Sun: { symbol: '☉', color: '#FDB813' },
  Mercury: { symbol: '☿', color: '#A0A0A0' },
  Venus: { symbol: '♀', color: '#E8CDA0' },
  Earth: { symbol: '⊕', color: '#4A90D9' },
  Mars: { symbol: '♂', color: '#C1440E' },
  Jupiter: { symbol: '♃', color: '#C88B3A' },
  Saturn: { symbol: '♄', color: '#E8D5A3' },
  Uranus: { symbol: '♅', color: '#7EC8E3' },
  Neptune: { symbol: '♆', color: '#3B5EAB' },
};

const PLANET_ORDER = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

interface PlanetSelectorProps {
  selectedPlanet: string | null;
  onSelect: (name: string) => void;
}

export function PlanetSelector({ selectedPlanet, onSelect }: PlanetSelectorProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-2 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10">
      {PLANET_ORDER.map((name) => {
        const icon = PLANET_ICONS[name];
        const isSelected = selectedPlanet === name;
        return (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className={`flex flex-col items-center px-3 py-1.5 rounded-xl transition-all duration-200 ${
              isSelected
                ? 'bg-white/10 scale-110'
                : 'hover:bg-white/5 hover:scale-105'
            }`}
            title={name}
          >
            <span
              className="text-lg leading-none"
              style={{ color: icon.color }}
            >
              {icon.symbol}
            </span>
            <span className={`text-[10px] mt-0.5 ${
              isSelected ? 'text-white' : 'text-gray-500'
            }`}>
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
