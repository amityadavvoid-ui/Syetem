## 2024-05-24 - [Particle System Anti-pattern Fixed]
**Learning:** Animating multiple elements with individual `requestAnimationFrame` loops per DOM node causes high garbage collection overhead and potential frame drops.
**Action:** Always centralize animations in a single `rAF` loop that iterates over a shared state array instead of spawning new `rAF` loops per node.
