import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLANETS, SUN_DATA, type PlanetData } from '../data/planetsData';
import {
  generateSunTexture,
  generateEarthTexture,
  generateCloudTexture,
  generateMercuryTexture,
  generateVenusTexture,
  generateMarsTexture,
  generateJupiterTexture,
  generateSaturnTexture,
  generateSaturnRingTexture,
  generateUranusTexture,
  generateNeptuneTexture,
  generateMoonTexture,
} from './textures';

export interface PlanetMesh {
  name: string;
  data: PlanetData | typeof SUN_DATA;
  mesh: THREE.Mesh;
  pivot: THREE.Object3D;
  proxySphere: THREE.Mesh;
  orbitLine?: THREE.Line;
  trail?: THREE.Line;
  trailPositions?: Float32Array;
  trailAttr?: THREE.BufferAttribute;
  trailCount: number;
  lastTrailPos: THREE.Vector3;
  label?: HTMLDivElement;
  cloudMesh?: THREE.Mesh;
  moonPivot?: THREE.Object3D;
  moonMesh?: THREE.Mesh;
  ringMesh?: THREE.Mesh;
}

export type SimState = {
  isPaused: boolean;
  speed: number;
  showOrbits: boolean;
  showLabels: boolean;
  showAsteroids: boolean;
  selectedPlanet: string | null;
  hoveredPlanet: string | null;
};

export type EnginePerfStats = {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  pixelRatio: number;
  qualityTier: 'high' | 'medium' | 'low';
};

const MAX_TRAIL_POINTS = 160;

// Easing function for smooth cinematic camera transitions
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class SolarSystemEngine {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private clock = new THREE.Clock();
  
  private planets: PlanetMesh[] = [];
  private sunMesh!: PlanetMesh;
  private proxyMeshes: THREE.Mesh[] = [];
  
  // Asteroid belt data
  private asteroidBelt?: THREE.InstancedMesh;
  private asteroidCount = 1200;
  private asteroidAngles!: Float32Array;
  private asteroidRadii!: Float32Array;
  private asteroidSpeeds!: Float32Array;
  private asteroidYOffsets!: Float32Array;
  private asteroidScales!: Float32Array;
  private asteroidDummy = new THREE.Object3D();
  
  // Starfield
  private starfieldPoints?: THREE.Points;
  
  // Hover glow mesh
  private hoverReticle!: THREE.Mesh;
  
  private container!: HTMLDivElement;
  private labelContainer!: HTMLDivElement;
  private animationId: number = 0;
  private resizeObserver?: ResizeObserver;
  
  // Reusable vectors/matrices to eliminate GC allocations
  private tempVecA = new THREE.Vector3();
  private tempVecB = new THREE.Vector3();
  private tempVecC = new THREE.Vector3();
  private tempVecD = new THREE.Vector3();
  private lastFollowPos = new THREE.Vector3();
  private cachedWidth = 0;
  private cachedHeight = 0;
  
  // Camera transition state
  private isCameraTransitioning = false;
  private cameraTransitionStart = 0;
  private cameraTransitionDuration = 2000;
  private cameraStartPos = new THREE.Vector3();
  private cameraEndPos = new THREE.Vector3();
  private cameraStartTarget = new THREE.Vector3();
  private cameraEndTarget = new THREE.Vector3();
  private cameraArcPeak = 0;
  private followTarget: PlanetMesh | null = null;
  private introRunning = true;
  
  // Simulation smoothing
  private currentSpeed = 1;
  private targetSpeed = 1;
  private pauseMultiplier = 1;
  public elapsedDays = 0;
  
  // Raycast throttling
  private lastRaycastTime = 0;
  private pendingRaycast = false;
  
  // Performance monitoring & adaptive quality
  private frameCount = 0;
  private lastFpsUpdateTime = 0;
  private rollingFrameTimes: number[] = [];
  public perfStats: EnginePerfStats = {
    fps: 60,
    frameTimeMs: 16.6,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    pixelRatio: 1.5,
    qualityTier: 'high',
  };
  
  // State
  public state: SimState = {
    isPaused: false,
    speed: 1,
    showOrbits: true,
    showLabels: true,
    showAsteroids: true,
    selectedPlanet: null,
    hoveredPlanet: null,
  };
  
  // Callbacks
  public onPlanetClick?: (name: string) => void;
  public onStateChange?: (state: SimState) => void;
  public onDayUpdate?: (days: number) => void;
  public onPerfUpdate?: (stats: EnginePerfStats) => void;
  
  constructor() {}
  
  init(container: HTMLDivElement, labelContainer: HTMLDivElement) {
    this.container = container;
    this.labelContainer = labelContainer;
    this.cachedWidth = container.clientWidth || window.innerWidth;
    this.cachedHeight = container.clientHeight || window.innerHeight;
    
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.cameraTransitionDuration = 600;
    }
    
    // Renderer setup with capped pixel ratio
    const initialPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(this.cachedWidth, this.cachedHeight, false);
    this.renderer.setPixelRatio(initialPixelRatio);
    this.perfStats.pixelRatio = initialPixelRatio;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);
    
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x010108);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      55,
      this.cachedWidth / this.cachedHeight,
      0.5,
      2500
    );
    // Start camera far away for the smooth cinematic entrance
    this.camera.position.set(180, 220, 320);
    
    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 600;
    this.controls.enablePan = true;
    this.controls.target.set(0, 0, 0);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x222238, 0.45);
    this.scene.add(ambientLight);
    
    const sunLight = new THREE.PointLight(0xffffff, 2.5, 600, 0.6);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);
    
    // Hover reticle mesh (smooth glowing ring)
    const reticleGeo = new THREE.RingGeometry(1.2, 1.35, 32);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthTest: false,
    });
    this.hoverReticle = new THREE.Mesh(reticleGeo, reticleMat);
    this.hoverReticle.renderOrder = 999;
    this.scene.add(this.hoverReticle);
    
    // Build scene components
    this.createStarfieldPoints();
    this.createSun();
    this.createPlanets();
    this.createAsteroidBelt();
    
    // Start cinematic intro fly-in
    this.startCameraTransition(
      new THREE.Vector3(55, 75, 125),
      new THREE.Vector3(0, 0, 0),
      2500,
      15
    );
    
    // Event listeners
    this.setupEventListeners();
    
    // Start single unified animation loop
    this.clock.start();
    this.lastFpsUpdateTime = performance.now();
    this.animate(performance.now());
  }
  
  private setupEventListeners() {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          this.handleResize(width, height);
        }
      }
    });
    this.resizeObserver.observe(this.container);
    
    const dom = this.renderer.domElement;
    dom.addEventListener('click', this.onClick);
    dom.addEventListener('pointermove', this.onPointerMove, { passive: true });
    
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    
    // User interaction cancels cinematic intro
    const cancelIntro = () => {
      if (this.introRunning) {
        this.introRunning = false;
      }
    };
    dom.addEventListener('pointerdown', cancelIntro, { once: true });
    window.addEventListener('keydown', cancelIntro, { once: true });
  }
  
  private handleResize(width: number, height: number) {
    this.cachedWidth = width;
    this.cachedHeight = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
  
  private onVisibilityChange = () => {
    if (document.hidden) {
      this.clock.stop();
    } else {
      this.clock.start();
    }
  };
  
  // Optimized Starfield: Single THREE.Points with 3,000 spectral stars
  private createStarfieldPoints() {
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    const rand = this.seededRandom(12345);
    const colorChoices = [
      new THREE.Color(0xdce7ff), // Blue-white
      new THREE.Color(0xffffff), // Pure white
      new THREE.Color(0xfff4d6), // Warm white
      new THREE.Color(0xffd29d), // Yellow giant
      new THREE.Color(0xff9e80), // Red giant
    ];
    
    for (let i = 0; i < starCount; i++) {
      // Distribute on a large celestial sphere radius 900-1100
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const dist = 950 + rand() * 150;
      
      positions[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = dist * Math.cos(phi);
      
      const col = colorChoices[Math.floor(rand() * colorChoices.length)];
      const brightness = 0.6 + rand() * 0.4;
      colors[i * 3] = col.r * brightness;
      colors[i * 3 + 1] = col.g * brightness;
      colors[i * 3 + 2] = col.b * brightness;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const mat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.9,
    });
    
    this.starfieldPoints = new THREE.Points(geo, mat);
    this.scene.add(this.starfieldPoints);
  }
  
  private createSun() {
    const sunCanvas = generateSunTexture(1024, 512);
    const texture = new THREE.CanvasTexture(sunCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    
    // Sun sphere: 48x24 segments is smooth and efficient
    const geo = new THREE.SphereGeometry(SUN_DATA.radius, 48, 24);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      color: 0xffffff,
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
    
    // Corona glow halo
    const glowGeo = new THREE.SphereGeometry(SUN_DATA.radius * 1.25, 32, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xfdb813,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    mesh.add(glow);
    
    // Outer atmospheric glow
    const outerGlowGeo = new THREE.SphereGeometry(SUN_DATA.radius * 1.6, 24, 12);
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff7b00,
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    mesh.add(outerGlow);
    
    // Invisible proxy sphere for fast raycasting
    const proxyGeo = new THREE.SphereGeometry(SUN_DATA.radius * 1.15, 12, 8);
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
    const proxySphere = new THREE.Mesh(proxyGeo, proxyMat);
    proxySphere.userData = { planetName: 'Sun' };
    this.scene.add(proxySphere);
    this.proxyMeshes.push(proxySphere);
    
    const label = this.createLabel('Sun');
    
    this.sunMesh = {
      name: 'Sun',
      data: SUN_DATA,
      mesh,
      pivot: mesh,
      proxySphere,
      trailCount: 0,
      lastTrailPos: new THREE.Vector3(),
      label,
    };
    this.planets.push(this.sunMesh);
  }
  
  private textureGenerators: Record<string, () => HTMLCanvasElement> = {
    Mercury: () => generateMercuryTexture(512, 256),
    Venus: () => generateVenusTexture(512, 256),
    Earth: () => generateEarthTexture(1024, 512),
    Mars: () => generateMarsTexture(512, 256),
    Jupiter: () => generateJupiterTexture(1024, 512),
    Saturn: () => generateSaturnTexture(1024, 512),
    Uranus: () => generateUranusTexture(512, 256),
    Neptune: () => generateNeptuneTexture(512, 256),
  };
  
  private createPlanets() {
    for (const planetData of PLANETS) {
      const texCanvas = this.textureGenerators[planetData.name]();
      const texture = new THREE.CanvasTexture(texCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = 4;
      
      // Segment count scaled by body size
      const segWidth = ['Jupiter', 'Saturn'].includes(planetData.name) ? 40 : 28;
      const segHeight = ['Jupiter', 'Saturn'].includes(planetData.name) ? 24 : 18;
      const geo = new THREE.SphereGeometry(planetData.radius, segWidth, segHeight);
      
      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.05,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.x = planetData.orbitDistance;
      mesh.rotation.z = planetData.axialTilt;
      
      // Pivot for orbital rotation
      const pivot = new THREE.Object3D();
      pivot.add(mesh);
      this.scene.add(pivot);
      
      // Orbit Line (Smooth circle precalculated)
      const orbitLine = this.createOrbitLine(planetData.orbitDistance);
      this.scene.add(orbitLine);
      
      // Preallocated Fixed Ring Buffer for Orbital Trail
      const trailPositions = new Float32Array(MAX_TRAIL_POINTS * 3);
      const trailGeo = new THREE.BufferGeometry();
      const trailAttr = new THREE.BufferAttribute(trailPositions, 3);
      trailAttr.setUsage(THREE.DynamicDrawUsage);
      trailGeo.setAttribute('position', trailAttr);
      trailGeo.setDrawRange(0, 0);
      
      const trailMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(planetData.color),
        transparent: true,
        opacity: 0.35,
      });
      const trail = new THREE.Line(trailGeo, trailMat);
      this.scene.add(trail);
      
      // Invisible proxy sphere for fast raycasting
      const proxyGeo = new THREE.SphereGeometry(planetData.radius * 1.4 + 0.5, 12, 8);
      const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
      const proxySphere = new THREE.Mesh(proxyGeo, proxyMat);
      proxySphere.userData = { planetName: planetData.name };
      mesh.add(proxySphere);
      this.proxyMeshes.push(proxySphere);
      
      const label = this.createLabel(planetData.name);
      
      const planetMesh: PlanetMesh = {
        name: planetData.name,
        data: planetData,
        mesh,
        pivot,
        proxySphere,
        orbitLine,
        trail,
        trailPositions,
        trailAttr,
        trailCount: 0,
        lastTrailPos: new THREE.Vector3(),
        label,
      };
      
      // Earth Cloud Layer
      if (planetData.name === 'Earth') {
        const cloudTex = new THREE.CanvasTexture(generateCloudTexture(512, 256));
        cloudTex.colorSpace = THREE.SRGBColorSpace;
        const cloudGeo = new THREE.SphereGeometry(planetData.radius * 1.025, 28, 18);
        const cloudMat = new THREE.MeshStandardMaterial({
          map: cloudTex,
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
        });
        const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        mesh.add(cloudMesh);
        planetMesh.cloudMesh = cloudMesh;
      }
      
      // Moon
      if (planetData.hasMoon) {
        const moonTex = new THREE.CanvasTexture(generateMoonTexture(256, 128));
        moonTex.colorSpace = THREE.SRGBColorSpace;
        const moonGeo = new THREE.SphereGeometry(planetData.moonRadius!, 18, 12);
        const moonMat = new THREE.MeshStandardMaterial({
          map: moonTex,
          roughness: 0.9,
          metalness: 0.05,
        });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.x = planetData.moonOrbitDistance!;
        
        const moonPivot = new THREE.Object3D();
        moonPivot.add(moonMesh);
        mesh.add(moonPivot);
        planetMesh.moonPivot = moonPivot;
        planetMesh.moonMesh = moonMesh;
      }
      
      // Saturn's Rings
      if (planetData.hasRings) {
        const ringTex = planetData.name === 'Saturn'
          ? new THREE.CanvasTexture(generateSaturnRingTexture(512))
          : null;
        if (ringTex) {
          ringTex.colorSpace = THREE.SRGBColorSpace;
        }
        
        const innerR = planetData.ringInnerRadius!;
        const outerR = planetData.ringOuterRadius!;
        const ringGeo = new THREE.RingGeometry(innerR, outerR, 64);
        
        // Correct UV mapping for radial concentric rings
        const pos = ringGeo.attributes.position;
        const uv = ringGeo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y2 = pos.getY(i);
          const dist = Math.sqrt(x * x + y2 * y2);
          const t = (dist - innerR) / (outerR - innerR);
          uv.setXY(i, t, 0.5);
        }
        
        const ringMat = new THREE.MeshBasicMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: planetData.name === 'Saturn' ? 0.88 : 0.35,
          color: planetData.name === 'Uranus' ? 0x7ec8e3 : undefined,
          depthWrite: false,
        });
        
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2 + planetData.axialTilt;
        mesh.add(ringMesh);
        planetMesh.ringMesh = ringMesh;
      }
      
      this.planets.push(planetMesh);
    }
  }
  
  private createOrbitLine(distance: number): THREE.Line {
    const segments = 128;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
      ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x334466,
      transparent: true,
      opacity: 0.28,
    });
    return new THREE.Line(geo, mat);
  }
  
  // Asteroid belt: Single InstancedMesh with precomputed typed array orbit parameters
  private createAsteroidBelt() {
    const count = this.asteroidCount;
    const geo = new THREE.IcosahedronGeometry(0.12, 0);
    const mat = new THREE.MeshLambertMaterial({
      color: 0x888899,
    });
    
    this.asteroidBelt = new THREE.InstancedMesh(geo, mat, count);
    this.asteroidBelt.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    this.asteroidAngles = new Float32Array(count);
    this.asteroidRadii = new Float32Array(count);
    this.asteroidSpeeds = new Float32Array(count);
    this.asteroidYOffsets = new Float32Array(count);
    this.asteroidScales = new Float32Array(count);
    
    const rand = this.seededRandom(777);
    
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 68 + rand() * 11;
      const y = (rand() - 0.5) * 2.8;
      const scale = 0.4 + rand() * 1.2;
      const speed = 0.28 + rand() * 0.12;
      
      this.asteroidAngles[i] = angle;
      this.asteroidRadii[i] = radius;
      this.asteroidYOffsets[i] = y;
      this.asteroidScales[i] = scale;
      this.asteroidSpeeds[i] = speed;
      
      this.asteroidDummy.position.set(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
      this.asteroidDummy.scale.set(scale, scale, scale);
      this.asteroidDummy.rotation.set(rand() * Math.PI, rand() * Math.PI, 0);
      this.asteroidDummy.updateMatrix();
      this.asteroidBelt.setMatrixAt(i, this.asteroidDummy.matrix);
    }
    
    this.asteroidBelt.instanceMatrix.needsUpdate = true;
    this.scene.add(this.asteroidBelt);
  }
  
  private createLabel(name: string): HTMLDivElement {
    const label = document.createElement('div');
    label.className = 'planet-hud-label';
    label.textContent = name;
    label.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 11px;
      font-weight: 500;
      font-family: 'Inter', system-ui, sans-serif;
      pointer-events: none;
      text-shadow: 0 0 8px rgba(96, 165, 250, 0.6), 0 1px 3px rgba(0,0,0,0.8);
      white-space: nowrap;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transform: translate3d(-9999px, -9999px, 0);
      will-change: transform, opacity;
      opacity: 0;
      transition: opacity 0.2s ease-out;
    `;
    this.labelContainer.appendChild(label);
    return label;
  }
  
  // Update orbital trails in preallocated Float32Array ring buffers (ZERO memory allocations)
  private updateTrails() {
    for (const planet of this.planets) {
      if (planet.name === 'Sun' || !planet.trailAttr || !planet.trailPositions) continue;
      
      planet.mesh.getWorldPosition(this.tempVecA);
      
      // Only append if planet moved sufficiently to prevent clustering
      if (this.tempVecA.distanceToSquared(planet.lastTrailPos) > 0.15) {
        planet.lastTrailPos.copy(this.tempVecA);
        
        const count = planet.trailCount;
        const positions = planet.trailPositions;
        
        if (count < MAX_TRAIL_POINTS) {
          positions[count * 3] = this.tempVecA.x;
          positions[count * 3 + 1] = this.tempVecA.y;
          positions[count * 3 + 2] = this.tempVecA.z;
          planet.trailCount++;
        } else {
          // Shift existing points back
          positions.copyWithin(0, 3, MAX_TRAIL_POINTS * 3);
          const lastIdx = (MAX_TRAIL_POINTS - 1) * 3;
          positions[lastIdx] = this.tempVecA.x;
          positions[lastIdx + 1] = this.tempVecA.y;
          positions[lastIdx + 2] = this.tempVecA.z;
        }
        
        planet.trailAttr.needsUpdate = true;
        planet.trail!.geometry.setDrawRange(0, planet.trailCount);
      }
    }
  }
  
  // Batched DOM label updates using transform3d (ZERO layout thrashing)
  private updateLabels() {
    const width = this.cachedWidth;
    const height = this.cachedHeight;
    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;
    const show = this.state.showLabels;
    
    for (const planet of this.planets) {
      if (!planet.label) continue;
      
      if (!show) {
        planet.label.style.opacity = '0';
        continue;
      }
      
      planet.mesh.getWorldPosition(this.tempVecA);
      this.tempVecB.copy(this.tempVecA).project(this.camera);
      
      // Cull if behind camera or outside viewport bounds
      if (
        this.tempVecB.z > 1 ||
        this.tempVecB.x < -1.1 ||
        this.tempVecB.x > 1.1 ||
        this.tempVecB.y < -1.1 ||
        this.tempVecB.y > 1.1
      ) {
        planet.label.style.opacity = '0';
        continue;
      }
      
      const x = Math.round(this.tempVecB.x * halfWidth + halfWidth);
      const y = Math.round(-this.tempVecB.y * halfHeight + halfHeight);
      
      const data = planet.data;
      const radius = 'radius' in data ? (data.radius ?? 1) : 12;
      const yOffset = Math.min(60, Math.max(16, radius * 14));
      
      planet.label.style.transform = `translate3d(${x}px, ${y - yOffset}px, 0) translate(-50%, -100%)`;
      planet.label.style.opacity = '1';
    }
  }
  
  // Throttled raycasting against lightweight proxy spheres
  private updateRaycasting() {
    const now = performance.now();
    if (!this.pendingRaycast || now - this.lastRaycastTime < 60) return;
    this.lastRaycastTime = now;
    this.pendingRaycast = false;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.proxyMeshes, false);
    
    let hovered: string | null = null;
    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      hovered = hit.userData.planetName || null;
    }
    
    if (hovered !== this.state.hoveredPlanet) {
      this.state.hoveredPlanet = hovered;
      this.renderer.domElement.style.cursor = hovered ? 'pointer' : 'default';
      this.onStateChange?.(this.state);
      
      // Position hover reticle
      if (hovered) {
        const planet = this.planets.find(p => p.name === hovered);
        if (planet) {
          planet.mesh.getWorldPosition(this.tempVecA);
          this.hoverReticle.position.copy(this.tempVecA);
          this.hoverReticle.lookAt(this.camera.position);
          const rad = 'radius' in planet.data ? (planet.data.radius ?? 1) : 12;
          this.hoverReticle.scale.setScalar(rad * 1.35);
          (this.hoverReticle.material as THREE.MeshBasicMaterial).opacity = 0.75;
        }
      } else {
        (this.hoverReticle.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }
  }
  
  // Unified, 60fps cinematic animation loop
  private animate = (now: number) => {
    this.animationId = requestAnimationFrame(this.animate);
    
    // Performance measurement
    this.frameCount++;
    const frameDeltaMs = now - (this.lastFpsUpdateTime || now);
    if (frameDeltaMs >= 500) {
      this.perfStats.fps = Math.round((this.frameCount * 1000) / frameDeltaMs);
      this.frameCount = 0;
      this.lastFpsUpdateTime = now;
      
      // Update info stats from WebGLRenderer
      const info = this.renderer.info;
      this.perfStats.drawCalls = info.render.calls;
      this.perfStats.triangles = info.render.triangles;
      this.perfStats.geometries = info.memory.geometries;
      this.perfStats.textures = info.memory.textures;
      this.onPerfUpdate?.(this.perfStats);
    }
    
    const rawDelta = this.clock.getDelta();
    // Clamp delta to 50ms to prevent huge jumps on tab return
    const delta = Math.min(rawDelta, 0.05);
    this.perfStats.frameTimeMs = Math.round(rawDelta * 10000) / 10;
    
    // Smooth speed transitions (exponential decay toward target)
    this.currentSpeed += (this.targetSpeed - this.currentSpeed) * (1 - Math.exp(-delta * 6));
    
    // Smooth pause transition (velocity ease out)
    const targetPause = this.state.isPaused ? 0 : 1;
    this.pauseMultiplier += (targetPause - this.pauseMultiplier) * (1 - Math.exp(-delta * 8));
    
    const effectiveDelta = delta * this.currentSpeed * this.pauseMultiplier;
    
    // Advance simulation time
    if (effectiveDelta > 0.0001) {
      this.elapsedDays += effectiveDelta * 12;
      this.onDayUpdate?.(this.elapsedDays);
      
      const baseSpeed = 0.0012 * effectiveDelta;
      
      // Planetary orbital and axial motions
      for (const planet of this.planets) {
        if (planet.name === 'Sun') {
          planet.mesh.rotation.y += 0.0008 * effectiveDelta;
          continue;
        }
        
        const data = planet.data as PlanetData;
        planet.pivot.rotation.y += baseSpeed * data.orbitalSpeedRatio * 8;
        planet.mesh.rotation.y += data.rotationSpeed * effectiveDelta * 4;
        
        if (planet.cloudMesh) {
          planet.cloudMesh.rotation.y += 0.004 * effectiveDelta;
        }
        
        if (planet.moonPivot && data.moonOrbitSpeed) {
          planet.moonPivot.rotation.y += baseSpeed * data.moonOrbitSpeed * 10;
        }
      }
      
      // Asteroid belt motion (dynamic instance matrix update)
      if (this.state.showAsteroids && this.asteroidBelt) {
        const asteroidStep = baseSpeed * 3;
        for (let i = 0; i < this.asteroidCount; i++) {
          this.asteroidAngles[i] += asteroidStep * this.asteroidSpeeds[i];
          const angle = this.asteroidAngles[i];
          const radius = this.asteroidRadii[i];
          const y = this.asteroidYOffsets[i];
          const scale = this.asteroidScales[i];
          
          this.asteroidDummy.position.set(
            Math.cos(angle) * radius,
            y,
            Math.sin(angle) * radius
          );
          this.asteroidDummy.scale.set(scale, scale, scale);
          this.asteroidDummy.updateMatrix();
          this.asteroidBelt.setMatrixAt(i, this.asteroidDummy.matrix);
        }
        this.asteroidBelt.instanceMatrix.needsUpdate = true;
      }
      
      if (this.state.showOrbits) {
        this.updateTrails();
      }
    }
    
    // Slow starfield rotation for depth
    if (this.starfieldPoints) {
      this.starfieldPoints.rotation.y += delta * 0.005;
    }
    
    // Gentle Sun corona pulse (lightweight clock-based sine wave)
    if (this.sunMesh) {
      const pulse = 1 + Math.sin(now * 0.002) * 0.02;
      this.sunMesh.mesh.children[0]?.scale.setScalar(pulse);
    }
    
    // Smooth Camera Fly-to Transition with Eased Hermite Curve
    if (this.isCameraTransitioning) {
      const elapsed = now - this.cameraTransitionStart;
      const progress = Math.min(1, elapsed / this.cameraTransitionDuration);
      const ease = easeInOutCubic(progress);
      
      // Arc path slightly above the ecliptic plane
      const arc = Math.sin(progress * Math.PI) * this.cameraArcPeak;
      
      this.camera.position.lerpVectors(this.cameraStartPos, this.cameraEndPos, ease);
      this.camera.position.y += arc;
      
      this.controls.target.lerpVectors(this.cameraStartTarget, this.cameraEndTarget, ease);
      
      if (progress >= 1) {
        this.isCameraTransitioning = false;
        if (this.introRunning) {
          this.introRunning = false;
        }
      }
    }
    
    // Smooth Follow Target Mode (Zero Jitter delta follower)
    if (!this.isCameraTransitioning && this.followTarget && this.followTarget.name !== 'Sun') {
      this.followTarget.mesh.getWorldPosition(this.tempVecA);
      
      // Apply delta vector to camera position and controls target
      this.tempVecB.subVectors(this.tempVecA, this.lastFollowPos);
      this.camera.position.add(this.tempVecB);
      this.controls.target.add(this.tempVecB);
      
      this.lastFollowPos.copy(this.tempVecA);
    }
    
    // Update hover reticle orientation
    if (this.state.hoveredPlanet && (this.hoverReticle.material as THREE.MeshBasicMaterial).opacity > 0) {
      this.hoverReticle.lookAt(this.camera.position);
    }
    
    // Visibility Toggles
    for (const planet of this.planets) {
      if (planet.orbitLine) {
        planet.orbitLine.visible = this.state.showOrbits;
      }
      if (planet.trail) {
        planet.trail.visible = this.state.showOrbits;
      }
    }
    if (this.asteroidBelt) {
      this.asteroidBelt.visible = this.state.showAsteroids;
    }
    
    this.controls.update();
    this.updateLabels();
    this.updateRaycasting();
    
    this.renderer.render(this.scene, this.camera);
  };
  
  // === Public Control Methods ===
  
  startCameraTransition(
    targetPos: THREE.Vector3,
    targetLook: THREE.Vector3,
    durationMs: number = 2000,
    arcPeak: number = 10
  ) {
    this.cameraStartPos.copy(this.camera.position);
    this.cameraEndPos.copy(targetPos);
    this.cameraStartTarget.copy(this.controls.target);
    this.cameraEndTarget.copy(targetLook);
    this.cameraArcPeak = arcPeak;
    this.cameraTransitionDuration = durationMs;
    this.cameraTransitionStart = performance.now();
    this.isCameraTransitioning = true;
  }
  
  focusOnPlanet(name: string) {
    const planet = this.planets.find(p => p.name === name);
    if (!planet) return;
    
    planet.mesh.getWorldPosition(this.tempVecA);
    this.lastFollowPos.copy(this.tempVecA);
    
    const data = planet.data;
    const radius = 'radius' in data ? (data.radius ?? 1) : 12;
    // Sane framing distance proportional to body radius
    const distance = Math.max(4.5, radius * 3.6 + 3.5);
    
    // Position camera at a 45-degree elevated viewpoint relative to planet
    this.tempVecB.set(
      this.tempVecA.x + distance * 0.72,
      this.tempVecA.y + distance * 0.55,
      this.tempVecA.z + distance * 0.72
    );
    
    this.followTarget = planet.name !== 'Sun' ? planet : null;
    this.startCameraTransition(this.tempVecB, this.tempVecA, 2000, Math.min(25, distance * 0.8));
    
    this.state.selectedPlanet = name;
    this.onStateChange?.(this.state);
  }
  
  resetCamera() {
    this.followTarget = null;
    this.startCameraTransition(
      new THREE.Vector3(55, 75, 125),
      new THREE.Vector3(0, 0, 0),
      1800,
      12
    );
    this.state.selectedPlanet = null;
    this.onStateChange?.(this.state);
  }
  
  togglePause() {
    this.state.isPaused = !this.state.isPaused;
    this.onStateChange?.(this.state);
  }
  
  setSpeed(speed: number) {
    this.targetSpeed = speed;
    this.state.speed = speed;
    this.onStateChange?.(this.state);
  }
  
  toggleOrbits() {
    this.state.showOrbits = !this.state.showOrbits;
    this.onStateChange?.(this.state);
  }
  
  toggleLabels() {
    this.state.showLabels = !this.state.showLabels;
    this.onStateChange?.(this.state);
  }
  
  toggleAsteroids() {
    this.state.showAsteroids = !this.state.showAsteroids;
    this.onStateChange?.(this.state);
  }
  
  getPlanetNames(): string[] {
    return this.planets.map(p => p.name);
  }
  
  getPlanetData(name: string): PlanetData | typeof SUN_DATA | undefined {
    return this.planets.find(p => p.name === name)?.data;
  }
  
  private onClick = (event: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.proxyMeshes, false);
    
    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const planetName = hit.userData.planetName;
      if (planetName) {
        this.focusOnPlanet(planetName);
        this.onPlanetClick?.(planetName);
      }
    }
  };
  
  private onPointerMove = (event: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.pendingRaycast = true;
  };
  
  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  
  // Comprehensive resource disposal on unmount
  dispose() {
    cancelAnimationFrame(this.animationId);
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    const dom = this.renderer.domElement;
    dom.removeEventListener('click', this.onClick);
    dom.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    
    // Recursive scene disposal
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.Line).isLine || (obj as THREE.Points).isPoints) {
        const item = obj as THREE.Mesh;
        if (item.geometry) {
          item.geometry.dispose();
        }
        if (item.material) {
          if (Array.isArray(item.material)) {
            for (const mat of item.material) {
              if (mat.map) mat.map.dispose();
              mat.dispose();
            }
          } else {
            if (item.material.map) item.material.map.dispose();
            item.material.dispose();
          }
        }
      }
    });
    
    this.renderer.dispose();
    this.controls.dispose();
    
    // Clear DOM labels
    while (this.labelContainer.firstChild) {
      this.labelContainer.removeChild(this.labelContainer.firstChild);
    }
  }
}
