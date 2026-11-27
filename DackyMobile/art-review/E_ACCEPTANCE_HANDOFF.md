# E — source asset delivery and independent acceptance

## Verified delivery
- CI run 45942519166 PASS. Asset output commit 01ee570db020062e5adffa9a63bc381d1a444cbc.
- Asset artifact 15173392767: 19,080,301 bytes; 117 source copies including 27 ART13 sprites, 20 legacy sprites with only hidden RGB cleaned, terrain, manifests, UI, battle backgrounds, markers, tech/troop icons, effects and audio.
- 120 source animation GIFs, 1,293 lossless PNG frames, 24 source families, zero unsupported strip-layout holds. GIF encoder can combine adjacent identical frames; source frame PNGs preserve each frame. No new illustration, no production changes. Preview GIFs use a dark matte and 2x nearest-neighbor display.
- Existing ART13 visual style preserved; all 27 ART13 and 20 legacy building images individually opened. Keep palace and gate. Existing duplicate-function silhouettes (housing/storehouse, market/granary, caravan/stable, grove/lumber, foundry/foundryfield) require distinct source candidates or later ImageGen; no speculative replacement now.
- Proposed UI CSS: art-review/ui-icon-reuse.proposed.css copies existing city-mode icon rules and broadens their scope. Not imported into game, not visually tested yet. Luna must integrate into current HEAD, verify no regressions, preserve hide-HUD behavior.
## Luna snapshot
Snapshot 721956bda9b616872e137273a1e260fe05c539ae, CI 45941590451 success; actual Web, APK, AAB and runtime capture artifacts exist. 20 review-sized JPEG copies from this run in art-review/pack/luna-runtime. Opened developed inner/outer, normal hero, inventory, world, tech and focus-world in this pass.
- Inner: palace/outer landscape strong, foreground flat stone grid and repeated small trees; large sprites/labels overlap or truncate. Keep current coordinates and mechanics; no wholesale redraw.
- Outer: abrupt terrain seams, repetitive roads, duplicate resource building forms; terrain replacement remains IMAGEGEN_HOLD. Retain approved master until better painted art exists.
- HUD P0: all nav icons blank outside city; existing icons work in city. Reuse proposed rules. Starter item glyphs blank even in focus from E1; map existing source images with visual-only provenance. Do not invent item source stats.
- World P0: normal capture brown blank map, focus capture actual parchment map; fix screenshot/readiness and verify actual runtime, not generate a new map.
- Tech P0: first row visible in Luna normal capture, lower row still blank; await visible image decoding and verify fallback.
- Heroes P1: portrait is good, panel and equipment layout too low and bulky. Prioritize tabbed actions and visible gear.
- Current battle runtime has not been independently played or visually accepted. Source GIFs are not evidence of runtime combat integration. No device QA.
## Acceptance
Source packaging and exact geometry: PASS. Visual asset quality / complete product: HOLD. No code touched on Luna branch. No merge. Deliver the artifact and this note to Luna for selective integration and re-capture.
