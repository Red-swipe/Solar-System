# 🌌 3D Interactive Solar System

A high-performance, visually immersive 3D Solar System simulation built with **React 19**, **Three.js**, **TypeScript**, and **Tailwind CSS**.

![Solar System Overview](public/favicon.svg)

---

## 🚀 Live Simulation Features

- **☀️ Fully Orbiting Planetary System**: Accurate relative orbital periods, axial tilts, and rotation speeds for the Sun, 8 major planets (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune), Earth's Moon, and the Asteroid Belt.
- **🎨 100% Procedural Canvas Textures**:
  - Dynamically generated procedural textures via HTML5 Canvas mathematical noise & harmonic algorithms.
  - Zero external image assets or CDN dependencies — 100% self-contained and loads instantaneously.
  - Granular solar corona glow and boiling flares for the Sun.
  - Earth continents, oceans, and a semi-transparent rotating cloud sphere.
  - Saturn with double-sided alpha-blended rings featuring Cassini and Encke divisions.
  - Jupiter's atmospheric bands and the Great Red Spot.
  - 3,000+ procedural multi-spectral stars and deep space nebula backdrops.
- **🎯 Click-to-Focus Smooth Camera Navigation**:
  - Click any planet in the 3D scene or from the top quick selector to smoothly fly to and follow that celestial body.
  - Free orbit and zoom around any focused planet using mouse drag / scroll wheel.
  - Quick "Reset Camera" / Overview button to return to bird's-eye perspective.
- **⏱️ Playback & Simulation Speed Controls**:
  - Continuous speed slider ranging from **0.1x to 20x**.
  - One-click speed presets: `0.5x`, `1x`, `2x`, `5x`, `10x`, `20x`.
  - Pause / Play toggle with spacebar keyboard shortcut.
  - Real-time simulation day counter.
- **✨ Visual Display Toggles**:
  - **Orbits**: Toggle planetary orbit path rings and trailing movement ribbons.
  - **Labels**: Toggle dynamic screen-space projected planet name markers.
  - **Asteroids**: Toggle the 1,500+ tumbling asteroid belt.
- **📖 Scientific Data & Lore Cards**:
  - Glassmorphic modal drawer with astronomical details for each celestial body:
    - Diameter, Mass, Gravity, Day Length, Orbital Period, Average Surface Temperature, Moon Count, and Scientific Trivia.

---

## 🎮 Controls & Shortcuts

| Action | Control |
|---|---|
| **Rotate Camera** | Left Click + Drag |
| **Pan Camera** | Right Click + Drag |
| **Zoom In / Out** | Mouse Scroll Wheel / Trackpad Pinch |
| **Select / Focus Planet** | Click on any planet or top planet icon |
| **Reset View** | Press `Esc` or click the Reset Camera icon |
| **Play / Pause** | Press `Spacebar` or click the Play/Pause button |

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **3D Engine**: [Three.js](https://threejs.org/) (WebGL, Tone Mapping, Raycasting)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 💻 Getting Started Locally

1. Clone repository:
   ```bash
   git clone https://github.com/Red-swipe/Solar-System.git
   cd Solar-System
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
