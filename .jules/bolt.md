## 2026-03-15 - [Centralized requestAnimationFrame loop]
**Learning:** [Animating multiple elements with individual `requestAnimationFrame` loops per DOM node causes high garbage collection overhead and potential frame drops.]
**Action:** [Always centralize animations in a single `rAF` loop that iterates over a shared state array.]
