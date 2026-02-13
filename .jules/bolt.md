## 2026-02-13 - [Vanilla JS Particle System]
**Learning:** Found multiple `requestAnimationFrame` calls spawned for each particle in `ui.js`, causing measurable main-thread overhead.
**Action:** Always consolidate repeated animations into a single loop manager (e.g., `updateParticlesLoop`) instead of per-entity closures in vanilla JS environments.
