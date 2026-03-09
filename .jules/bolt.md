## 2024-05-24 - Consolidate Particle Animation Loops
**Learning:** In vanilla JS setups, animating many elements (e.g. particles) by creating an individual `requestAnimationFrame` loop per DOM node causes excessive closure generation and multiple callbacks, leading to high garbage collection overhead and potential frame drops.
**Action:** Always maintain a single centralized `requestAnimationFrame` loop that iterates over a state array (`{ element, startTime, duration }`) instead of creating concurrent `rAF` callbacks for each particle instance.
