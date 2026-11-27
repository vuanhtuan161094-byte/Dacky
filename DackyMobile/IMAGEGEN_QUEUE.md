# Image generation queue

Updated 2026-11-27. **IMAGEGEN_HOLD** is active: the current product instruction allows asset reuse only and there is no image-generation budget in this task. Do not generate replacement art while this hold remains.

Existing 482 Mobile hero records already have local source portraits; 187 unique portrait files are hash-verified. The queue below is limited to known runtime gaps, not a request to recreate existing art.

| Asset ID | Screen/use | Reason | Size / view | Style reference | Transparency / frames | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `HERO-PORTRAIT-NONMOBILE-{hero-08,hero-10,hero-12,hero-15,hero-17,hero-18,hero-489..hero-540}` (58 masters) | Hero dossier, enemy commander and battle report | These 58 non-Mobile roster definitions are outside the 482 verified Mobile portrait set; they currently reuse lower-confidence/shared presentation art. Keep their identities distinct. | 512×640 px portrait, chest-up, three-quarter view, face readable at 96 px. | Current Mobile portrait rendering and the existing Phong Thần visual language; follow existing color, line and light treatment without copying a different game's UI. | Transparent PNG; one static frame per named hero. | Medium | IMAGEGEN_HOLD |
| `COMBAT-FX-EVENT-GAPS` (only event types without a matching bundled source effect) | Army and immortal battle theatre | Some event/effect mappings remain PARTIAL_RUNTIME. Reuse the existing 144-file Mobile art/audio set first; commission only the audited unmatched effects. | 1024×1024 px effect atlas, 4×4 cells, consistent center and safe margins; per-effect export after review. | Existing Mobile spell/VFX assets and ART13 palette, readable over both battlefield sides. | Transparent PNG; 16 separately addressable cells, no baked background. | Low | IMAGEGEN_HOLD |

## Complete production prompts

### `HERO-PORTRAIT-NONMOBILE-*`

> Produce one original, game-ready character portrait for **{hero ID and name}**, a named commander from the Chinese Fengshen mythic strategy setting. Use the runtime role and existing approved source/reference portrait for that same character when available; do not change the character's identity, gender, faction cues, age or equipment. Paint a distinctive face, chest-up three-quarter pose, period-appropriate layered armor or robes, controlled rim light, clean silhouette, rich but restrained jade, vermilion, bronze and ink colors. Match the detail density and brush finish of the project's bundled Mobile portrait set so this portrait sits beside existing heroes without looking like another game or a generic fantasy card. Center the figure, leave head/shoulder padding for UI crops, no text, no badges, no frame, no background, transparent PNG, 512×640 px, one pose, production-ready alpha edges. Do not invent a source claim or copy an unrelated MMORPG character.

### `COMBAT-FX-EVENT-GAPS`

> Create a production-ready transparent effect atlas for the **audited unmatched Combat event types only**: {event IDs, names and event context}. Draw each effect as a separate 256×256 cell in a 4×4 1024×1024 PNG atlas with equal pivots and safe margins. Use clear silhouettes, layered painted particles and controlled light, compatible with the project's existing Fengshen Mobile battle art and ART13 palette. Keep cells visually distinct over both dark and bright terrain. Do not include interface panels, text, characters, backgrounds, geometric placeholder rings or effects for event types already covered by bundled assets. Supply cell coordinates and a short timing/pivot note per effect; transparent background throughout.

Queue entries remain blocked until a future authorized image-generation pass; runtime work must continue with existing assets and explicit partial status.
