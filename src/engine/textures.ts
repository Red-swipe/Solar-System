// Procedural texture generators using HTML5 Canvas
// No external images needed - everything is mathematically generated

function createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

// Simple seeded pseudo-random for deterministic textures
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// 2D noise function for natural textures
function noise2D(x: number, y: number, seed: number = 42): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function fbm(x: number, y: number, octaves: number, seed: number = 42): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency, seed + i * 100);
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

export function generateSunTexture(size: number = 1024): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(size, size);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size * 6;
      const ny = y / size * 6;
      const n = fbm(nx, ny, 6, 1);
      const n2 = fbm(nx * 2, ny * 2, 4, 2);
      
      const r = Math.min(255, Math.floor(200 + n * 55));
      const g = Math.min(255, Math.floor(120 + n * 80 + n2 * 40));
      const b = Math.floor(20 + n2 * 50);
      
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

export function generateEarthTexture(size: number = 1024): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(size, size);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size * 8;
      const ny = y / size * 4;
      const continent = fbm(nx, ny, 6, 42);
      const detail = fbm(nx * 4, ny * 4, 3, 84);
      const lat = (y / size - 0.5) * Math.PI;
      const iceCap = Math.abs(lat) > 1.2 ? 1 : 0;
      
      let r: number, g: number, b: number;
      if (iceCap) {
        r = 230 + detail * 25; g = 235 + detail * 20; b = 240;
      } else if (continent > 0.48) {
        // Land
        const elev = (continent - 0.48) * 5;
        r = 30 + elev * 80 + detail * 30;
        g = 80 + elev * 40 + detail * 40;
        b = 20 + detail * 20;
        // Desert bands near equator
        if (Math.abs(lat) < 0.4 && continent > 0.6) {
          r = 180 + detail * 40;
          g = 150 + detail * 30;
          b = 80 + detail * 20;
        }
      } else {
        // Ocean
        const depth = (0.48 - continent) * 3;
        r = 10 + depth * 10;
        g = 40 + depth * 30 + detail * 20;
        b = 120 + depth * 60 + detail * 30;
      }
      
      ctx.fillStyle = `rgb(${Math.min(255, Math.floor(r))},${Math.min(255, Math.floor(g))},${Math.min(255, Math.floor(b))})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

export function generateCloudTexture(size: number = 1024): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(size, size);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size * 6;
      const ny = y / size * 3;
      const cloud = fbm(nx, ny, 5, 123);
      const alpha = cloud > 0.45 ? Math.min(1, (cloud - 0.45) * 4) : 0;
      
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.7})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

export function generateMercuryTexture(size: number = 512): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(size, size);
  const rand = seededRandom(7);
  
  // Base gray surface
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm(x / size * 10, y / size * 5, 5, 7);
      const v = Math.floor(100 + n * 80);
      ctx.fillStyle = `rgb(${v},${v - 5},${v - 10})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
  // Craters
  for (let i = 0; i < 120; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const cr = 3 + rand() * 20;
    const darkness = 60 + rand() * 40;
    
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${darkness},${darkness},${darkness},0.5)`;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(cx - cr * 0.2, cy - cr * 0.2, cr * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${darkness + 30},${darkness + 25},${darkness + 20},0.4)`;
    ctx.fill();
  }
  
  return canvas;
}

export function generateVenusTexture(size: number = 512): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(size, size);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size * 6;
      const ny = y / size * 3;
      const n1 = fbm(nx, ny, 5, 55);
      const n2 = fbm(nx * 2, ny * 0.5, 3, 66);
      const swirl = Math.sin(ny * 8 + n1 * 4) * 0.5 + 0.5;
      
      const r = Math.floor(200 + n1 * 30 + swirl * 20);
      const g = Math.floor(160 + n1 * 25 + n2 * 20);
      const b = Math.floor(80 + n2 * 40);
      
      ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

export function generateMarsTexture(size: number = 512): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(size, size);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size * 8;
      const ny = y / size * 4;
      const n = fbm(nx, ny, 5, 33);
      const detail = fbm(nx * 3, ny * 3, 3, 44);
      const lat = (y / size - 0.5) * Math.PI;
      
      let r: number, g: number, b: number;
      // Polar ice caps
      if (Math.abs(lat) > 1.3) {
        const ice = (Math.abs(lat) - 1.3) * 5;
        r = Math.floor(180 + ice * 60 + detail * 15);
        g = Math.floor(170 + ice * 65 + detail * 15);
        b = Math.floor(160 + ice * 70 + detail * 15);
      } else {
        r = Math.floor(160 + n * 50 + detail * 25);
        g = Math.floor(70 + n * 30 + detail * 15);
        b = Math.floor(30 + n * 15 + detail * 10);
      }
      
      ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

export function generateJupiterTexture(size: number = 1024): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(size, size);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size * 8;
      const ny = y / size;
      const band = Math.sin(ny * 30) * 0.5 + 0.5;
      const turb = fbm(nx, ny * 10, 4, 77);
      const detail = fbm(nx * 3, ny * 15, 3, 88);
      
      // Great Red Spot
      const spotX = 0.6, spotY = 0.55;
      const dx = (x / size - spotX);
      const dy = (y / size - spotY) * 2;
      const spotDist = Math.sqrt(dx * dx + dy * dy);
      const inSpot = spotDist < 0.08;
      
      let r: number, g: number, b: number;
      if (inSpot) {
        const spotIntensity = 1 - spotDist / 0.08;
        r = Math.floor(180 + spotIntensity * 60 + turb * 15);
        g = Math.floor(80 + spotIntensity * 20 + turb * 10);
        b = Math.floor(50 + turb * 10);
      } else {
        const base = band * 0.6 + turb * 0.4;
        r = Math.floor(160 + base * 60 + detail * 20);
        g = Math.floor(120 + base * 40 + detail * 15);
        b = Math.floor(60 + base * 20 + detail * 10);
      }
      
      ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

export function generateSaturnTexture(size: number = 1024): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(size, size);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size * 6;
      const ny = y / size;
      const band = Math.sin(ny * 25) * 0.5 + 0.5;
      const turb = fbm(nx, ny * 8, 4, 99);
      
      const r = Math.floor(200 + band * 30 + turb * 20);
      const g = Math.floor(180 + band * 25 + turb * 15);
      const b = Math.floor(120 + band * 20 + turb * 15);
      
      ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

export function generateSaturnRingTexture(size: number = 1024): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(size, 64);
  
  for (let x = 0; x < size; x++) {
    const t = x / size;
    const rand = seededRandom(Math.floor(t * 200));
    
    // Ring density varies with radial distance
    const ringPattern = (
      Math.sin(t * 80) * 0.3 +
      Math.sin(t * 40) * 0.2 +
      Math.sin(t * 120) * 0.1 +
      0.4
    );
    
    // Cassini division (gap)
    const cassiniGap = Math.abs(t - 0.55) < 0.02 ? 0.05 : 1;
    // Encke gap
    const enckeGap = Math.abs(t - 0.78) < 0.01 ? 0.1 : 1;
    
    const density = Math.max(0, ringPattern * cassiniGap * enckeGap);
    const brightness = 160 + rand() * 60;
    
    for (let y = 0; y < 64; y++) {
      ctx.fillStyle = `rgba(${brightness},${brightness * 0.9},${brightness * 0.75},${density * 0.8})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

export function generateUranusTexture(size: number = 512): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(size, size);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size * 4;
      const ny = y / size;
      const n = fbm(nx, ny * 6, 3, 111);
      const band = Math.sin(ny * 15) * 0.1;
      
      const r = Math.floor(100 + n * 30 + band * 20);
      const g = Math.floor(180 + n * 25 + band * 15);
      const b = Math.floor(210 + n * 20 + band * 10);
      
      ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

export function generateNeptuneTexture(size: number = 512): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(size, size);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size * 5;
      const ny = y / size;
      const n = fbm(nx, ny * 7, 4, 222);
      const storm = fbm(nx * 3, ny * 3, 3, 333);
      const band = Math.sin(ny * 18) * 0.15;
      
      const r = Math.floor(30 + n * 20 + band * 10);
      const g = Math.floor(50 + n * 30 + storm * 20 + band * 15);
      const b = Math.floor(140 + n * 40 + storm * 30 + band * 20);
      
      ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

export function generateMoonTexture(size: number = 256): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(size, size);
  const rand = seededRandom(99);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm(x / size * 12, y / size * 6, 4, 99);
      const v = Math.floor(140 + n * 60);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
  // Craters on moon
  for (let i = 0; i < 60; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const cr = 2 + rand() * 12;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(80,80,80,0.4)`;
    ctx.fill();
  }
  
  return canvas;
}

export function generateStarfieldTexture(size: number = 2048): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(size, size);
  const rand = seededRandom(12345);
  
  // Black background
  ctx.fillStyle = '#000005';
  ctx.fillRect(0, 0, size, size);
  
  // Subtle nebula clouds
  for (let i = 0; i < 5; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const radius = 200 + rand() * 400;
    const hue = rand() * 60 + 200; // Blue to purple
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, `hsla(${hue}, 60%, 20%, 0.08)`);
    gradient.addColorStop(0.5, `hsla(${hue}, 40%, 15%, 0.04)`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  
  // Stars of varying sizes and brightness
  for (let i = 0; i < 3000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const brightness = 150 + rand() * 105;
    const starSize = rand() < 0.05 ? 1.5 + rand() * 1.5 : 0.5 + rand() * 1;
    
    // Color variation
    const colorRand = rand();
    let r: number, g: number, b: number;
    if (colorRand < 0.1) {
      // Blue stars
      r = brightness * 0.7; g = brightness * 0.8; b = brightness;
    } else if (colorRand < 0.15) {
      // Red stars
      r = brightness; g = brightness * 0.6; b = brightness * 0.5;
    } else if (colorRand < 0.2) {
      // Yellow stars
      r = brightness; g = brightness * 0.95; b = brightness * 0.7;
    } else {
      // White stars
      r = brightness; g = brightness; b = brightness;
    }
    
    ctx.beginPath();
    ctx.arc(x, y, starSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
    ctx.fill();
    
    // Glow for bright stars
    if (starSize > 1.2) {
      ctx.beginPath();
      ctx.arc(x, y, starSize * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},0.1)`;
      ctx.fill();
    }
  }
  
  return canvas;
}
