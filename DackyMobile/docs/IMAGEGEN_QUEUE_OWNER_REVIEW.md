# IMAGEGEN_QUEUE — owner review proposal, HOLD
No generation invoked. Reuse first. Counts are provisional based on observed E1 visuals; do not commission all candidates automatically. Existing Luna queue includes 58 non-Mobile portraits and unmatched combat effect types: keep both; coordinate IDs to avoid duplicated work.

## P1 — City terrain, two masters
- CITY-INNER-GROUND: 1440×760 composition (same viewBox as ART13; source at 2x 2880×1520 if available), landscape, raised front-facing bird's eye perspective; no fixed buildings, no text; reserve all existing independent plot anchors. Reference the exact ART13 runtime, preserve outer scenic border and palace separately. Replace only flat stone courtyard and repetitive terraces; subtle varied stone texture, coherent stairs and garden edges, believable painted depth; no isometric diamond grid, no hard rectangular pasted foreground. Output flattened terrain layer, not gameplay mockup.
- CITY-OUTER-GROUND: same composition/anchors, no built farms or buildings; lush painted countryside with paths naturally blended into vegetation, irrigation, low embankments, distant mountain and river; keep plot footprints unobstructed and consistent with ART13. No grid, no labels, no HUD, no pre-baked gameplay objects. Preserve exact interaction coordinates.

## P2 — Independent city building sprites
- First compare 20 existing legacy images and 27 ART13 sprites; keep palace and gate. Produce only genuinely weak/mismatched entries. Begin with a 4-building pilot (farm, residential, market, granary) only when generation available. Distinct silhouettes, painterly high detail, matching front-biased raised angle, jade/bronze/red lacquer/blue-grey roofs, warm upper-left light, consistent scale and ground contact, fully isolated with clean alpha, no frame/text/background, one asset at a time; 512×512 or 768×512 master with safe padding, crop without changing feet. Test inside actual runtime before authorizing rest. Functional ID, pivot, source hash and final display size recorded.
- Never replace approved art with vector placeholders. If a farm sprite is suitable at runtime, skip generation.

## P2 — World nodes / PvE tiles
- Reuse source world map and four city icons. Only after correcting asynchronous load and reviewing focus/normal, consider separate transparent markers for Tiên Sơn, dã địa, Boss and resource sites if no suitable existing art. 256×256 masters, matching parchment map perspective, legible at 40–80px, no labels.
- Reuse existing battle backgrounds before commissioning new ones. Optional 16:9 landscape source art for modes genuinely lacking an appropriate background, no baked UI.

## P3 — Heroes and VFX (Luna queue)
- 58 non-Mobile portraits only, not 482 already sourced identities. 512×640 master, chest-up, matching Phong Thần source portraits, distinctive character, clean alpha, no text.
- Only unmatched VFX event types after checking 120 battle sprite files and existing 4 effect assets. Match source frame strip dimensions/anchor/fps; exact frame count driven by runtime event contract. No blanket atlas or effects before audit.

## No ImageGen needed
Nav icons already implemented in city mode; 19 tech icons; 1,959 item source images; 187 unique source portrait files; source world parchment and UI frames; existing troop icons and combat backgrounds. Fix mapping or use semantically accurate existing art first.
