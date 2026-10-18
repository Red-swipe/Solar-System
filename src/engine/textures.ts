// Optimized Procedural Texture Generators
// High-performance typed array buffers (Uint8ClampedArray + putImageData)
// 50x-100x faster than canvas fillRect(), generating rich textures in milliseconds

function createFastCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imgData: ImageData;
  data: Uint8ClampedArray;
} {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: false })!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;
  return { canvas, ctx, imgData, data };
}

// Deterministic fast pseudo-random
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Fast 2D noise with integer hash
function hash(x: number, y: number, seed: number = 42): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

// Smooth bilinear interpolation noise
function smoothNoise(x: number, y: number, seed: number = 42): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  
  // Hermite curve for smooth blending
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  
  const n00 = hash(i, j, seed);
  const n10 = hash(i + 1, j, seed);
  const n01 = hash(i, j + 1, seed);
  const n11 = hash(i + 1, j + 1, seed);
  
  const nx0 = n00 * (1 - sx) + n10 * sx;
  const nx1 = n01 * (1 - sx) + n11 * sx;
  
  return nx0 * (1 - sy) + nx1 * sy;
}

// Fractal Brownian Motion (FBM) with smooth noise
function fbm(x: number, y: number, octaves: number = 4, seed: number = 42): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let o = 0; o < octaves; o++) {
    val += amp * smoothNoise(x * freq, y * freq, seed + o * 37);
    freq *= 2;
    amp *= 0.5;
  }
  return val;
}

export function generateSunTexture(width: number = 1024, height: number = 512): HTMLCanvasElement {
  const { canvas, ctx, imgData, data } = createFastCanvas(width, height);
  
  for (let y = 0; y < height; y++) {
    const ny = (y / height) * 6;
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * 12;
      const n1 = fbm(nx, ny, 4, 1);
      const n2 = fbm(nx * 2, ny * 2, 3, 5);
      const plasma = n1 * 0.7 + n2 * 0.3;
      
      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, 220 + plasma * 35);        // R
      data[idx + 1] = Math.min(255, 130 + plasma * 110);    // G
      data[idx + 2] = Math.floor(20 + plasma * 40);         // B
      data[idx + 3] = 255;                                  // A
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function generateEarthTexture(width: number = 1024, height: number = 512): HTMLCanvasElement {
  const { canvas, ctx, imgData, data } = createFastCanvas(width, height);
  
  for (let y = 0; y < height; y++) {
    const lat = (y / height - 0.5) * Math.PI;
    const ny = (y / height) * 5;
    const iceCap = Math.abs(lat) > 1.25 ? 1 : 0;
    
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * 10;
      const continent = fbm(nx, ny, 5, 42);
      const detail = fbm(nx * 3, ny * 3, 3, 84);
      const idx = (y * width + x) * 4;
      
      if (iceCap) {
        data[idx] = Math.floor(225 + detail * 25);
        data[idx + 1] = Math.floor(235 + detail * 20);
        data[idx + 2] = 250;
      } else if (continent > 0.47) {
        // Land & Vegetation
        const elev = (continent - 0.47) * 4;
        const isDesert = Math.abs(lat) < 0.4 && continent > 0.58;
        if (isDesert) {
          data[idx] = Math.floor(190 + detail * 35);
          data[idx + 1] = Math.floor(160 + detail * 25);
          data[idx + 2] = Math.floor(95 + detail * 20);
        } else {
          data[idx] = Math.floor(35 + elev * 70 + detail * 20);
          data[idx + 1] = Math.floor(95 + elev * 50 + detail * 25);
          data[idx + 2] = Math.floor(30 + detail * 20);
        }
      } else {
        // Ocean with depth shading
        const depth = (0.47 - continent) * 2.5;
        data[idx] = Math.floor(12 + depth * 12);
        data[idx + 1] = Math.floor(45 + depth * 35);
        data[idx + 2] = Math.floor(130 + depth * 60);
      }
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function generateCloudTexture(width: number = 512, height: number = 256): HTMLCanvasElement {
  const { canvas, ctx, imgData, data } = createFastCanvas(width, height);
  
  for (let y = 0; y < height; y++) {
    const ny = (y / height) * 4;
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * 8;
      const cloud = fbm(nx, ny, 4, 123);
      const idx = (y * width + x) * 4;
      
      const alpha = cloud > 0.46 ? Math.min(255, Math.floor((cloud - 0.46) * 4.5 * 255 * 0.75)) : 0;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = alpha;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function generateMercuryTexture(width: number = 512, height: number = 256): HTMLCanvasElement {
  const { canvas, ctx, imgData, data } = createFastCanvas(width, height);
  const rand = seededRandom(11);
  
  for (let y = 0; y < height; y++) {
    const ny = (y / height) * 6;
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * 12;
      const n = fbm(nx, ny, 4, 7);
      const v = Math.floor(110 + n * 70);
      const idx = (y * width + x) * 4;
      data[idx] = v;
      data[idx + 1] = v - 4;
      data[idx + 2] = v - 8;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  
  // High-performance overlay craters
  for (let i = 0; i < 70; i++) {
    const cx = rand() * width;
    const cy = rand() * height;
    const cr = 2 + rand() * 12;
    
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(50, 48, 46, 0.4)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(cx - cr * 0.2, cy - cr * 0.2, cr * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(160, 155, 150, 0.25)';
    ctx.fill();
  }
  
  return canvas;
}

export function generateVenusTexture(width: number = 512, height: number = 256): HTMLCanvasElement {
  const { canvas, ctx, imgData, data } = createFastCanvas(width, height);
  
  for (let y = 0; y < height; y++) {
    const ny = (y / height) * 4;
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * 8;
      const n1 = fbm(nx, ny, 4, 55);
      const swirl = Math.sin(ny * 7 + n1 * 3) * 0.5 + 0.5;
      const idx = (y * width + x) * 4;
      
      data[idx] = Math.min(255, Math.floor(210 + n1 * 30 + swirl * 15));
      data[idx + 1] = Math.min(255, Math.floor(170 + n1 * 25));
      data[idx + 2] = Math.floor(90 + swirl * 40);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function generateMarsTexture(width: number = 512, height: number = 256): HTMLCanvasElement {
  const { canvas, ctx, imgData, data } = createFastCanvas(width, height);
  
  for (let y = 0; y < height; y++) {
    const lat = (y / height - 0.5) * Math.PI;
    const ny = (y / height) * 5;
    const isCap = Math.abs(lat) > 1.35;
    
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * 10;
      const n = fbm(nx, ny, 4, 33);
      const detail = fbm(nx * 3, ny * 3, 2, 44);
      const idx = (y * width + x) * 4;
      
      if (isCap) {
        data[idx] = Math.floor(235 + detail * 15);
        data[idx + 1] = Math.floor(230 + detail * 15);
        data[idx + 2] = Math.floor(230 + detail * 20);
      } else {
        data[idx] = Math.floor(175 + n * 45 + detail * 20);
        data[idx + 1] = Math.floor(75 + n * 25 + detail * 15);
        data[idx + 2] = Math.floor(35 + n * 15);
      }
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function generateJupiterTexture(width: number = 1024, height: number = 512): HTMLCanvasElement {
  const { canvas, ctx, imgData, data } = createFastCanvas(width, height);
  
  const spotX = 0.62;
  const spotY = 0.58;
  
  for (let y = 0; y < height; y++) {
    const py = y / height;
    const band = Math.sin(py * 28) * 0.5 + 0.5;
    
    for (let x = 0; x < width; x++) {
      const px = x / width;
      const turb = fbm(px * 12, py * 10, 3, 77);
      
      // Great Red Spot distance
      const dx = px - spotX;
      const dy = (py - spotY) * 2;
      const spotDist = Math.sqrt(dx * dx + dy * dy);
      
      const idx = (y * width + x) * 4;
      
      if (spotDist < 0.065) {
        const spotFactor = 1 - spotDist / 0.065;
        data[idx] = Math.min(255, Math.floor(190 + spotFactor * 55 + turb * 10));
        data[idx + 1] = Math.floor(75 + spotFactor * 20);
        data[idx + 2] = Math.floor(45 + turb * 10);
      } else {
        const blend = band * 0.6 + turb * 0.4;
        data[idx] = Math.floor(175 + blend * 55);
        data[idx + 1] = Math.floor(125 + blend * 45);
        data[idx + 2] = Math.floor(70 + blend * 25);
      }
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function generateSaturnTexture(width: number = 1024, height: number = 512): HTMLCanvasElement {
  const { canvas, ctx, imgData, data } = createFastCanvas(width, height);
  
  for (let y = 0; y < height; y++) {
    const py = y / height;
    const band = Math.sin(py * 24) * 0.5 + 0.5;
    
    for (let x = 0; x < width; x++) {
      const px = x / width;
      const turb = fbm(px * 8, py * 6, 3, 99);
      const idx = (y * width + x) * 4;
      
      data[idx] = Math.floor(210 + band * 25 + turb * 15);
      data[idx + 1] = Math.floor(190 + band * 20 + turb * 10);
      data[idx + 2] = Math.floor(135 + band * 15);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function generateSaturnRingTexture(width: number = 512): HTMLCanvasElement {
  const height = 32;
  const { canvas, ctx, imgData, data } = createFastCanvas(width, height);
  
  for (let x = 0; x < width; x++) {
    const t = x / width;
    
    // Rings pattern with harmonic gaps
    const ringWave = (
      Math.sin(t * 70) * 0.35 +
      Math.sin(t * 35) * 0.25 +
      Math.sin(t * 110) * 0.15 +
      0.45
    );
    
    // Cassini division (gap at ~0.55)
    const cassini = Math.abs(t - 0.55) < 0.022 ? 0.04 : 1.0;
    // Encke gap (gap at ~0.80)
    const encke = Math.abs(t - 0.80) < 0.01 ? 0.08 : 1.0;
    
    const density = Math.min(1.0, Math.max(0, ringWave * cassini * encke));
    const alpha = Math.floor(density * 220);
    const bright = Math.floor(180 + Math.sin(t * 150) * 20);
    
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      data[idx] = bright;
      data[idx + 1] = Math.floor(bright * 0.92);
      data[idx + 2] = Math.floor(bright * 0.78);
      data[idx + 3] = alpha;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function generateUranusTexture(width: number = 512, height: number = 256): HTMLCanvasElement {
  const { canvas, ctx, imgData, data } = createFastCanvas(width, height);
  
  for (let y = 0; y < height; y++) {
    const ny = (y / height) * 3;
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * 6;
      const n = fbm(nx, ny, 2, 111);
      const band = Math.sin(ny * 12) * 0.08;
      const idx = (y * width + x) * 4;
      
      data[idx] = Math.floor(115 + n * 25 + band * 15);
      data[idx + 1] = Math.floor(190 + n * 20 + band * 12);
      data[idx + 2] = Math.floor(220 + n * 15);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function generateNeptuneTexture(width: number = 512, height: number = 256): HTMLCanvasElement {
  const { canvas, ctx, imgData, data } = createFastCanvas(width, height);
  
  for (let y = 0; y < height; y++) {
    const ny = (y / height) * 4;
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * 8;
      const n = fbm(nx, ny, 3, 222);
      const storm = fbm(nx * 2, ny * 2, 2, 333);
      const idx = (y * width + x) * 4;
      
      data[idx] = Math.floor(35 + n * 20);
      data[idx + 1] = Math.floor(65 + n * 25 + storm * 25);
      data[idx + 2] = Math.floor(170 + n * 35 + storm * 25);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function generateMoonTexture(width: number = 256, height: number = 128): HTMLCanvasElement {
  const { canvas, ctx, imgData, data } = createFastCanvas(width, height);
  
  for (let y = 0; y < height; y++) {
    const ny = (y / height) * 6;
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * 12;
      const n = fbm(nx, ny, 3, 99);
      const v = Math.floor(135 + n * 55);
      const idx = (y * width + x) * 4;
      data[idx] = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}
