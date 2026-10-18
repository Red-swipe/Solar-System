import { useEffect, useRef, useState, useCallback } from 'react';
import { SolarSystemEngine, type SimState, type EnginePerfStats } from '../engine/SolarSystemEngine';
import { getPlanetDataByName } from '../data/planetsData';
import { ControlBar } from './ControlBar';
import { PlanetSelector } from './PlanetSelector';
import { PlanetInfoCard } from './PlanetInfoCard';
import { ViewToggles } from './ViewToggles';
import { PerfOverlay } from './PerfOverlay';

export function SolarSystemViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const dayCountRef = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<SolarSystemEngine | null>(null);
  
  const [simState, setSimState] = useState<SimState>({
    isPaused: false,
    speed: 1,
    showOrbits: true,
    showLabels: true,
    showAsteroids: true,
    selectedPlanet: null,
    hoveredPlanet: null,
  });
  
  const [infoPlanet, setInfoPlanet] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [perfStats, setPerfStats] = useState<EnginePerfStats>({
    fps: 60,
    frameTimeMs: 16.6,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    pixelRatio: 1.5,
    qualityTier: 'high',
  });
  
  useEffect(() => {
    if (!containerRef.current || !labelRef.current) return;
    
    // Safety guard against double mounting
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
    
    const engine = new SolarSystemEngine();
    engineRef.current = engine;
    
    // High-performance decoupled day counter update (ZERO React re-renders)
    let lastRenderedDay = -1;
    engine.onDayUpdate = (days) => {
      const intDay = Math.floor(days);
      if (intDay !== lastRenderedDay && dayCountRef.current) {
        lastRenderedDay = intDay;
        dayCountRef.current.textContent = `Day ${intDay.toLocaleString()}`;
      }
    };
    
    // State sync for UI buttons only
    engine.onStateChange = (state) => {
      setSimState({ ...state });
    };
    
    // Planet click handler
    engine.onPlanetClick = (name) => {
      setInfoPlanet(name);
    };
    
    // Performance stats for dev overlay
    engine.onPerfUpdate = (stats) => {
      setPerfStats({ ...stats });
    };
    
    // Initialize engine
    engine.init(containerRef.current, labelRef.current);
    setIsLoaded(true);
    
    // Global keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.code === 'Space') {
        e.preventDefault();
        engine.togglePause();
      } else if (e.code === 'Escape') {
        engine.resetCamera();
        setInfoPlanet(null);
      } else if (e.key >= '1' && e.key <= '9') {
        const planetList = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
        const target = planetList[parseInt(e.key, 10) - 1];
        if (target) {
          engine.focusOnPlanet(target);
          setInfoPlanet(target);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);
  
  const handlePlanetSelect = useCallback((name: string) => {
    engineRef.current?.focusOnPlanet(name);
    setInfoPlanet(name);
  }, []);
  
  const handleTogglePause = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);
  
  const handleSpeedChange = useCallback((speed: number) => {
    engineRef.current?.setSpeed(speed);
  }, []);
  
  const handleResetCamera = useCallback(() => {
    engineRef.current?.resetCamera();
    setInfoPlanet(null);
  }, []);
  
  const handleToggleOrbits = useCallback(() => {
    engineRef.current?.toggleOrbits();
  }, []);
  
  const handleToggleLabels = useCallback(() => {
    engineRef.current?.toggleLabels();
  }, []);
  
  const handleToggleAsteroids = useCallback(() => {
    engineRef.current?.toggleAsteroids();
  }, []);
  
  const handleCloseInfo = useCallback(() => {
    setInfoPlanet(null);
  }, []);
  
  const planetData = infoPlanet ? getPlanetDataByName(infoPlanet) : undefined;
  
  return (
    <main className="relative w-full h-screen overflow-hidden bg-black select-none">
      {/* Loading Splash (smooth fade out) */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-700 pointer-events-none ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-400 animate-spin" />
          <h1 className="text-white font-mono text-sm tracking-widest uppercase">Initializing Celestial Engine</h1>
          <p className="text-gray-500 text-xs font-mono">Generating procedural textures & orbits...</p>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      {/* 2D Screen-space projected labels */}
      <div ref={labelRef} className="absolute inset-0 z-10 pointer-events-none" />
      
      {/* Planet Selector - Top Navigation */}
      <PlanetSelector
        selectedPlanet={simState.selectedPlanet}
        hoveredPlanet={simState.hoveredPlanet}
        onSelect={handlePlanetSelect}
      />
      
      {/* View Toggles - Top Right */}
      <ViewToggles
        showOrbits={simState.showOrbits}
        showLabels={simState.showLabels}
        showAsteroids={simState.showAsteroids}
        onToggleOrbits={handleToggleOrbits}
        onToggleLabels={handleToggleLabels}
        onToggleAsteroids={handleToggleAsteroids}
      />
      
      {/* Playback Control Deck - Bottom */}
      <ControlBar
        ref={dayCountRef}
        isPaused={simState.isPaused}
        speed={simState.speed}
        onTogglePause={handleTogglePause}
        onSpeedChange={handleSpeedChange}
        onResetCamera={handleResetCamera}
      />
      
      {/* Planet Info Card - Right Drawer */}
      {infoPlanet && planetData && (
        <PlanetInfoCard
          name={infoPlanet}
          data={planetData}
          onClose={handleCloseInfo}
          onFlyTo={() => handlePlanetSelect(infoPlanet)}
        />
      )}

      {/* Dev-Only Performance HUD Overlay */}
      {import.meta.env.DEV && <PerfOverlay stats={perfStats} />}
    </main>
  );
}
