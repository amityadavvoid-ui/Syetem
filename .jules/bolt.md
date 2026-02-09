## 2025-02-09 - [Anti-Pattern] Recursive RequestAnimationFrame Closures
**Learning:** Found instances of `requestAnimationFrame` being called recursively inside a closure for each particle, creating a new closure every frame. This causes high memory churn and garbage collection pressure.
**Action:** Replace with a single module-level `update` loop and iterate over state objects instead of DOM elements/closures. Use reverse iteration when modifying the array in-place.
