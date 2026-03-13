## 2026-03-13 - [Centralized Animation Loops]
**Learning:** Animating multiple elements with individual `requestAnimationFrame` loops per DOM node causes high garbage collection overhead and potential frame drops in Vanilla JS.
**Action:** Always centralize animations in a single `requestAnimationFrame` loop that iterates over a shared state array rather than creating multiple closures.
