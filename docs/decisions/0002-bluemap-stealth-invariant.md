# ADR 0002: Real-time BlueMap Trail Visualization and Anti-Cheat Stealth

## Status

Accepted

## Context

Players explore an open survival world and want to view their past journeys and real-time locations on a shared 3D web map. However, during Hide & Seek matches, real-time map tracking constitutes an unfair advantage and breaks game balance.

## Decisions

### 1. 3D Web Visualization via BlueMap

- BlueMap is embedded into the dashboard HUD, providing real-time 3D rendering of the world directly in the browser via WebGL.

### 2. Breadcrumb Movement Trails

- Player movements are tracked and rendered as colored polyline trails on the map interface with time-decay fading.

### 3. Absolute Hide & Seek Stealth Invariant

- During active Hide & Seek phases (`HIDING` and `SEEKING`), player location pins and trail updates are strictly masked across all public map endpoints and UI layers.
- A prominent alert notifies map viewers that a game is currently in progress.

## Consequences

- Requires coordination between `ExServerMod` (which manages match phases) and the web map layer to synchronize the stealth state.
