# Dacky — independent art direction and product review
Baseline: E1 `41455f6c1888b981a5a2351654fbc7c1e056cfd4`; published review metadata matched that exact SHA. Date 2026-11-27. This branch is documentation only, not Luna's code branch. ART13 is locked, ART14 rejected. No new generated imagery.

## Evidence and limits
- 2,363 tracked files under assets (includes 2 manifest JSONs and audio; not 2,363 unique illustrations); complete file-level metadata inventory in ART_ASSET_TRIAGE.csv. 21 candidate source assets explicitly opened and visually inspected this pass, not the entire inventory.
- Existing source groups: 1,959 item images, 187 hero portraits, 19 research icons, 20 troop icons, 20 legacy city images, 4 map-city markers, 120 battle-ng files, 14 UI assets, 4 battle-fx images, 3 audio files, 2 battle backgrounds and one world map. Other project files remain protected.
- Opened 11 normal desktop captures, 3 focus captures, 2 landscape city captures. Older historical battle image also opened but is NOT evidence of current combat presentation.
- E1 UI audit recorded zero horizontal document overflow and zero *completed* broken visible images for 11 desktop screens. It did not count incomplete images or CSS background failures. Normal world/tech images were blank in capture but loaded in focus capture: likely asynchronous capture or render readiness; not proof of permanent missing art.
- Actual current E1 developed-city PNGs exceed connector image retrieval limit; review initial landscape images and prior ART13 source images only. Independent live play, current battle screenshots, current original Mobile gameplay capture, Android device checks not performed. No owner visual acceptance declared.
- Luna HEAD observed 721956bda9b616872e137273a1e260fe05c539ae. Its ledger reports 141/141 tests and Android build artifacts from f9462c6. These are reported by Luna, not independent replay.

## Art direction lock
Painted Chinese mythic strategy art: warm antique gold, jade green, red lacquer, blue-grey roofs, naturally lit painterly landscape. Existing ART13 palace and border panorama are the benchmark. Front-biased raised/top-down orthographic city, no new diagonal grid; independent alpha sprites anchored at the existing plot feet. Retain 28 inner / 37 outer plot rules. No wholesale redraw; preserve all source hashes. No code-drawn replacement buildings. Do not confuse geometry-based UI/icon layout with illustration production.
- Default camera: maximize visible game world; slim HUD with clear toggle and restore. Do not stretch backgrounds or crop gameplay plots.
- Building labels: full name on selected/hover detail; concise text and level badge at rest; avoid truncated labels like "Phủ q..." covering art. Empty land mark unobtrusive.
- Typography: use Vietnamese-readable UI font and real icons rather than relying on CJK fallback; avoid raw provenance labels in main play view (keep in details/library).
- UI: dark jade/ink shell, warm gold separators, source art panels used sparingly; avoid repeated flat dashboard boxes. Desktop and landscape first, portrait adapted without losing actions.

## Screen acceptance specification
| Screen | Observed finding | Required treatment | Priority |
|---|---|---|---|
| Inner city | Scenic rim and palace attractive; flat repetitive brick foreground; clipped labels; landscape map narrow between gutters | Keep panorama/palace and 28 parcels. Fix viewport scale and compact labels; eventually replace only ground with painted matching layer. | P1 reuse / P2 art |
| Outer city | Hard rectangular grass, bare parallel roads, empty fields | Keep 37 parcels and free placement. Improve existing composition; eventually new painted unoccupied terrain layer. | P1 reuse / P2 art |
| Common shell | Nav CJK glyphs blank outside city; resource glyphs tofu; city has working existing line icons | Reuse city icon CSS globally, add visible fallback and text, consistent HUD on all views. | P0 |
| Heroes | Good Jiang Ziya portrait; large panels, stats and gear below fold | Portrait-led dossier, compact roster, visible equip/skill/growth tabs; existing ink backdrop and parchment frame. | P1 |
| Army | Table/form dominant, only one troop portrait at fresh save | Source troop cards by role, readable quantities and training action, expandable queue details. | P1 |
| Inventory | All seven starter item glyphs blank even after focus | Map category-matched source icons for simulated starter items (visual mapping only); compact grid, filter, click-to-detail equip/use/sell. | P0 |
| World | Normal screenshot blank background, focus source map loaded; field nodes circular placeholders; some labels overlap | Fix image readiness first, retain parchment map, use city markers and distinct node silhouettes/legend; side detail collapsible. | P0/P1 |
| PvE | Three large cards, blank badges, source illustration; action partly low | Reuse source art, clear mode tabs and lock requirement, current objective and primary action visible. | P1 |
| Tech | Icons blank initially then visible in focus, dense prerequisites | Keep 19 existing icons, group by production/military/logistics; compact level/progress and requirements on detail. | P0/P1 |
| Quests | 49-page list and rows with large whitespace, tiny reward glyphs | Show active main quest, recommended action link, ready-to-claim and daily filter; full ledger separate. | P1 |
| Market | Beautiful panorama but form-heavy, both dropdowns initially same resource | Compact trader layout and exchange quote; prevent same-resource selection, show fee and preview. | P1 |
| Reports | Empty state has no shortcut, historical combat screenshot not current | Add action to campaign/world, inspect battle with actual settled report and combat theater. | P1 / HOLD |
| Settings | Functional but dashboard-like | Keep compact, clear save controls and device warnings; low art priority. | P3 |
| Library | Source portraits visible, source labels appropriate here | Keep search and provenance; optional secondary nav grouping. | P3 |

## Exact visual evidence
- [normal-heroes](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/normal-heroes.png)
- [normal-army](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/normal-army.png)
- [normal-inventory](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/normal-inventory.png)
- [normal-world](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/normal-world.png)
- [normal-pve](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/normal-pve.png)
- [normal-tech](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/normal-tech.png)
- [normal-quests](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/normal-quests.png)
- [normal-market](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/normal-market.png)
- [normal-reports](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/normal-reports.png)
- [normal-settings](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/normal-settings.png)
- [normal-library](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/normal-library.png)
- [focus-world](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/focus-world.png)
- [focus-tech](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/focus-tech.png)
- [focus-inventory](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/focus-inventory.png)
- [landscape-initial-city](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/landscape-initial-city.png)
- [landscape-initial-outer](https://vuanhtuan161094-byte.github.io/Dacky/review/art01/captures/landscape-initial-outer.png)
Web review: https://vuanhtuan161094-byte.github.io/Dacky/review/art01/

## Gate and workflow
1. Capture fixed fixture on exact SHA; wait for document.fonts.ready plus relevant image.decode/load, including map and icon images and visible CSS assets. Record incomplete and broken images separately.
2. Compare normal and focus; test on desktop 1280×720 and mobile 844×390 and 390×844.
3. Keep art where better; revert regressions. No full-game visual PASS until each screen is inspected, including populated late-game state, actual combat and settled report.
4. Integration belongs to Luna. This review branch only contains findings and source selection; no production game code edits.
