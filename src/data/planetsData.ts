export interface PlanetData {
  name: string;
  symbol: string;
  latinOrigin: string;
  radius: number;
  orbitDistance: number;
  orbitalSpeedRatio: number;
  axialTilt: number;
  rotationSpeed: number;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  hasRings?: boolean;
  ringInnerRadius?: number;
  ringOuterRadius?: number;
  hasMoon?: boolean;
  moonRadius?: number;
  moonOrbitDistance?: number;
  moonOrbitSpeed?: number;
  info: {
    diameter: string;
    mass: string;
    gravity: string;
    dayLength: string;
    yearLength: string;
    avgTemp: string;
    moons: number;
    trivia: string;
  };
}

export const SUN_DATA = {
  name: 'Sun',
  symbol: '☉',
  radius: 12,
  color: '#FDB813',
  info: {
    diameter: '1,391,000 km',
    mass: '1.989 × 10³⁰ kg',
    gravity: '274 m/s²',
    dayLength: '25.4 Earth days',
    yearLength: 'N/A',
    avgTemp: '5,505°C (surface)',
    moons: 0,
    trivia: 'The Sun contains 99.86% of all mass in our solar system. It fuses 600 million tons of hydrogen into helium every second.'
  }
};

export const PLANETS: PlanetData[] = [
  {
    name: 'Mercury',
    symbol: '☿',
    latinOrigin: 'Mercurius (messenger god)',
    radius: 0.8,
    orbitDistance: 24,
    orbitalSpeedRatio: 4.15,
    axialTilt: 0.034,
    rotationSpeed: 0.003,
    color: '#A0A0A0',
    info: {
      diameter: '4,879 km',
      mass: '3.301 × 10²³ kg',
      gravity: '3.7 m/s²',
      dayLength: '58.6 Earth days',
      yearLength: '88 Earth days',
      avgTemp: '167°C',
      moons: 0,
      trivia: 'Mercury has no atmosphere, so its temperature swings from -180°C at night to 430°C during the day — the widest range in our solar system.'
    }
  },
  {
    name: 'Venus',
    symbol: '♀',
    latinOrigin: 'Venus (goddess of love)',
    radius: 1.4,
    orbitDistance: 34,
    orbitalSpeedRatio: 1.62,
    axialTilt: 2.64,
    rotationSpeed: -0.002,
    color: '#E8CDA0',
    info: {
      diameter: '12,104 km',
      mass: '4.867 × 10²⁴ kg',
      gravity: '8.87 m/s²',
      dayLength: '243 Earth days',
      yearLength: '225 Earth days',
      avgTemp: '464°C',
      moons: 0,
      trivia: 'Venus rotates backwards compared to most planets, and a day on Venus is longer than its year.'
    }
  },
  {
    name: 'Earth',
    symbol: '⊕',
    latinOrigin: 'Terra (Roman) / Gaia (Greek)',
    radius: 1.5,
    orbitDistance: 46,
    orbitalSpeedRatio: 1.0,
    axialTilt: 0.41,
    rotationSpeed: 0.02,
    color: '#4A90D9',
    hasMoon: true,
    moonRadius: 0.4,
    moonOrbitDistance: 4,
    moonOrbitSpeed: 3,
    info: {
      diameter: '12,742 km',
      mass: '5.972 × 10²⁴ kg',
      gravity: '9.81 m/s²',
      dayLength: '24 hours',
      yearLength: '365.25 days',
      avgTemp: '15°C',
      moons: 1,
      trivia: 'Earth is the only known planet with liquid surface water, plate tectonics, and life. Its magnetic field shields it from solar wind.'
    }
  },
  {
    name: 'Mars',
    symbol: '♂',
    latinOrigin: 'Mars (god of war)',
    radius: 1.0,
    orbitDistance: 58,
    orbitalSpeedRatio: 0.53,
    axialTilt: 0.44,
    rotationSpeed: 0.019,
    color: '#C1440E',
    info: {
      diameter: '6,779 km',
      mass: '6.417 × 10²³ kg',
      gravity: '3.72 m/s²',
      dayLength: '24h 37min',
      yearLength: '687 Earth days',
      avgTemp: '-65°C',
      moons: 2,
      trivia: 'Mars has the tallest volcano in the solar system — Olympus Mons at 21.9 km high, nearly 2.5 times the height of Everest.'
    }
  },
  {
    name: 'Jupiter',
    symbol: '♃',
    latinOrigin: 'Jupiter (king of gods)',
    radius: 4.2,
    orbitDistance: 96,
    orbitalSpeedRatio: 0.084,
    axialTilt: 0.054,
    rotationSpeed: 0.04,
    color: '#C88B3A',
    info: {
      diameter: '139,820 km',
      mass: '1.898 × 10²⁷ kg',
      gravity: '24.79 m/s²',
      dayLength: '9h 56min',
      yearLength: '11.86 Earth years',
      avgTemp: '-110°C',
      moons: 95,
      trivia: 'Jupiter\'s Great Red Spot is a storm larger than Earth that has been raging for at least 400 years.'
    }
  },
  {
    name: 'Saturn',
    symbol: '♄',
    latinOrigin: 'Saturn (god of agriculture)',
    radius: 3.5,
    orbitDistance: 122,
    orbitalSpeedRatio: 0.034,
    axialTilt: 0.47,
    rotationSpeed: 0.038,
    color: '#E8D5A3',
    hasRings: true,
    ringInnerRadius: 4.5,
    ringOuterRadius: 8,
    info: {
      diameter: '116,460 km',
      mass: '5.683 × 10²⁶ kg',
      gravity: '10.44 m/s²',
      dayLength: '10h 42min',
      yearLength: '29.46 Earth years',
      avgTemp: '-140°C',
      moons: 146,
      trivia: 'Saturn\'s density is so low it would float in a bathtub of water — if you could find one big enough.'
    }
  },
  {
    name: 'Uranus',
    symbol: '♅',
    latinOrigin: 'Uranus (god of the sky)',
    radius: 2.2,
    orbitDistance: 148,
    orbitalSpeedRatio: 0.012,
    axialTilt: 1.71,
    rotationSpeed: 0.025,
    color: '#7EC8E3',
    hasRings: true,
    ringInnerRadius: 2.8,
    ringOuterRadius: 3.8,
    info: {
      diameter: '50,724 km',
      mass: '8.681 × 10²⁵ kg',
      gravity: '8.87 m/s²',
      dayLength: '17h 14min',
      yearLength: '84 Earth years',
      avgTemp: '-195°C',
      moons: 28,
      trivia: 'Uranus rotates on its side with an axial tilt of 98°, likely caused by a collision with an Earth-sized object long ago.'
    }
  },
  {
    name: 'Neptune',
    symbol: '♆',
    latinOrigin: 'Neptune (god of the sea)',
    radius: 2.1,
    orbitDistance: 172,
    orbitalSpeedRatio: 0.006,
    axialTilt: 0.49,
    rotationSpeed: 0.026,
    color: '#3B5EAB',
    info: {
      diameter: '49,528 km',
      mass: '1.024 × 10²⁶ kg',
      gravity: '11.15 m/s²',
      dayLength: '16h 6min',
      yearLength: '164.8 Earth years',
      avgTemp: '-200°C',
      moons: 16,
      trivia: 'Neptune has the strongest sustained winds of any planet — up to 2,100 km/h. It was the first planet found by mathematical prediction rather than observation.'
    }
  }
];
