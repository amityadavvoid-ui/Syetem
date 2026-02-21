## 2026-02-21 - Memory vs Codebase Conflict
**Learning:** The memory bank contained a statement ("The particle system in ui.js uses a single requestAnimationFrame loop...") that directly contradicted the actual codebase state (which used individual loops). This suggests that memories might sometimes describe *intended* states or be outdated.
**Action:** Always prioritize `read_file` output over memory context when determining the current state of the code. Use memory for context/intent, but verify with code.
