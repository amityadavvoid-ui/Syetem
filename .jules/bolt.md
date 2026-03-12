## 2024-05-18 - [Centralize requestAnimationFrame for DOM Elements]
**Learning:** Animating multiple elements with individual `requestAnimationFrame` loops per DOM node causes high garbage collection overhead and potential frame drops.
**Action:** Always centralize animations in a single `rAF` loop that iterates over a shared state array.
