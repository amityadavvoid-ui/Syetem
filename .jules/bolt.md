## 2024-05-23 - Particle System Optimization
**Learning:** The application was spawning individual `requestAnimationFrame` loops for each particle inside `spawnParticle`, creating O(N) active loops. A single centralized loop handling all particles significantly reduces overhead.
**Action:** When working with particle systems or repeating animations, always verify if a centralized loop is used versus per-entity loops.
