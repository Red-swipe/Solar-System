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
  generateStarfieldTexture,
} from './textures';

export interface PlanetMesh {
  name: string;
  data: PlanetData | typeof SUN_DATA;
  mesh: THREE.Mesh;
  pivot: THREE.Object3D;
  orbitLine?: THREE.Line;
  trail?: THREE.Line;
  trailPoints: THREE.Vector3[];
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
  elapsedDays: number;
};

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
  private asteroidBelt?: THREE.InstancedMesh;
  private asteroidPivot?: THREE.Object3D;
  
  private container!: HTMLDivElement;
  private labelContainer!: HTMLDivElement;
  private animationId: number = 0;
  
  // Camera animation
  private cameraTarget: THREE.Vector3 | null = null;
  private cameraLookTarget: THREE.Vector3 | null = null;
  private cameraAnimating = false;
  private followTarget: PlanetMesh | null = null;
  
  // State
  public state: SimState = {
    isPaused: false,
    speed: 1,
    showOrbits: true,
    showLabels: true,
    showAsteroids: true,
    selectedPlanet: null,
    elapsedDays: 0,
  };
  
  // Callbacks
  public onPlanetClick?: (name: string) => void;
  public onStateChange?: (state: SimState) => void;
  
  constructor() {}
  
  init(container: HTMLDivElement, labelContainer: HTMLDivElement) {
    this.container = container;
    this.labelContainer = labelContainer;
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);
    
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000005);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(50, 80, 120);
    
    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 500;
    this.controls.enablePan = true;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x222233, 0.3);
    this.scene.add(ambientLight);
    
    const sunLight = new THREE.PointLight(0xffffff, 2, 500, 0.5);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);
    
    // Build scene
    this.createStarfield();
    this.createSun();
    this.createPlanets();
    this.createAsteroidBelt();
    
    // Events
    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('click', this.onClick);
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.style.cursor = 'default';
    
    // Start
    this.animate();
  }
  
  private createStarfield() {
    const texture = new THREE.CanvasTexture(generateStarfieldTexture(2048));
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const geo = new THREE.SphereGeometry(900, 64, 32);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
    });
    const starfield = new THREE.Mesh(geo, mat);
    this.scene.add(starfield);
  }
  
  private createSun() {
    const texture = new THREE.CanvasTexture(generateSunTexture(1024));
    const geo = new THREE.SphereGeometry(SUN_DATA.radius, 64, 32);
    
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      color: new THREE.Color(SUN_DATA.color),
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
    
    // Sun glow
    const glowGeo = new THREE.SphereGeometry(SUN_DATA.radius * 1.4, 32, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xFDB813,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    this.scene.add(glow);
    
    // Outer glow
    const outerGlowGeo = new THREE.SphereGeometry(SUN_DATA.radius * 2, 32, 16);
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xFF8C00,
      transparent: true,
      opacity: 0.03,
      side: THREE.BackSide,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    this.scene.add(outerGlow);
    
    // Create label
    const label = this.createLabel('Sun');
    
    this.sunMesh = {
      name: 'Sun',
      data: SUN_DATA,
      mesh,
      pivot: mesh,
      trailPoints: [],
      label,
    };
    this.planets.push(this.sunMesh);
  }
  
  private textureGenerators: Record<string, (size?: number) => HTMLCanvasElement> = {
    Mercury: generateMercuryTexture,
    Venus: generateVenusTexture,
    Earth: generateEarthTexture,
    Mars: generateMarsTexture,
    Jupiter: generateJupiterTexture,
    Saturn: generateSaturnTexture,
    Uranus: generateUranusTexture,
    Neptune: generateNeptuneTexture,
  };
  
  private createPlanets() {
    for (const planetData of PLANETS) {
      const textureGen = this.textureGenerators[planetData.name];
      const texSize = ['Jupiter', 'Saturn', 'Earth'].includes(planetData.name) ? 1024 : 512;
      const texture = new THREE.CanvasTexture(textureGen(texSize));
      
      const geo = new THREE.SphereGeometry(planetData.radius, 32, 16);
      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.x = planetData.orbitDistance;
      
      // Axial tilt
      mesh.rotation.z = planetData.axialTilt;
      
      // Orbit pivot
      const pivot = new THREE.Object3D();
      pivot.add(mesh);
      this.scene.add(pivot);
      
      // Orbit line
      const orbitLine = this.createOrbitLine(planetData.orbitDistance);
      this.scene.add(orbitLine);
      
      // Trail
      const trailPoints: THREE.Vector3[] = [];
      const trailGeo = new THREE.BufferGeometry();
      const trailMat = new THREE.LineBasicMaterial({
        color: planetData.color,
        transparent: true,
        opacity: 0.4,
      });
      const trail = new THREE.Line(trailGeo, trailMat);
      this.scene.add(trail);
      
      // Label
      const label = this.createLabel(planetData.name);
      
      const planetMesh: PlanetMesh = {
        name: planetData.name,
        data: planetData,
        mesh,
        pivot,
        orbitLine,
        trail,
        trailPoints,
        label,
      };
      
      // Earth's cloud layer
      if (planetData.name === 'Earth') {
        const cloudTex = new THREE.CanvasTexture(generateCloudTexture(1024));
        const cloudGeo = new THREE.SphereGeometry(planetData.radius * 1.02, 32, 16);
        const cloudMat = new THREE.MeshStandardMaterial({
          map: cloudTex,
          transparent: true,
          opacity: 0.6,
          depthWrite: false,
        });
        const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        mesh.add(cloudMesh);
        planetMesh.cloudMesh = cloudMesh;
      }
      
      // Moon
      if (planetData.hasMoon) {
        const moonTex = new THREE.CanvasTexture(generateMoonTexture(256));
        const moonGeo = new THREE.SphereGeometry(planetData.moonRadius!, 16, 8);
        const moonMat = new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.9 });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.x = planetData.moonOrbitDistance!;
        const moonPivot = new THREE.Object3D();
        moonPivot.add(moonMesh);
        mesh.add(moonPivot);
        planetMesh.moonPivot = moonPivot;
        planetMesh.moonMesh = moonMesh;
      }
      
      // Saturn rings
      if (planetData.hasRings) {
        const ringTex = planetData.name === 'Saturn'
          ? new THREE.CanvasTexture(generateSaturnRingTexture(1024))
          : null;
        
        const innerR = planetData.ringInnerRadius!;
        const outerR = planetData.ringOuterRadius!;
        const ringGeo = new THREE.RingGeometry(innerR, outerR, 64);
        
        // Fix UV mapping for ring
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
          opacity: planetData.name === 'Saturn' ? 0.85 : 0.3,
          color: planetData.name === 'Uranus' ? 0x7EC8E3 : undefined,
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
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
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
      opacity: 0.3,
    });
    return new THREE.Line(geo, mat);
  }
  
  private createAsteroidBelt() {
    const count = 1500;
    const geo = new THREE.IcosahedronGeometry(0.15, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.2,
    });
    
    const instancedMesh = new THREE.InstancedMesh(geo, mat, count);
    const dummy = new THREE.Object3D();
    const rand = this.seededRandom(777);
    
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const distance = 68 + rand() * 10;
      const height = (rand() - 0.5) * 3;
      const scale = 0.3 + rand() * 1.5;
      
      dummy.position.set(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
      );
      dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      dummy.scale.set(scale, scale * (0.5 + rand() * 0.5), scale);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    
    const pivotObj = new THREE.Object3D();
    pivotObj.add(instancedMesh);
    this.scene.add(pivotObj);
    this.asteroidBelt = instancedMesh;
    this.asteroidPivot = pivotObj;
  }
  
  private createLabel(name: string): HTMLDivElement {
    const label = document.createElement('div');
    label.className = 'planet-label';
    label.textContent = name;
    label.style.cssText = `
      position: absolute;
      color: white;
      font-size: 11px;
      font-family: 'Inter', sans-serif;
      pointer-events: none;
      text-shadow: 0 0 8px rgba(100,150,255,0.6), 0 0 2px black;
      white-space: nowrap;
      transform: translate(-50%, -100%);
      padding: 2px 6px;
      letter-spacing: 0.5px;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    this.labelContainer.appendChild(label);
    return label;
  }
  
  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  
  private updateLabels() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    for (const planet of this.planets) {
      if (!planet.label) continue;
      
      const worldPos = new THREE.Vector3();
      planet.mesh.getWorldPosition(worldPos);
      
      const screenPos = worldPos.clone().project(this.camera);
      
      if (screenPos.z > 1 || !this.state.showLabels) {
        planet.label.style.opacity = '0';
        continue;
      }
      
      const x = (screenPos.x * 0.5 + 0.5) * width;
      const y = (-screenPos.y * 0.5 + 0.5) * height;
      
      const planetData = planet.data as PlanetData;
      const offset = (planetData.radius || SUN_DATA.radius) * 15;
      
      planet.label.style.left = `${x}px`;
      planet.label.style.top = `${y - offset}px`;
      planet.label.style.opacity = '1';
    }
  }
  
  private updateTrails() {
    for (const planet of this.planets) {
      if (planet.name === 'Sun') continue;
      if (!planet.trail) continue;
      
      const worldPos = new THREE.Vector3();
      planet.mesh.getWorldPosition(worldPos);
      planet.trailPoints.push(worldPos.clone());
      
      // Keep last 200 points
      if (planet.trailPoints.length > 200) {
        planet.trailPoints.shift();
      }
      
      planet.trail.geometry.dispose();
      planet.trail.geometry = new THREE.BufferGeometry().setFromPoints(planet.trailPoints);
    }
  }
  
  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    
    const delta = this.clock.getDelta();
    
    if (!this.state.isPaused) {
      const speed = this.state.speed;
      const baseSpeed = 0.001 * speed;
      this.state.elapsedDays += delta * speed * 10;
      
      // Rotate planets in orbits
      for (const planet of this.planets) {
        if (planet.name === 'Sun') {
          planet.mesh.rotation.y += 0.001 * speed;
          continue;
        }
        
        const data = planet.data as PlanetData;
        
        // Orbital rotation
        planet.pivot.rotation.y += baseSpeed * data.orbitalSpeedRatio;
        
        // Axial rotation
        planet.mesh.rotation.y += data.rotationSpeed * speed;
        
        // Cloud rotation (Earth)
        if (planet.cloudMesh) {
          planet.cloudMesh.rotation.y += 0.003 * speed;
        }
        
        // Moon orbit
        if (planet.moonPivot && data.moonOrbitSpeed) {
          planet.moonPivot.rotation.y += baseSpeed * data.moonOrbitSpeed;
        }
      }
      
      // Rotate asteroid belt slowly
      if (this.asteroidPivot) {
        this.asteroidPivot.rotation.y += baseSpeed * 0.35;
      }
      
      this.updateTrails();
    }
    
    // Camera follow
    if (this.followTarget && this.followTarget.name !== 'Sun') {
      const worldPos = new THREE.Vector3();
      this.followTarget.mesh.getWorldPosition(worldPos);
      this.controls.target.lerp(worldPos, 0.05);
    }
    
    // Camera animation
    if (this.cameraAnimating && this.cameraTarget && this.cameraLookTarget) {
      this.camera.position.lerp(this.cameraTarget, 0.03);
      this.controls.target.lerp(this.cameraLookTarget, 0.03);
      
      if (this.camera.position.distanceTo(this.cameraTarget) < 0.5) {
        this.cameraAnimating = false;
      }
    }
    
    // Toggle visibility
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
    this.renderer.render(this.scene, this.camera);
  };
  
  // === Public API ===
  
  focusOnPlanet(name: string) {
    const planet = this.planets.find(p => p.name === name);
    if (!planet) return;
    
    const worldPos = new THREE.Vector3();
    planet.mesh.getWorldPosition(worldPos);
    
    const data = planet.data as PlanetData;
    const distance = (data.radius || SUN_DATA.radius) * 5 + 5;
    
    this.cameraTarget = new THREE.Vector3(
      worldPos.x + distance * 0.7,
      worldPos.y + distance * 0.5,
      worldPos.z + distance * 0.7
    );
    this.cameraLookTarget = worldPos.clone();
    this.cameraAnimating = true;
    this.followTarget = planet.name !== 'Sun' ? planet : null;
    
    this.state.selectedPlanet = name;
    this.onStateChange?.(this.state);
  }
  
  resetCamera() {
    this.cameraTarget = new THREE.Vector3(50, 80, 120);
    this.cameraLookTarget = new THREE.Vector3(0, 0, 0);
    this.cameraAnimating = true;
    this.followTarget = null;
    this.state.selectedPlanet = null;
    this.onStateChange?.(this.state);
  }
  
  togglePause() {
    this.state.isPaused = !this.state.isPaused;
    this.onStateChange?.(this.state);
  }
  
  setSpeed(speed: number) {
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
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const meshes = this.planets.map(p => p.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);
    
    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const planet = this.planets.find(p => p.mesh === hit);
      if (planet) {
        this.focusOnPlanet(planet.name);
        this.onPlanetClick?.(planet.name);
      }
    }
  };
  
  private onMouseMove = (event: MouseEvent) => {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.planets.map(p => p.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);
    
    this.renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
  };
  
  private onResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };
  
  dispose() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.dispose();
    this.controls.dispose();
    // Remove labels
    while (this.labelContainer.firstChild) {
      this.labelContainer.removeChild(this.labelContainer.firstChild);
    }
  }
}
