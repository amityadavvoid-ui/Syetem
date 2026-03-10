## 2026-03-10 - Centralize requestAnimationFrame loops for DOM Particles
**Learning:** Animating multiple elements with individual `requestAnimationFrame` loops per DOM node (e.g. background particles) causes high garbage collection overhead and potential frame drops, as it multiplies the callback queue.
**Action:** Always centralize animations in a single `rAF` loop that iterates over a shared state array (storing element, timing, and properties) rather than spawning independent closures for each element.
