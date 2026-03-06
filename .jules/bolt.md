## 2024-05-15 - [Consolidated requestAnimationFrame loops]
**Learning:** Having up to 25 concurrent `requestAnimationFrame` loops in a vanilla JS particle system caused unnecessary overhead and function closures. Modifying this to use a single `updateParticlesLoop` iterating over an array of state objects dramatically reduces main thread contention and memory usage.
**Action:** When creating visual systems with many elements, rely on a single central animation loop that updates a data structure instead of binding individual animation callbacks to elements.
