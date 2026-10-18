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
  hoveredPlanet: string | null;
  onSelect: (name: string) => void;
}

export function PlanetSelector({ selectedPlanet, hoveredPlanet, onSelect }: PlanetSelectorProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl z-20 max-w-[95vw] overflow-x-auto transition-all duration-300">
      {PLANET_ORDER.map((name) => {
        const icon = PLANET_ICONS[name];
        const isSelected = selectedPlanet === name;
        const isHovered = hoveredPlanet === name;

        return (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className={`group relative flex flex-col items-center px-2.5 sm:px-3 py-1.5 rounded-xl transition-all duration-200 focus:outline-none ${
              isSelected
                ? 'bg-white/15 scale-105 shadow-md shadow-white/5 border border-white/20'
                : isHovered
                ? 'bg-white/10 scale-105'
                : 'hover:bg-white/5 hover:scale-102 opacity-80 hover:opacity-100'
            }`}
            title={`Focus on ${name}`}
            aria-label={`Select ${name}`}
          >
            <span
              className="text-base sm:text-lg leading-none transition-transform duration-200 group-hover:scale-110"
              style={{ color: icon.color }}
            >
              {icon.symbol}
            </span>
            <span
              className={`text-[9px] sm:text-[10px] mt-0.5 tracking-tight font-medium transition-colors ${
                isSelected ? 'text-white font-semibold' : 'text-gray-400 group-hover:text-gray-200'
              }`}
            >
              {name}
            </span>
            {isSelected && (
              <span
                className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: icon.color }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
