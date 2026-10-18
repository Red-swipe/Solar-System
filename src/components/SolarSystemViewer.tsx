import { useEffect, useRef, useState, useCallback } from 'react';
import { SolarSystemEngine, type SimState } from '../engine/SolarSystemEngine';
import { ControlBar } from './ControlBar';
import { PlanetSelector } from './PlanetSelector';
import { PlanetInfoCard } from './PlanetInfoCard';
import { ViewToggles } from './ViewToggles';

export function SolarSystemViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SolarSystemEngine | null>(null);
  
  const [simState, setSimState] = useState<SimState>({
    isPaused: false,
    speed: 1,
    showOrbits: true,
    showLabels: true,
    showAsteroids: true,
    selectedPlanet: null,
    elapsedDays: 0,
  });
  
  const [infoPlanet, setInfoPlanet] = useState<string | null>(null);
  
  useEffect(() => {
    if (!containerRef.current || !labelRef.current) return;
    
    const engine = new SolarSystemEngine();
    engineRef.current = engine;
    
    engine.onStateChange = (state) => {
      setSimState({ ...state });
    };
    
    engine.onPlanetClick = (name) => {
      setInfoPlanet(name);
    };
    
    engine.init(containerRef.current, labelRef.current);
    
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        engine.togglePause();
      } else if (e.code === 'Escape') {
        engine.resetCamera();
        setInfoPlanet(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.dispose();
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
  
  const planetData = infoPlanet ? engineRef.current?.getPlanetData(infoPlanet) : undefined;
  
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 3D Canvas */}
      <div ref={containerRef} className="absolute inset-0" />
      
      {/* Label overlay */}
      <div ref={labelRef} className="absolute inset-0 pointer-events-none" />
      
      {/* Planet Selector - Top */}
      <PlanetSelector
        selectedPlanet={simState.selectedPlanet}
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
      
      {/* Control Bar - Bottom */}
      <ControlBar
        isPaused={simState.isPaused}
        speed={simState.speed}
        elapsedDays={simState.elapsedDays}
        onTogglePause={handleTogglePause}
        onSpeedChange={handleSpeedChange}
        onResetCamera={handleResetCamera}
      />
      
      {/* Planet Info Card - Right Side */}
      {infoPlanet && planetData && (
        <PlanetInfoCard
          name={infoPlanet}
          data={planetData}
          onClose={handleCloseInfo}
          onFlyTo={() => handlePlanetSelect(infoPlanet)}
        />
      )}
    </div>
  );
}
