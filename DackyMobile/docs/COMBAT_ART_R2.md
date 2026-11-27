# Combat Art R2
- Baseline CI 45994577021 passed. Baseline screenshot showed armies floating in valley art and labels detached from troop ranks.
- R2 changes shared battle presentation only: anchored feet, denser ranks, commanders, distinct approach/attack/return and hit display, actual event loss labels, event priorities, 7 external VFX atlases. No engine/save changes.
- Open field from project-owned Heoofgaia recreation: pinned source SHA256, optional build-time fetch; fallback to existing Dacky scene if source unavailable. Read generated receipt before claiming transfer.
- Test all atlas variants, real squad/replay and controlled renderer fixtures; fixture is not an assertion that each skill naturally occurs in the campaign.
- Full 100 VFX target and additional creature identities remain pending.

## First R2 runtime review
CI 46017220699: 146 Node tests passed; offline build passed; Heoofgaia source downloaded with exact SHA256 and optimized to 64680-byte WebP (f8550f51690387b392ed8b46e7ea031ac005954983e9cb8f59fe623be07e999c). Actual squad screenshot showed grounded formations and commander sprites, but Chromium hit a real click blocker: the fixed HUD had conflicting top and bottom constraints. Corrected selector specificity and pointer-events, and capped the number of representative soldiers at the real troop count. Rerun required; initial R2 browser run was FAIL.
