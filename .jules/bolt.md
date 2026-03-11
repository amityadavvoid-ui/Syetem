## 2024-03-11 - Centralized Animation Loops
**Learning:** In vanilla JavaScript, animating multiple elements with individual `requestAnimationFrame` closures causes high garbage collection overhead and potential frame drops.
**Action:** Always centralize animations in a single `rAF` loop that iterates over a shared state array.
