
## 2024-05-18 - [Reduce requestAnimationFrame calls in Particle Systems]
**Learning:** Found a major performance anti-pattern in `ui.js`: the particle system was spinning up an individual `requestAnimationFrame` loop for *each* active particle (up to 25 concurrently). This forces the browser to schedule and execute up to 25 separate callback functions per frame, significantly increasing frame render time and CPU overhead.
**Action:** When implementing or optimizing systems with many independent moving objects (like particles), always use a single global `requestAnimationFrame` loop that iterates over a state array (`activeParticles`) to update all elements in one pass.
